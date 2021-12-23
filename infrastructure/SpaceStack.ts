import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

export class SpaceStack extends Stack {
  // app is of type Construct
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)
    // "this" is the context/scope
    const helloLambda = new LambdaFunction(this, 'helloLambda', {
      runtime: Runtime.NODEJS_14_X,
      // code can come from a file, a docker build, S3 bucket etc.
      code: Code.fromAsset(join(__dirname, '..', 'services', 'hello')),
      // map the handler to the exported "main" property of hello.js
      handler: 'hello.main'
    })
  }
}