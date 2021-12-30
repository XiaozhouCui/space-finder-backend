import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'

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
        const keyValue = event.queryStringParameters[PRIMARY_KEY!]
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
        result.body = JSON.stringify(queryResponse)
      }
    } else {
      // scan() method will get all items from DynamoDB table
      const queryResponse = await dbClient.scan({
        TableName: TABLE_NAME!
      }).promise()
      result.body = JSON.stringify(queryResponse)
    }

  } catch (error: any) {
    result.body = error.message
  }

  return result
}

export { handler }
