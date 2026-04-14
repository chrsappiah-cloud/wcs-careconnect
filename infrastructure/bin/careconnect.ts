#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CareConnectStack } from '../lib/careconnect-stack';

const app = new cdk.App();

new CareConnectStack(app, 'CareConnectStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:  'ap-southeast-2',          // Australia — Sydney
  },
  description: 'CareConnect aged-care platform — ECS/Fargate + RDS + S3 + Cognito (ap-southeast-2)',
});
