import { CfnOutput } from "aws-cdk-lib"
import { UserPool, UserPoolClient, CfnIdentityPool } from "aws-cdk-lib/aws-cognito"
import { Construct } from "constructs"


export class IdentityPoolWrapper {
  private scope: Construct
  // Cognito user pool
  private userPool: UserPool
  private userPoolClient: UserPoolClient
  // Cognito identity pool
  private identityPool: CfnIdentityPool

  constructor(scope: Construct, userPool: UserPool, userPoolClient: UserPoolClient) {
    this.scope = scope
    this.userPool = userPool
    this.userPoolClient = userPoolClient
    this.initialize()
  }

  initialize() {
    this.initializeIdentityPool()
  }
  // initialize identity pool in cdk
  initializeIdentityPool() {
    this.identityPool = new CfnIdentityPool(this.scope, 'SpaceFinderIdentityPool', {
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [{
        clientId: this.userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName,
      }]
    })
    // print the identity pool in terminal after "cdk deploy"
    new CfnOutput(this.scope, 'IdentityPoolId', {
      value: this.identityPool.ref
    })
  }
}
