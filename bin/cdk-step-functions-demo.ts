#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LuckyNumber } from '../lib/cdk-step-functions-demo-stack';

const app = new cdk.App();
new LuckyNumber(app, 'LuckyNumberStack');
