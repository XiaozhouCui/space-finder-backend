import Amplify, { Auth } from 'aws-amplify'
import { CognitoUser } from '@aws-amplify/auth'
import { config } from './config'

Amplify.configure({
  // auth data from cognito user pool
  Auth: {
    mandatorySignIn: false,
    region: config.REGION,
    userPoolId: config.USER_POOL_ID,
    userPoolWebClientId: config.APP_CLIENT_ID,
    authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
})

export class AuthService {
  public async login(userName: string, password: string) {
    const user = await Auth.signIn(userName, password) as CognitoUser
    return user // add break point in this line to locally test/debug login in auth.test.ts
  }
}
