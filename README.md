## Initialize manually
- To manually initialize, do NOT run `cdk init app --language typescript`
- Run `npm init -y`
- Run `npm i -D aws-cdk aws-cdk-lib constructs ts-node typescript`
- Setup *Launcher.ts* and *SpaceStack.ts* in infrastructure folder
- Copy tsconfig.json from CDK-CLI (`cdk init`) generated project
- Setup cdk.json and run `cdk synth`, should have no errors

## Add Lambda function
- Add a handler function in services folder, and map the handler to a new Lambda function in SpaceStack's constructor
- Before deploy, run `cdk bootstrap` to bootstrap environment, make sure the global cdk version is the same as package.json
- Run `cdk synth` to check for errors, the handler function file should be added into folder: cdk.out
- Run `cdk deploy`, this will create a SpaceFinder stack in AWS > CloudFormation > Stacks, containing the hello.js lambda

## Add API Gateway
- In SpaceStack, add private property `api` as a new instance of ApiGateway, name it `SpaceApi`
- In constructor, integrate the `helloLambda` with the api gateway `SpaceApi`
- Run `cdk deploy`, after success, the terminal will show outputs, containing the URL endpoint of API gateway
- In browser, open `https://srqcwkm2nd.execute-api.ap-southeast-2.amazonaws.com/prod/hello` will see the message from lambda
- In VS-Code, install Rest Client, then add a *requests.http* file, it can send requests like postman.

## Add DynamoDB
- Use package `aws-cdk-lib/aws-dynamodb` to create a new class *GenericTable.ts*
- In SpaceStack, initialize the GenericTable class to create a new DynamoDB instance `spacesTable`
- Run `cdk synth`, should see a `SpacesTable` instance with Type: `AWS::DynamoDB::Table`
- Run `cdk deploy`, should create `AWS > DynamoDB > Tables > SpacesTable`, with partition key `spaceId`

## Use Lambda with TypeScript (CDK Node Lambda)
- Install esbuild `npm i -D esbuild@0`
- Install uuid `npm i uuid @types/uuid`
- Create a new lambda function in TypeScript *hello.ts*
- In SpaceStack, `import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'`
- Initialize the NodejsFunction as ts lambda `helloLambdaNodeJs`
- Run `cdk synth`, in folder `cdk.out/asset.***` the ts lambda should be compiled as `index.js`, including uuid
- The compiled file `index.js` is much bigger in size, because it includes the imported dependency `uuid`
- Run `cdk deploy`, it should create a new lambda `SpaceFinder-helloLambdaNodeJs***`

## Test and debug lambdas
- Add some console log in lambda, deploy and then send a request in *requests.http*
- On AWS console, goto CloudWatch > Log Groups > /aws/lambda/SpaceFinder-helloLambdaNodeJs***, check for logs
- To list S3 buckets, add S3 using aws-sdk into *hello.ts*
- To allow lambda to list S3 buckets, add **role policy** to lambda using aws-cdk `PolicyStatement` in *SpaceStack.ts*
- Redeploy the SpaceStack, then send a request in *requests.http*, the log group should show S3 buckets

## Run and debug lambda on LOCAL MACHINE
- Make sure admin access is configured in CLI
- Make sure `ts-node` is installed in package.json
- In VS Code, go to *Run and Degug* (ctrl + shift + D), create a debug configuration: `.vscode/launch.json`
- In launch.json, name it `Debug local file`, add runtime as `ts-node/register`, and set AWS_REGION to `ap-southeast-2`
- If AWS session token is used, add them into the `env` property of `launch.json` as environment variables
- Create a test file *Hello.test.ts*, import the handler, call the handler with empty objects as args
- Now we can put a break point into the lambda, right aafter `const buckets = await s3Client.listBuckets().promise()`
- Open *Hello.test.ts* in VS Code, click **Run and Degug**, select `Debug local file`, then click `Run`
- Now the break point will be hit, all the buckets from AWS will be listed on the left hand side

## Refactor GenericTable.ts
- Add interface `TableProps` and inject it into constructor as props
- Run `this.initialize()` in constructor, which will run `createTable` `createLambdas` and `grantTableRights`
- In `createTable`,  pass in `tableName` and `primaryKey` from `this.props`
- In `createLambdas`, add 4 lambdas for CRUD operations and integrate them
- In `grantTableRights`, allow the 4 lambdas to read from or write into DynamoDB table
- Once refactored, goto SpaceStack.ts, and integrate the `createLambda` with API Gateway
- In *requests.http*, add a POST request with payload `location` and `name`
- Run `cdk synth` to check for errors, then run `cdk deploy` to deploy
- Send the POST request, a new item with location and name will be created in DynamoDB

## Scan method: get all items from DynamoDB
- Create a new handler file *Read.ts*, use `dbClient.scan()` to get all items from DynamoDb
- To test it locally, create *Read.test.ts*, import handler from *Read.ts*, add a break point at the end
- Add environment variable `TABLE_NAME` into the env property of `launch.json` for local debug
- Run debug in *Read.test.ts*, the items variable should show all the items in DynamoDB

## Query method: search by condition in DynamoDB
- Use query string parameter as the search condition
- Search by primary key (spaceId): `{{endpoint}}/spaces?spaceId=6928c6b4-d227-4422-b4c1-89bd4e05782e`
- Add the new logic in Read.ts, use `dbClient.query()` to search by spaceId
- To test it locally, create a new item and get the new ID
- Add *QueryString.test.ts*, mock the event with the new ID as `queryStringParameters`
- Add environment variable `PRIMARY_KEY` into the env property of `launch.json` for local debug
- Add a break point in *QueryString.test.ts*, run debug, the items array will show 1 element with the mocked ID
- To deploy the read lambda, in *SpaceStack.ts* add `readLambdaPath` and a GET method for `readLambdaIntegration`
- Run `cdk deploy`, add a GET method with query string in *requests.http*, run the GET method should return the item with privided ID

## Query on secondary indexes (location)
- To use `location` as a secondary index, add a new TableProps `secondaryIndexes` in *GenericTable.ts*
- Add a new method `addSecondaryIndexes`, and call it in the `initialize` mothod
- In *SpaceStack.ts*, initialize the GenericTable with `secondaryIndexes: ['location']`
- Refactor *Read.ts*, add a new method `queryWithSecondaryPartition`, use `dbClient.query()` to search by location
- To debug locally, need to deploy first, because the table config has changed
- Create a new file *SecondaryIndex.test.ts*, mock query parameter location to be London, add a break point at the end, run debug, the `items` variable should included all items with location equals London
- In requests.http, add a new GET method with `location=London`, the response should include all items with location equals London
