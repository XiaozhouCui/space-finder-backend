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
  }

  private createUserPool() {
    this.userPool = new UserPool(this.scope, 'SpaceUserPool', {
      userPoolName: 'SpaceUserPool',
      selfSignUpEnabled: true,
      // user can login with either username or email
      signInAliases: {
        username: true,
        email: true
      }
    })
    // need user pool ID, e.g. 'ap-southeast-2_wM1n73HNa'
    // we can use CloudFormation tool CfnOutput to get user pool ID once userPool is created
    new CfnOutput(this.scope, 'UserPoolId', {
      value: this.userPool.userPoolId
    })
  }
}
