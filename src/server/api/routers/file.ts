/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-file @typescript-eslint/no-unsafe-member-access
import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import AWS from "aws-sdk";
import * as mammoth from "mammoth";
import { TRPCError } from "@trpc/server";
import { prisma } from "~/server/db";
import axios from "axios";
import { SummaryType, type ChatHistoryEntry } from "@prisma/client";
import { extractPdf } from "~/server/utils/extractPdf";
import { extractPagesFromFileText } from "~/server/utils/extractPagesFromFileText";
import { promptText, summarizeText } from "~/server/utils/ai";

const BUCKET_NAME = "learn-ai-m93";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

export const getDownloadUrl = async (key: string) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60,
  };

  const promise = new Promise<string>((resolve) => {
    s3.getSignedUrl("getObject", params, (err, data) => {
      if (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating download URL from AWS S3",
          cause: err?.message,
        });
      }

      resolve(data);
    });
  });

  return promise;
};

const transcribeImage = async (key: string): Promise<string> => {
  const textract = new AWS.Textract();

  let text = "";

  const promise = new Promise<string>((resolve) => {
    textract.detectDocumentText(
      {
        Document: {
          S3Object: {
            Bucket: BUCKET_NAME,
            Name: key,
          },
        },
      },
      (err, data) => {
        if (err) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error extracting text from image",
            cause: err?.message,
          });
        }

        if (data?.Blocks) {
          text = data.Blocks.filter((block) => block.BlockType === "LINE")
            .map((block) => block.Text)
            .join("\n");
        }

        resolve(text);
      },
    );
  });

  return promise;
};

const transcribeAudio = async (key: string): Promise<string> => {
  console.debug("Transcribing audio file", key);

  const transcribeService = new AWS.TranscribeService();

  const params: AWS.TranscribeService.StartTranscriptionJobRequest = {
    TranscriptionJobName: `JobName-${Date.now()}`, // Unique name for each transcription job
    IdentifyLanguage: true,
    MediaFormat: key.endsWith("mp3")
      ? "mp3"
      : key.endsWith("wav")
      ? "wav"
      : "mp4",
    Media: {
      MediaFileUri: `s3://${BUCKET_NAME}/${key}`,
    },
  };

  const response = await transcribeService
    .startTranscriptionJob(params)
    .promise();

  let job = response.TranscriptionJob!;

  while (job.TranscriptionJobStatus !== "COMPLETED") {
    console.debug("Waiting for transcription job to complete...");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const res = await transcribeService
      .getTranscriptionJob({
        TranscriptionJobName: job.TranscriptionJobName!,
      })
      .promise();

    job = res.TranscriptionJob!;
  }

  const transcriptUri = job.Transcript?.TranscriptFileUri;

  if (!transcriptUri) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error getting transcript URI",
    });
  }

  // Fetch the transcript result from the provided URI
  const transcriptResponse = await fetch(transcriptUri);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const transcriptData = await transcriptResponse.json();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return transcriptData.results.transcripts[0].transcript;
};

const extractAndStoreText = async (
  key: string,
): Promise<{
  text: string;
  numPages?: number;
}> => {
  const file = await prisma.file.findFirstOrThrow({
    where: {
      key,
    },
  });

  const downloadAsBuffer = async () => {
    const downloadUrl = await getDownloadUrl(key);
    const response = await axios.get<Buffer>(downloadUrl, {
      responseType: "arraybuffer",
    });
    return response.data;
  };

  let text = null;
  let numPages: number | undefined = undefined;

  if (file.type === "application/pdf") {
    const { text: t, numPages: n } = await extractPdf(await downloadAsBuffer());

    text = t;
    numPages = n;
  } else if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: await downloadAsBuffer(),
    });

    text = result.value;
  } else if (file.type.includes("image")) {
    text = await transcribeImage(key);
  } else if (file.type.includes("audio")) {
    text = await transcribeAudio(key);
  } else {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File type not supported",
    });
  }

  await prisma.file.update({
    where: {
      uid: file.uid,
    },
    data: {
      text,
      hasProcessed: true,
      numPages,
    },
  });

  return { text, numPages };
};

