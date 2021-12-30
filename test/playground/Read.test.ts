import { handler } from '../../services/SpacesTable/Read'

const result = handler({} as any, {} as any).then(apiResult => {
  const items = JSON.parse(apiResult.body)
  console.log('Add debug break point here')
})
