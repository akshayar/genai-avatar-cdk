#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AvatarBackendStack } from '../lib/avatar-backend-stack';
import { AvatarFrontendStack } from '../lib/avatar-frontend-stack';

const app = new cdk.App();
new AvatarBackendStack(app, 'AvatarBackendStack', {
    env: {region: 'us-west-2'}
});

new AvatarFrontendStack(app, 'AvatarFrontendStack', {
    env: {region: 'us-west-2'}
});