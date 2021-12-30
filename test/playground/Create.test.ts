import { handler } from '../../services/SpacesTable/Create'

// Get data from ApiGateway
const event = {
  body: {
    location: "Paris"
  }
}

handler(event as any, {} as any)
