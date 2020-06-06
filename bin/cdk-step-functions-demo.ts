#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkStepFunctionsDemoStack } from '../lib/cdk-step-functions-demo-stack';

const app = new cdk.App();
new CdkStepFunctionsDemoStack(app, 'CdkStepFunctionsDemoStack');
