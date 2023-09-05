import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import AWS from "aws-sdk";
import * as mammoth from "mammoth";
import { TRPCError } from "@trpc/server";
import { prisma } from "~/server/db";
import axios from "axios";
import pdf from "pdf-parse";
import { promptLongText } from "~/server/utils/ai";
import { type File } from "@prisma/client";

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
    const textract = new AWS.Textract();

    const promise = new Promise<void>((resolve) => {
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

          resolve();
        },
      );
    });

    await promise;
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
    },
  });
};

const hydrateSummaries = async (file: File) => {
  const theFile = await prisma.file.findUniqueOrThrow({
    where: {
      uid: file.uid,
    },
  });

  const summaries = await promptLongText(
    theFile.text!,
    "Create two summaries for the file. The first one should be a few paragraphs long. The second one should be a single short sentence with a maximum of 10 words. Reply to this message in a JSON format. Use the key 'summary' for the first summary and 'shortSummary' for the second summary.",
  );

  const parsedSummaries = JSON.parse(summaries) as {
    summary: string;
    shortSummary: string;
  };

  await prisma.file.update({
    where: {
      uid: file.uid,
    },
    data: {
      summary: parsedSummaries.summary,
      shortSummary: parsedSummaries.shortSummary,
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.prisma.file.create({
        data: {
          key: input.key,
          name: input.name,
          type: input.type,
          userId: ctx.userId,
        },
      });

      await extractAndStoreText(input.key);

      void hydrateSummaries(file);

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
    .input(z.object({ key: z.string().nonempty() }))
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
        await extractAndStoreText(input.key);
      }

      if (!file.summary) {
        const summary = await promptLongText(
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          file.text!,
          "Summarize the file in a few paragraphs.",
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
