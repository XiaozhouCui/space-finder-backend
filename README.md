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
