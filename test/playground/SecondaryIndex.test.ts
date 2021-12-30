import { APIGatewayProxyEvent } from 'aws-lambda'
import { handler } from '../../services/SpacesTable/Read'

// Get data from ApiGateway
const event: APIGatewayProxyEvent = {
  queryStringParameters: {
    location: 'London'
  }
} as any

const result = handler(event as any, {} as any).then(apiResult => {
  const items = JSON.parse(apiResult.body)
  console.log('Add debug break point here')
})
