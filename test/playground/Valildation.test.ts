import { APIGatewayProxyEvent } from 'aws-lambda'
import { handler } from '../../services/SpacesTable/Create'

// Get data from ApiGateway
const event = {
  body: {
    name: "someName"
  }
} as any

const result = handler(event, {} as any).then(apiResult => {
  const items = JSON.parse(apiResult.body)
})
