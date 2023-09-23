import { APIGatewayProxyResult } from 'aws-lambda';
import { ValidatedAPIGatewayProxyEvent } from 'helpers';
import { middyfy, formatJSONResponse } from 'helpers';
import { getBucketsToSummarize } from 'helpers/ai';
import { SQS } from 'aws-sdk';

import schema from './schema';
import { prisma } from 'database/src/client';
import { extractPagesFromFileText } from 'src/utils/extractPagesFromFileText';
import { SummaryType } from 'database';
import { SummaryQueueMessage } from 'src/interfaces/SummaryQueueMessage';

const sqs = new SQS();

const summarize = async (event: ValidatedAPIGatewayProxyEvent<typeof schema>): Promise<APIGatewayProxyResult> => {
  const queueUrl = `https://sqs.us-east-1.amazonaws.com/219216455343/summary-queue-${process.env.AWS_ENVIRONMENT}`;

  console.debug('Queue URL', queueUrl);

  const auth = event.headers['Authorization'];

  console.debug('Authorization header', auth, event.headers);

  if (!auth || auth !== process.env.INTERNAL_SECRET) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Forbidden',
      }),
    };
  }

  console.debug('Finding file', event.body.fileKey);

  const file = await prisma.file.findFirst({
    where: {
      key: event.body.fileKey,
    },
  });

  if (!file?.text) {
    console.error('File not found', event.body.fileKey);

    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'File not found',
      }),
    };
  }

  const text = extractPagesFromFileText(file.text, event.body.pageStart, event.body.pageEnd);

  console.debug('Extracted text', text.length, 'characters');

  const buckets = await getBucketsToSummarize(text, event.body.languageCode, event.body.summaryType as SummaryType);

  console.debug(
    'Buckets',
    buckets.length,
    'Average characters per bucket',
    buckets.reduce((acc, b) => acc + b.length, 0) / buckets.length
  );

  // Each buckets will turn into a SummaryJob
  for (const b of buckets) {
    const job = await prisma.summaryJob.create({
      data: {
        summaryUid: event.body.summaryUid,
        index: buckets.indexOf(b),
      },
    });

    const queueMessage: SummaryQueueMessage = {
      uid: job.uid,
      index: job.index,
      text: b,
      languageCode: event.body.languageCode,
      summaryType: event.body.summaryType as SummaryType,
      summaryUid: event.body.summaryUid,
      fileName: file.name,
    };

    const params = {
      MessageBody: JSON.stringify(queueMessage),
      QueueUrl: queueUrl,
    };

    await sqs.sendMessage(params).promise();
  }

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

  await prisma.summary.update({
    where: {
      uid: event.body.summaryUid,
    },
    data: {
      status: 'PROCESSING',
    },
  });

  return formatJSONResponse({
    summaryUid: event.body.summaryUid,
    status: 'PROCESSING',
  });
};

export const main = middyfy(summarize);