export const fileRouter = createTRPCRouter({
  onAfterUpload: privateProcedure
    .input(
      z.object({
        key: z.string().nonempty(),
        name: z.string().nonempty(),
        type: z.string().nonempty(),
        size: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.prisma.file.create({
        data: {
          key: input.key,
          name: input.name,
          type: input.type,
          userId: ctx.userId,
          size: input.size,
        },
      });

      void extractAndStoreText(input.key);

      return file;
    }),

  updateFile: privateProcedure
    .input(
      z.object({
        uid: z.string().nonempty(),
        name: z.string().nonempty(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.prisma.file.update({
        where: {
          uid: input.uid,
          userId: ctx.userId,
        },
        data: {
          name: input.name,
        },
      });

      return file;
    }),

  getFileByUid: privateProcedure
    .input(z.string().nonempty())
    .query(async ({ ctx, input }) => {
      const file = await ctx.prisma.file.findUnique({
        where: {
          uid: input,
          userId: ctx.userId,
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      let previewUrl: string | null = null;

      if (file.type.includes("image")) {
        previewUrl = await getDownloadUrl(file.key);
      }

      return { ...file, previewUrl };
    }),

  getAllUserFiles: privateProcedure.query(async ({ ctx }) => {
    const files = await ctx.prisma.file.findMany({
      select: {
        key: true,
        name: true,
        type: true,
        uid: true,
        userId: true,
        hasProcessed: true,
        createdAt: true,
        size: true,
        numPages: true,
      },
      where: {
        userId: ctx.userId,
      },
    });

    return files;
  }),

  getRecentSummaries: privateProcedure.query(async ({ ctx }) => {
    const summaries = await ctx.prisma.summary.findMany({
      select: {
        createdAt: true,
        fileUid: true,
        language: true,
        uid: true,
        file: {
          select: {
            name: true,
          },
        },
        pageStart: true,
        pageEnd: true,
        type: true,
      },
      where: {
        file: {
          userId: ctx.userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return summaries;
  }),

  getDownloadUrl: privateProcedure
    .input(z.object({ key: z.string().nonempty() }))
    .query(async ({ input }) => {
      return getDownloadUrl(input.key);
    }),

  createUploadUrl: privateProcedure
    .input(
      z.object({
        filename: z.string().nonempty(),
        filetype: z.string().nonempty(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const timeNow = new Date().getTime();
      const theKey = `${ctx.userId}/${timeNow}-${input.filename}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: theKey,
        Expires: 60,
        ContentType: input.filetype,
      };

      const promise = new Promise<{
        url: string;
        key: string;
      }>((resolve) => {
        s3.getSignedUrl("putObject", params, (err, data) => {
          if (err) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error creating upload URL from AWS S3",
              cause: err?.message,
            });
          }

          resolve({
            url: data,
            key: theKey,
          });
        });
      });

      return promise;
    }),

  getSummary: privateProcedure
    .input(z.string().nonempty())
    .query(async ({ ctx, input }) => {
      const summary = await ctx.prisma.summary.findUnique({
        where: {
          uid: input,
          file: {
            userId: ctx.userId,
          },
        },
      });

      if (!summary) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Summary not found",
        });
      }

      return summary;
    }),

  getSummaries: privateProcedure
    .input(
      z.object({
        fileUid: z.string().nonempty(),
        type: z.nativeEnum(SummaryType),
      }),
    )
    .query(async ({ ctx, input }) => {
      const summaries = await ctx.prisma.summary.findMany({
        select: {
          createdAt: true,
          fileUid: true,
          language: true,
          uid: true,
          pageStart: true,
          pageEnd: true,
          type: true,
        },
        where: {
          fileUid: input.fileUid,
          type: input.type,
        },
      });

      return summaries;
    }),

  getAllChats: privateProcedure
    .input(z.object({ fileUid: z.string().nonempty() }))

    .query(async ({ ctx, input }) => {
      const chats = await ctx.prisma.chat.findMany({
        select: {
          createdAt: true,
          fileUid: true,
          uid: true,
          firstQuestion: true,
        },
        where: {
          fileUid: input.fileUid,
        },
      });

      return chats;
    }),

  getChat: privateProcedure
    .input(z.object({ uid: z.string().nonempty() }))
    .query(async ({ ctx, input }) => {
      const chat = await ctx.prisma.chat.findUnique({
        select: {
          createdAt: true,
          fileUid: true,
          uid: true,
          firstQuestion: true,
          history: true,
        },
        where: {
          uid: input.uid,
        },
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      return chat;
    }),

  askQuestion: privateProcedure
    .input(
      z.object({
        fileUid: z.string().nonempty(),
        chatUid: z.string().optional(), // If not provided, a new chat will be created
        question: z.string().nonempty(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const file = await prisma.file.findFirst({
        where: {
          uid: input.fileUid,
          userId: ctx.userId,
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      if (!file.text) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File has not been processed yet",
        });
      }

      if (!input.chatUid) {
        const newChat = await prisma.chat.create({
          data: {
            fileUid: input.fileUid,
            firstQuestion: input.question,
          },
        });

        input.chatUid = newChat.uid;
      }

      const chat = await prisma.chat.findFirst({
        select: {
          history: true,
        },
        where: {
          uid: input.chatUid,
          fileUid: input.fileUid,
        },
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      let chatHistory: ChatHistoryEntry[] = [];

      if (chat.history) {
        // Order the chat history by date and trasform into a single string to feed into AI
        const orderedHistory = chat.history.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        chatHistory = orderedHistory;
      }

      const answer = await promptText(input.question, file.key, chatHistory);

      const newHistoryEntry = await prisma.chatHistoryEntry.create({
        data: {
          chatUid: input.chatUid,
          question: input.question,
          answer: answer,
        },
      });

      return newHistoryEntry;
    }),

  generateSummary: privateProcedure
    .input(
      z.object({
        type: z.nativeEnum(SummaryType),
        key: z.string().nonempty(),
        languageCode: z.string().nonempty(),
        pageStart: z.number().int().positive().optional(),
        pageEnd: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const file = await prisma.file.findFirst({
        where: {
          key: input.key,
          userId: ctx.userId,
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      if (!file.text) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File has not been processed yet",
        });
      }

      const text = extractPagesFromFileText(
        file.text,
        input.pageStart,
        input.pageEnd,
      );

      console.debug("Extracted text", text);

      const summary = await summarizeText(
        text,
        file.name,
        input.languageCode,
        input.type,
      );

      const s = await prisma.summary.create({
        data: {
          fileUid: file.uid,
          language: input.languageCode,
          text: summary,
          pageStart: input.pageStart,
          pageEnd: input.pageEnd,
          type: input.type,
        },
      });

      return s;
    }),
});
