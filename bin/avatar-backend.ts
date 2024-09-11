#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AvatarBackendStack } from '../lib/avatar-backend-stack';
import { AvatarFrontendStack } from '../lib/avatar-frontend-stack';

const app = new cdk.App();
new AvatarBackendStack(app, 'AvatarBackendStack', {
    env: {region: 'us-east-1'}
});

new AvatarFrontendStack(app, 'AvatarFrontendStack', {
    env: {region: 'us-east-1'}
});