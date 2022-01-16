import { CfnOutput } from "aws-cdk-lib";
import {
  UserPool,
  UserPoolClient,
  CfnIdentityPool,
} from "aws-cdk-lib/aws-cognito";
import {
  Effect,
  FederatedPrincipal,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class IdentityPoolWrapper {
  private scope: Construct;
  // Cognito user pool
  private userPool: UserPool;
  private userPoolClient: UserPoolClient;
  // Cognito identity pool
  private identityPool: CfnIdentityPool;
  // IAM roles
  private authenticatedRole: Role;
  private unAuthenticatedRole: Role;
  private adminRole: Role;

  constructor(
    scope: Construct,
    userPool: UserPool,
    userPoolClient: UserPoolClient
  ) {
    this.scope = scope;
    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
    this.initialize();
  }

  initialize() {
    this.initializeIdentityPool();
    this.initializeRoles();
  }
  // initialize identity pool in cdk
  initializeIdentityPool() {
    this.identityPool = new CfnIdentityPool(
      this.scope,
      "SpaceFinderIdentityPool",
      {
        allowUnauthenticatedIdentities: true,
        cognitoIdentityProviders: [
          {
            clientId: this.userPoolClient.userPoolClientId,
            providerName: this.userPool.userPoolProviderName,
          },
        ],
      }
    );
    // print the identity pool ID in terminal after "cdk deploy"
    new CfnOutput(this.scope, "IdentityPoolId", {
      value: this.identityPool.ref,
    });
  }
  // initialize IAM roles (very nasty setup)
  initializeRoles() {
    this.authenticatedRole = new Role(
      this.scope,
      "CognitoDefaultAuthenticatedRole",
      {
        // get the the following args from "AWS > IAM > Roles > Cognito_mytestidentitypoolAuth_Role > Trust relationship tab"
        assumedBy: new FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
          // click "Show policy document", copy "Action"
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );

    this.unAuthenticatedRole = new Role(
      this.scope,
      "CognitoDefaultUnAuthenticatedRole",
      {
        assumedBy: new FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );

    // add an additional role: Admin
    this.adminRole = new Role(this.scope, "CognitoDefaultAuthenticatedRole", {
      assumedBy: new FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    // allow admin to list s3 buckets
    this.adminRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:ListAllMyBuckets"],
        resources: ["*"],
      })
    );
  }
}
