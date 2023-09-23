import type { AWS } from '@serverless/typescript';

import schema from './summarize/schema';

export const functions: AWS['functions'] = {
  summarize: {
    handler: 'src/functions/summarize/handler.main',
    description: 'Lambda to summarize text',
    memorySize: 2048,
    timeout: 300,
    events: [
      {
        http: {
          method: 'post',
          path: 'summarize',
          cors: true,
          request: {
            schemas: {
              'application/json': schema,
            },
          },
        },
      },
    ],
  },
  consumeQueue: {
    handler: 'src/functions/consumeQueue/handler.main',
    memorySize: 2048,
    timeout: 300,
    events: [
      {
        sqs: {
          batchSize: 1,
          maximumConcurrency: 200,
          arn: {
            'Fn::GetAtt': ['SummaryQueue', 'Arn'],
          },
        },
      },
    ],
  },
};
