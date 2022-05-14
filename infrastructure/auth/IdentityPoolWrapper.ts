import { CfnOutput } from "aws-cdk-lib";
import {
  UserPool,
  UserPoolClient,
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
} from "aws-cdk-lib/aws-cognito";
import {
  Effect,
  FederatedPrincipal,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { Policies } from "../Policies";

export class IdentityPoolWrapper {
  private scope: Construct;
  // Cognito user pool
  private userPool: UserPool;
  private userPoolClient: UserPoolClient;
  private policies: Policies;
  // Cognito identity pool
  private identityPool: CfnIdentityPool;
  // IAM roles
  private authenticatedRole: Role;
  private unAuthenticatedRole: Role;
  public adminRole: Role;

  constructor(
    scope: Construct,
    userPool: UserPool,
    userPoolClient: UserPoolClient,
    policies: Policies
  ) {
    this.scope = scope;
    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
    this.policies = policies
    this.initialize();
  }

  initialize() {
    this.initializeIdentityPool();
    this.initializeRoles();
    this.attachRoles();
  }

  // initialize identity pool in cdk
  private initializeIdentityPool() {
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
  private initializeRoles() {
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

    this.authenticatedRole.addToPolicy(this.policies.uploadProfilePhoto);

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
    this.adminRole = new Role(this.scope, "CognitoAdminRole", {
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

    // allow admin to access s3 buckets
    this.adminRole.addToPolicy(this.policies.uploadSpacePhotos);
    this.adminRole.addToPolicy(this.policies.uploadProfilePhoto);

    // // The following policy is moved into Policies class and injected as dependency
    // this.adminRole.addToPolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: [
    //       "s3:PutObject",
    //       "s3:PutObjectAcl",
    //     ],
    //     resources: [this.photoBucketArn],
    //   })
    // );
  }

  private attachRoles() {
    new CfnIdentityPoolRoleAttachment(this.scope, "RolesAttachment", {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
        unauthenticated: this.unAuthenticatedRole.roleArn,
      },
      roleMappings: {
        adminsMapping: {
          type: "Token",
          ambiguousRoleResolution: "AuthenticatedRole",
          identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
        },
      },
    });
  }
}
