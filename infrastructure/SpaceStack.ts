import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { AuthorizationType, LambdaIntegration, Cors, MethodOptions, RestApi, ResourceOptions } from 'aws-cdk-lib/aws-apigateway'
import { GenericTable } from './GenericTable';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { AuthorizerWrapper } from './auth/AuthorizerWrapper'
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { WebAppDeployment } from './WebAppDeployment';
import { Policies } from './Policies';
// import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';

export class SpaceStack extends Stack {
  // "this" is the context/scope of type Construct
  private api = new RestApi(this, 'SpaceApi')
  private authorizer: AuthorizerWrapper
  private suffix: string
  private spacesPhotosBucket: Bucket
  private profilePhotosBucket: Bucket;
  private policies: Policies;

  // private spacesTable = new GenericTable('SpacesTable', 'spaceId', this)
  private spacesTable = new GenericTable(this, {
    tableName: 'SpacesTable',
    primaryKey: 'spaceId',
    createLambdaPath: 'Create',
    readLambdaPath: 'Read',
    updateLambdaPath: 'Update',
    deleteLambdaPath: 'Delete',
    secondaryIndexes: ['location'],
  })

  private reservationsTable = new GenericTable(this, {
    tableName: 'ReservationsTable',
    primaryKey: 'reservationId',
    createLambdaPath: 'Create',
    readLambdaPath: 'Read',
    updateLambdaPath: 'Update',
    deleteLambdaPath: 'Delete',
    secondaryIndexes: ['user']
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

    // initialize S3 bucket with suffix from stack ID
    this.initializeSuffix()
    this.initializeSpacesPhotosBucket()
    this.initializeProfilePhotosBucket();

    // AuthorizerWrapper will bind authorizer with ApiGateway, 
    // AuthorizerWrapper also passes bucket arn to Identity Pool and then add to admin role
    this.policies = new Policies(this.spacesPhotosBucket, this.profilePhotosBucket);
    this.authorizer = new AuthorizerWrapper(this, this.api, this.policies);

    new WebAppDeployment(this, this.suffix)

    // specify an authorizer
    const optionsWithAuthorizer: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: this.authorizer.authorizer.authorizerId
      }
    }

    const optionsWithCors:ResourceOptions = {
      defaultCorsPreflightOptions : {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS
      }
    }

    // demo for lambda and policy
    // // "this" is the context/scope of type Construct
    // const helloLambdaNodeJs = new NodejsFunction(this, 'helloLambdaNodeJs', {
    //   entry: (join(__dirname, '..', 'services', 'node-lambda', 'hello.ts')),
    //   handler: 'handler' // exported handler property from hello.ts
    // })
    // // add role policy to the lambda, so that it can list S3 buckets
    // const s3ListPolicy = new PolicyStatement()
    // s3ListPolicy.addActions('s3:ListAllMyBuckets')
    // s3ListPolicy.addResources('*')
    // helloLambdaNodeJs.addToRolePolicy(s3ListPolicy)

    // demo for lambda and API integration
    // // integrate lambda with API Gateway
    // const helloLambdaIntegration = new LambdaIntegration(helloLambdaNodeJs)
    // // provide api gateway as resource: {{endpoint}}/hello/
    // const helloLambdaResource = this.api.root.addResource('hello')
    // // add authorizer as option of GET method
    // helloLambdaResource.addMethod('GET', helloLambdaIntegration, optionsWithAuthorizer)

    // Spaces API integrations: {{endpoint}}/spaces/
    const spaceResource = this.api.root.addResource('spaces', optionsWithCors)
    spaceResource.addMethod('POST', this.spacesTable.createLambdaIntegration, optionsWithAuthorizer)
    spaceResource.addMethod('GET', this.spacesTable.readLambdaIntegration, optionsWithAuthorizer)
    spaceResource.addMethod('PUT', this.spacesTable.updateLambdaIntegration, optionsWithAuthorizer)
    spaceResource.addMethod('DELETE', this.spacesTable.deleteLambdaIntegration, optionsWithAuthorizer)

    // Reservations API integrations: {{endpoint}}/reservations/
    const reservationResource = this.api.root.addResource('reservations', optionsWithCors);
    reservationResource.addMethod('POST', this.reservationsTable.createLambdaIntegration, optionsWithAuthorizer);
    reservationResource.addMethod('GET', this.reservationsTable.readLambdaIntegration, optionsWithAuthorizer);
    reservationResource.addMethod('PUT', this.reservationsTable.updateLambdaIntegration, optionsWithAuthorizer);
    reservationResource.addMethod('DELETE', this.reservationsTable.deleteLambdaIntegration, optionsWithAuthorizer);
  }

  private initializeSuffix() {
    // use CloudFormation Function to get the suffix of SpaceStack ID in CloudFormation
    // The stackId: arn:aws:cloudformation:ap-southeast-2:651694081254:stack/SpaceFinder/def89100-63c2-11ec-9bf8-067730fda8cc
    const shortStackId = Fn.select(2, Fn.split('/', this.stackId))
    // shortStackId: def89100-63c2-11ec-9bf8-067730fda8cc
    const Suffix = Fn.select(4, Fn.split('-', shortStackId))
    // Suffix: 067730fda8cc
    this.suffix = Suffix
  }

  private initializeSpacesPhotosBucket() {
    this.spacesPhotosBucket = new Bucket(this, 'spaces-photos', {
      // make the bucket name unique, by appending the suffix from stack ID (SpaceStack) in CloudFormation
      bucketName: 'spaces-photos-' + this.suffix,
      cors: [{
        allowedMethods: [
          HttpMethods.HEAD,
          HttpMethods.GET,
          HttpMethods.PUT
        ],
        allowedOrigins: ['*'],
        allowedHeaders: ['*']
      }]
    });
    new CfnOutput(this, 'spaces-photos-bucket-name', {
      value: this.spacesPhotosBucket.bucketName
    })
  }

  private initializeProfilePhotosBucket() {
    this.profilePhotosBucket = new Bucket(this, 'profile-photos', {
      bucketName: 'profile-photos-' + this.suffix,
      cors: [{
        allowedMethods: [
            HttpMethods.HEAD,
            HttpMethods.GET,
            HttpMethods.PUT
        ],
        allowedOrigins: ['*'],
        allowedHeaders: ['*']
      }]
    });
    new CfnOutput(this, 'profile-photos-bucket-name', {
      value: this.profilePhotosBucket.bucketName
    })
  }
}