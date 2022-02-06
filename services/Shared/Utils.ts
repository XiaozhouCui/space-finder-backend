import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

export function generateRandomId(): string {
  // slice(2) will remove the first 2 characters: '0.'
  return Math.random().toString(36).slice(2)
}

export function getEventBody(event: APIGatewayProxyEvent) {
  return typeof event.body == 'object' ? event.body : JSON.parse(event.body)
}

// setup CORS for lambda
export function addCorsHeader(result: APIGatewayProxyResult) {
  result.headers = {
    'Content-type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  }
}
