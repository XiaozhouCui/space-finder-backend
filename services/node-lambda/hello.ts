import { v4 } from "uuid";
import { S3 } from 'aws-sdk'

const s3Client = new S3()

async function handler (event: any, context: any) {
  // to list buckets, need to add role policy to Lambda
  const buckets = await s3Client.listBuckets().promise()
  console.log('Got an event:')
  console.log(event)
  return {
    statusCode: 200,
    body: 'Here are your buckets: ' + JSON.stringify(buckets)
  }
}

export { handler }