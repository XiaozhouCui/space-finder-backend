import { CfnOutput } from "aws-cdk-lib";
import { CognitoUserPoolsAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthorizerWrapper {
  private scope: Construct
  private api: RestApi

  // Cognito properties
  private userPool: UserPool
  private userPoolClient: UserPoolClient
  // authorizer will be used outside this class
  public authorizer: CognitoUserPoolsAuthorizer

  constructor(scope: Construct, api: RestApi) {
    this.scope = scope
    this.api = api
    this.initialize()
  }

  private initialize() {
    this.createUserPool()
    this.addUserPoolClient()
    this.createAuthorizer()
  }

  private createUserPool() {
    this.userPool = new UserPool(this.scope, 'SpaceUserPool', {
      // user pool name is the same as user pool ID
      userPoolName: 'SpaceUserPool',
      selfSignUpEnabled: true,
      // user can login with either username or email
      signInAliases: {
        username: true,
        email: true
      }
    })
    // need user pool ID, e.g. 'ap-southeast-2_wM1n73HNa'
    // we can use CloudFormation tool CfnOutput to get user pool ID in terminal after running `cdk deploy`
    new CfnOutput(this.scope, 'UserPoolId', {
      value: this.userPool.userPoolId
    })
  }

  private addUserPoolClient() {
    this.userPoolClient = this.userPool.addClient('SpaceUserPool-client', {
      // client name is the same as client ID
      userPoolClientName: 'SpaceUserPool-client',
      // set everything to true
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
        userSrp: true
      },
      // do NOT generate client secret
      generateSecret: false,
    })
    new CfnOutput(this.scope, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId
    })
  }

  private createAuthorizer() {
    this.authorizer = new CognitoUserPoolsAuthorizer(this.scope, 'SpaceUserAuthorizer', {
      cognitoUserPools: [this.userPool],
      authorizerName: 'SpaceUserAuthorizer',
      identitySource: 'method.request.header.Authorization',
    })
    // this authorizer must be attached to an API
    this.authorizer._attachToApi(this.api);

    // alternative way of creating authorizer: CfnAuthorizer from "aws-cdk-lib/aws-apigateway"
    // const a = new CfnAuthorizer(this.scope, 'SpaceUserAuthorizer', {
    //   name: 'SpaceUserAuthorizer',
    //   type: '',
    //   restApiId: ''
    // })
  }
}
