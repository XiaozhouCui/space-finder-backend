import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { MissingFieldError, validateAsSpaceEntry } from '../Shared/InputValidator'
import { v4 } from 'uuid'

const TABLE_NAME = process.env.TABLE_NAME

const dbClient = new DynamoDB.DocumentClient()

// APIGatewayProxyEvent: the event which will be received by lambda when APIGateway call it
async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: 'Hello from DynamoDB.'
  }

  try {
    // get data from ApiGateway event
    const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body)
    item.spaceId = v4()
    // if invalid, it will throw a MissingFieldError
    validateAsSpaceEntry(item)
    await dbClient.put({
      TableName: TABLE_NAME!,
      Item: item
    }).promise()
    result.body = JSON.stringify(`Created item with id: ${item.spaceId}`)
  } catch (error: any) {
    if (error instanceof MissingFieldError) {
      result.statusCode = 400
    } else {
      result.statusCode = 500
    }
    result.body = error.message
  }
  return result
}

export { handler }
