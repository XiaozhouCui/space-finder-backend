## Initialize manually
- To manually initialize, do NOT run `cdk init app --language typescript`
- Run `npm init -y`
- Run `npm i -D aws-cdk aws-cdk-lib constructs ts-node typescript`
- Setup Launcher.ts and SpaceStack.ts in infrastructure folder
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
- In VS-Code, install Rest Client, then add a requests.http file, it can send requests like postman.

## Add DynamoDB
- Use package `aws-cdk-lib/aws-dynamodb` to create a new class `GenericTable.ts`
- In SpaceStack, initialize the GenericTable class to create a new DynamoDB instance `spacesTable`
- Run `cdk synth`, should see a `SpacesTable` instance with Type: `AWS::DynamoDB::Table`
- Run `cdk deploy`, should create `AWS > DynamoDB > Tables > SpacesTable`, with partition key `spaceId`

## Use Lambda with TypeScript (CDK Node Lambda)
- Install esbuild `npm i -D esbuild@0`
- Install uuid `npm i uuid @types/uuid`
- Create a new lambda function in TypeScript `hello.ts`
- In SpaceStack, `import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'`
- Initialize the NodejsFunction as ts lambda `helloLambdaNodeJs`
- Run `cdk synth`, in folder `cdk.out/asset.***` the ts lambda should be compiled as `index.js`, including uuid
- The compiled file `index.js` is much bigger in size, because it includes the imported dependency `uuid`
- Run `cdk deploy`, it should create a new lambda `SpaceFinder-helloLambdaNodeJs***`
