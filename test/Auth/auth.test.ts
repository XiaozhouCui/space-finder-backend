import { AuthService } from "./AuthService";
import { config } from "./config";
import * as AWS from 'aws-sdk'

AWS.config.region = config.REGION

async function getBuckets() {
  let buckets;
  try {
    buckets = await new AWS.S3().listBuckets().promise()
  } catch (error) {
    // add break point here, it will be hit when access denied
    buckets = undefined
  }
  return buckets
}

async function callStuff() {
  const authService = new AuthService()

  const user = await authService.login(config.TEST_USER_NAME, config.TEST_USER_PASSWORD)
  await authService.getAWSTemporaryCreds(user)
  const someCreds = AWS.config.credentials
  const buckets = await getBuckets();
  console.log('Add break point in this line to test')
}

callStuff()
