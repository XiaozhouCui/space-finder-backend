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