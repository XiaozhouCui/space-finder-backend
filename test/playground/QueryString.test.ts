import { APIGatewayProxyEvent } from 'aws-lambda'
import { handler } from '../../services/SpacesTable/Read'

// Get data from ApiGateway
const event: APIGatewayProxyEvent = {
  queryStringParameters: {
    spaceId: '6928c6b4-d227-4422-b4c1-89bd4e05782e'
  }
} as any

const result = handler(event as any, {} as any).then(apiResult => {
  const items = JSON.parse(apiResult.body)
  console.log('Add debug break point here')
})
