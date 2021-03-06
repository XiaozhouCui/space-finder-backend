import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { addCorsHeader, getEventBody } from '../Shared/Utils'

const TABLE_NAME = process.env.TABLE_NAME as string
const PRIMARY_KEY = process.env.PRIMARY_KEY as string

const dbClient = new DynamoDB.DocumentClient()

// APIGatewayProxyEvent: the event which will be received by lambda when APIGateway call it
async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: 'Hello from DynamoDB.'
  }
  // add CORS header to the lambda result
  addCorsHeader(result)

  try {
    // requestBody: { location: 'new location' }
    const requestBody = getEventBody(event)
    // spaceId: '6928c6b4-d227-4422-b4c1-89bd4e05782e'
    const spaceId = event.queryStringParameters?.[PRIMARY_KEY]

    if (requestBody && spaceId) {
      const requestBodyKey = Object.keys(requestBody)[0]
      const requestBodyValue = requestBody[requestBodyKey]

      const updateResult = await dbClient.update({
        TableName: TABLE_NAME,
        Key: {
          [PRIMARY_KEY]: spaceId
        },
        UpdateExpression: 'set #zzzNew = :new',
        ExpressionAttributeValues: {
          ':new': requestBodyValue
        },
        ExpressionAttributeNames: {
          '#zzzNew': requestBodyKey
        },
        ReturnValues: 'UPDATED_NEW'
      }).promise()

      result.body = JSON.stringify(updateResult)
    }
  } catch (error: any) {
    result.body = error.message
  }

  return result
}

export { handler }
