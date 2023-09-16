/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client/edge";
import { extractPagesFromFileText } from "~/server/utils/extractPagesFromFileText";
import { summarizeText } from "~/server/utils/ai";
import { deductCoins } from "~/server/api/routers/coins";

export const config = {
  runtime: "experimental-edge",
  dynamic: "force-dynamic",
};

const prismaEdge = new PrismaClient({
  datasourceUrl: process.env.EDGE_DATABASE_URL,
});

export default async function handler(request: NextRequest) {
  if (request.method === "POST") {
    const auth = request.headers.get("authorization");

    if (!auth || auth !== process.env.INTERNAL_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await new Response(request.body).json();

    console.debug("Edge body", body);

    const {
      summaryUid,
      fileKey,
      languageCode,
      summaryType,
      pageStart,
      pageEnd,
      cost,
    } = body;

    const file = await prismaEdge.file.findFirst({
      where: {
        key: fileKey,
      },
    });

    if (!file?.text) {
      return new Response("File not found or not processed yet", {
        status: 404,
      });
    }

    const text = extractPagesFromFileText(file.text, pageStart, pageEnd);

    console.debug("Extracted text", text.length, "characters");

    const summary = await summarizeText(
      text,
      file.name,
      languageCode,
      summaryType,
    );

    const s = await prismaEdge.summary.create({
      data: {
        uid: summaryUid,
        fileUid: file.uid,
        language: languageCode,
        text: summary,
        pageStart: pageStart,
        pageEnd: pageEnd,
        type: summaryType,
      },
    });

    console.debug("Created summary", s.uid);

    await deductCoins(file.userId, cost, prismaEdge);

    console.debug("Deducted coins", cost);

    return new Response(JSON.stringify({ summaryUid: s.uid }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  } else {
    return new Response("Method not allowed", { status: 405 });
  }
}
