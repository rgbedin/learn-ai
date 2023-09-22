import type { AWS } from '@serverless/typescript';

import { functions } from '@functions/index';

const serverlessConfiguration: AWS = {
  service: 'lamda',
  frameworkVersion: '3.35.2',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dotenv-plugin'],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: 'dev',
    region: 'us-east-1',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
  },
  functions,
  package: {
    individually: true,
    patterns: ['!node_modules/.prisma/client/libquery_engine-*', '!node_modules/@prisma/engines/**'],
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      platform: 'node',
      packager: 'yarn',
      keepOutputDirectory: true,
      concurrency: 10,
      plugins: 'plugins.js',
    },
    'serverless-offline': {
      httpPort: 3005,
    },
    dotenv: {
      dotenvParser: 'dotenv.config.js',
    },
  },
};

module.exports = serverlessConfiguration;
