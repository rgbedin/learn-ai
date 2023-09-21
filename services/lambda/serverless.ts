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
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    deploymentMethod: 'direct',
    architecture: 'arm64',
  },
  functions,
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node18',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
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
