import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { GenericTable } from './GenericTable';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'

export class SpaceStack extends Stack {
  // "this" is the context/scope of type Construct
  private api = new RestApi(this, 'SpaceApi')
  private spacesTable = new GenericTable('SpacesTable', 'spaceId', this)

  // app is of type Construct
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    // lambda written pure js (not typescript)
    // const helloLambda = new LambdaFunction(this, 'helloLambda', {
    //   runtime: Runtime.NODEJS_14_X,
    //   // code can come from a file, a docker build, S3 bucket etc.
    //   code: Code.fromAsset(join(__dirname, '..', 'services', 'hello')),
    //   // map the handler to the exported "main" property of hello.js
    //   handler: 'hello.main'
    // })

    // "this" is the context/scope of type Construct
    const helloLambdaNodeJs = new NodejsFunction(this, 'helloLambdaNodeJs', {
      entry: (join(__dirname, '..', 'services', 'node-lambda', 'hello.ts')),
      handler: 'handler' // exported handler property from hello.ts
    })

    // integrate lambda with API Gateway
    const helloLambdaIntegration = new LambdaIntegration(helloLambdaNodeJs)
    // provide api gateway as resource
    const helloLambdaResource = this.api.root.addResource('hello')
    helloLambdaResource.addMethod('GET', helloLambdaIntegration)
  }
}