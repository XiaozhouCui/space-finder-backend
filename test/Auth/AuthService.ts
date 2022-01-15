import Amplify, { Auth } from 'aws-amplify'
import { CognitoUser } from '@aws-amplify/auth'
import { config } from './config'
import * as AWS from 'aws-sdk'
import { Credentials } from 'aws-sdk/lib/credentials'

Amplify.configure({
  // auth data from cognito user pool
  Auth: {
    mandatorySignIn: false,
    region: config.REGION,
    userPoolId: config.USER_POOL_ID,
    userPoolWebClientId: config.APP_CLIENT_ID,
    identityPoolId: config.IDENTITY_POOL_ID,
    authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
})

export class AuthService {
  // login locally with Amplify, will return a Cognito user
  public async login(userName: string, password: string) {
    const user = await Auth.signIn(userName, password) as CognitoUser
    return user // add break point in this line to locally test/debug login in auth.test.ts
  }

  public async getAWSTemporaryCreds(user: CognitoUser) {
    // Initialize the Amazon Cognito credentials provider
    const cognitoIdentityPool = `cognito-idp.${config.REGION}.amazonaws.com/${config.USER_POOL_ID}`
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: config.IDENTITY_POOL_ID,
      Logins: {
        [cognitoIdentityPool]: user.getSignInUserSession()!.getIdToken().getJwtToken(),
      }
    }, {
      region: config.REGION
    })
    await this.refreshCredentials()
  }

  // refresh credentials asynchronously
  private async refreshCredentials(): Promise<void> {
    return new Promise((resolve, reject) => {
      (AWS.config.credentials as Credentials).refresh(err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
