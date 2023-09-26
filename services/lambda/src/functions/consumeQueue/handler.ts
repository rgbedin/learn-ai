import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { prisma } from 'database/src/client';
import { summarize } from 'helpers/ai';
import { SummaryQueueMessage } from 'src/interfaces/SummaryQueueMessage';
import { SummaryStatus } from 'database';
import { jsonrepair } from 'jsonrepair';
import { kv } from '@vercel/kv';
import { DEFAULT_AI_MODEL } from 'helpers/ai-helpers/aiConstants';

const wrapOperationInSemaphore = async <T>(operation: () => Promise<T>): Promise<T> => {
  const semaphoreKey = 'openai-semaphore';

  const semaphore = await kv.get<number>(semaphoreKey);

  if (semaphore) {
    console.debug('OpenAI semaphore is set, waiting for 3 seconds');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return wrapOperationInSemaphore(operation);
  }

  await kv.set(semaphoreKey, 1);

  try {
    const result = await operation();
    return result;
  } finally {
    await kv.set(semaphoreKey, null);
  }
};

const ensureOpenAiLimits = async () => {
  return wrapOperationInSemaphore(async () => {
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    const currentMinute = `${year}-${month}-${day}-${hour}-${minute}`;

    const key = `${process.env.AWS_ENVIRONMENT}-openai-limits-${currentMinute}`;

    let limits = await kv.get<number>(key);

    if (!limits) {
      await kv.set(key, 0);
      limits = 0;
    }

    console.debug('Current OpenAI limits', limits);

    if (limits + DEFAULT_AI_MODEL.maxTokens > DEFAULT_AI_MODEL.tpm) {
      return false;
    } else {
      console.debug('OpenAI limits not exceeded - acquired and continuing');
      await kv.set(key, limits + DEFAULT_AI_MODEL.maxTokens);
      return true;
    }
  });
};

const handleSqsRecord = async (record: SQSRecord) => {
  const job = JSON.parse(record.body) as SummaryQueueMessage;

  console.debug('Summary job', job.uid, 'event handler');

  // Check if we have exceeded the OpenAI limits
  let hasEnoughLimits = false;
  while (!hasEnoughLimits) {
    hasEnoughLimits = await ensureOpenAiLimits();

    if (!hasEnoughLimits) {
      console.debug('OpenAI limits exceeded, sleeping for job', job.uid);
      await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
    }
  }

  await prisma.summaryJob.update({
    where: {
      uid: job.uid,
    },
    data: {
      status: 'PROCESSING',
    },
  });

  let status: SummaryStatus = 'DONE';

  let summary: { message: string; tokensUsed: number; estimatedPricing: number } | undefined;

  try {
    summary = await summarize(job.text, job.index, job.fileName, job.languageCode, job.summaryType);

    console.debug('Summary generated', summary);
  } catch (error: any) {
    console.error('Error generating summary', error);

    status = 'ERROR';

    summary = {
      message: JSON.stringify(error?.message),
      tokensUsed: 0,
      estimatedPricing: 0,
    };
  }

  // Check if summary is a valid JSON
  if (status !== 'ERROR') {
    try {
      summary.message = jsonrepair(summary.message);
    } catch (error: any) {
      console.error('Summary is not a valid JSON', error?.message, summary.message);
      status = 'ERROR';
    }
  }

  const updatedJob = await prisma.summaryJob.update({
    where: {
      uid: job.uid,
    },
    data: {
      text: summary.message,
      status,
      tokensUsed: summary.tokensUsed,
      estimatedPricing: summary.estimatedPricing,
    },
  });

  console.debug('Summary job done', updatedJob);

  // If all jobs are done, update the summary status
  // Also assign the `text` as a concatenation of all jobs `text`,
  // ordered by `index`
  const jobs = await prisma.summaryJob.findMany({
    where: {
      summaryUid: job.summaryUid,
    },
  });

  const allJobsDone = jobs.every((j) => j.status === 'DONE' || j.status === 'ERROR');

  console.debug('All jobs done?', allJobsDone);

  if (allJobsDone) {
    const allJobsEstimatedCost = jobs.reduce((acc, j) => acc + (j.estimatedPricing ?? 0), 0);

    const allJobsTokensUsed = jobs.reduce((acc, j) => acc + (j.tokensUsed ?? 0), 0);

    console.debug('Updating summary status to DONE', job.summaryUid);

    const hasError = jobs.some((j) => j.status === 'ERROR');

    await prisma.summary.update({
      where: {
        uid: job.summaryUid,
      },
      data: {
        status: hasError ? 'ERROR' : 'DONE',
        estimatedPricing: allJobsEstimatedCost,
        tokensUsed: allJobsTokensUsed,
      },
    });
  } else {
    console.debug('Not all jobs are done, skipping summary update', job.summaryUid);
  }
};

export const main: SQSHandler = async (event: SQSEvent) => {
  console.debug('Records', event.Records.length, 'found');

  const promises = event.Records.map(async (record) => {
    try {
      await handleSqsRecord(record);
    } catch (error) {
      console.error('Error processing record', error);
    }
  });

  await Promise.all(promises);
};
