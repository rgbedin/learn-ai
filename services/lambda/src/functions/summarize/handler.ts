import type { APIGatewayProxyResult } from 'aws-lambda';
import type { ValidatedAPIGatewayProxyEvent } from 'helpers';
import { middyfy, formatJSONResponse } from 'helpers';
import { summarizeText } from 'helpers/ai';

import schema from './schema';
import { prisma } from 'database/src/client';
import { extractPagesFromFileText } from 'src/utils/extractPagesFromFileText';
import { SummaryType } from 'database';

const summarize = async (event: ValidatedAPIGatewayProxyEvent<typeof schema>): Promise<APIGatewayProxyResult> => {
  const auth = event.headers['authorization'];

  console.debug('Authorization header', auth);

  if (!auth || auth !== process.env.INTERNAL_SECRET) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Forbidden',
      }),
    };
  }

  const file = await prisma.file.findFirst({
    where: {
      key: event.body.fileKey,
    },
  });

  if (!file?.text) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'File not found',
      }),
    };
  }

  const text = extractPagesFromFileText(file.text, event.body.pageStart, event.body.pageEnd);

  console.debug('Extracted text', text.length, 'characters');

  const summary = await summarizeText(text, file.name, event.body.languageCode, event.body.summaryType as SummaryType);

  const s = await prisma.summary.create({
    data: {
      uid: event.body.summaryUid,
      fileUid: file.uid,
      language: event.body.languageCode,
      text: summary,
      pageStart: event.body.pageStart,
      pageEnd: event.body.pageEnd,
      type: event.body.summaryType as SummaryType,
    },
  });

  console.debug('Created summary', s.uid);

  await prisma.coins.update({
    where: {
      userId: file.userId,
    },
    data: {
      coins: {
        decrement: event.body.cost,
      },
    },
  });

  console.debug('Deducted coins', event.body.cost);

  return formatJSONResponse({
    summaryUid: s.uid,
  });
};

export const main = middyfy(summarize);
