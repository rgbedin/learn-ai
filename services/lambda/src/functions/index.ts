import type { AWS } from '@serverless/typescript';

import schema from './summarize/schema';

export const functions: AWS['functions'] = {
  summarize: {
    handler: 'src/functions/summarize/handler.main',
    description: 'Lambda to summarize text',
    memorySize: 256,
    timeout: 120,
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
};
