import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult, Context } from 'aws-lambda'

const TABLE_NAME = process.env.TABLE_NAME
const PRIMARY_KEY = process.env.PRIMARY_KEY

const dbClient = new DynamoDB.DocumentClient()

// APIGatewayProxyEvent: the event which will be received by lambda when APIGateway call it
async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: 'Hello from DynamoDB.'
  }
  try {
    // queryStringParameters: {{endpoint}}/spaces?spaceId=6928c6b4-d227-4422-b4c1-89bd4e05782e
    if (event.queryStringParameters) {
      if (PRIMARY_KEY! in event.queryStringParameters) {
        // first try to search by spaceId
        result.body = await queryWithPrimaryPartition(event.queryStringParameters)
      } else {
        // if spaceId is not in query string, search by secondary index (location, name...)
        result.body = await queryWithSecondaryPartition(event.queryStringParameters)
      }
    } else {
      // if no query string, return all items
      result.body = await scanTable()
    }
  } catch (error: any) {
    result.body = error.message
  }
  return result
}

// find all items
async function scanTable() {
  // scan() method will get all items from DynamoDB table
  const queryResponse = await dbClient.scan({
    TableName: TABLE_NAME!
  }).promise()
  return JSON.stringify(queryResponse.Items)
}

// find items by primary key (spaceId)
async function queryWithPrimaryPartition(queryParams: APIGatewayProxyEventQueryStringParameters) {
  const keyValue = queryParams[PRIMARY_KEY!]
  // query() will search by condition (primary key)
  const queryResponse = await dbClient.query({
    TableName: TABLE_NAME!,
    KeyConditionExpression: '#zz = :zzzz',
    ExpressionAttributeNames: {
      '#zz': PRIMARY_KEY!
    },
    ExpressionAttributeValues: {
      ':zzzz': keyValue
    }
  }).promise()
  return JSON.stringify(queryResponse.Items)
}

// find items by secondary index (location, name...)
async function queryWithSecondaryPartition(queryParams: APIGatewayProxyEventQueryStringParameters) {
  const queryKey = Object.keys(queryParams)[0]
  const queryValue = queryParams[queryKey]
  const queryResponse = await dbClient.query({
    TableName: TABLE_NAME!,
    IndexName: queryKey,
    KeyConditionExpression: '#zz = :zzzz',
    ExpressionAttributeNames: {
      '#zz': queryKey!
    },
    ExpressionAttributeValues: {
      ':zzzz': queryValue
    }
  }).promise()
  return JSON.stringify(queryResponse.Items)
}

export { handler }
