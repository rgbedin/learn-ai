import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import AWS from "aws-sdk";
import * as mammoth from "mammoth";
import { TRPCError } from "@trpc/server";
import { prisma } from "~/server/db";
import axios from "axios";
import pdf from "pdf-parse";
import { promptLongText } from "~/server/utils/ai";

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
    MediaFormat: key.endsWith("mp3") ? "mp3" : "mp4",
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

const extractAndStoreText = async (key: string) => {
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

  if (file.type === "application/pdf") {
    const thePdf = await pdf(await downloadAsBuffer());

    text = thePdf.text;
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
    },
  });
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

      return file;
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
      },
      where: {
        userId: ctx.userId,
      },
    });

    return files;
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
    .input(
      z.object({
        key: z.string().nonempty(),
        languageCode: z.string().nonempty(),
        numParagraphs: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
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

      if (!file.summary) {
        const summary = await promptLongText(
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          file.text!,
          `Summarize this text into ${input.numParagraphs} paragraphs in the language with code ${input.languageCode}`,
        );

        await prisma.file.update({
          where: {
            uid: file.uid,
          },
          data: {
            summary,
          },
        });

        return summary;
      } else {
        return file.summary;
      }
    }),
});
