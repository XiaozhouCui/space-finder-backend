## Initialize manually
- To manually initialize, do NOT run `cdk init app --language typescript`
- Run `npm init -y`
- Run `npm i -D aws-cdk aws-cdk-lib constructs ts-node typescript`
- Setup Launcher.ts and SpaceStack.ts in infrastructure folder
- Copy tsconfig.json from CDK-CLI (`cdk init`) generated project
- Run `cdk synth` should have no errors