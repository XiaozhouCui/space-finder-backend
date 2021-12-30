import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { GenericTable } from './GenericTable';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
// import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';

export class SpaceStack extends Stack {
  // "this" is the context/scope of type Construct
  private api = new RestApi(this, 'SpaceApi')

  // private spacesTable = new GenericTable('SpacesTable', 'spaceId', this)
  private spacesTable = new GenericTable(this, {
    tableName: 'SpacesTable',
    primaryKey: 'spaceId',
    createLambdaPath: 'Create',
    readLambdaPath: 'Read',
    secondaryIndexes: ['location'],
  })

  // app is of type Construct
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    // lambda written in pure js (not typescript)
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
    // add role policy to the lambda, so that it can list S3 buckets
    const s3ListPolicy = new PolicyStatement()
    s3ListPolicy.addActions('s3:ListAllMyBuckets')
    s3ListPolicy.addResources('*')
    helloLambdaNodeJs.addToRolePolicy(s3ListPolicy)

    // integrate lambda with API Gateway
    const helloLambdaIntegration = new LambdaIntegration(helloLambdaNodeJs)
    // provide api gateway as resource: {{endpoint}}/hello/
    const helloLambdaResource = this.api.root.addResource('hello')
    helloLambdaResource.addMethod('GET', helloLambdaIntegration)

    // Spaces API integrations: {{endpoint}}/spaces/
    const spaceResource = this.api.root.addResource('spaces')
    spaceResource.addMethod('POST', this.spacesTable.createLambdaIntegration)
    spaceResource.addMethod('GET', this.spacesTable.readLambdaIntegration)
  }
}