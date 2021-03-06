## Install AWS CLI v2

- Go to https://aws.amazon.com/cli/, download and install AWS CLI v2
- To verify installation, run `aws --version`
- Go to AWS console > IAM > Users > you > Security credentials tab > Create access key
- Grab the Access Key ID and Secret Access Key
- Run `aws configure`, then enter the secrets, enter default output format: json
- Verify config by running `aws s2 ls`

## Install AWS-CDK

- To install CDK globally, run `sudo npm i -g aws-cdk`
- To automatically initialise a project, run `cdk init app --language typescript`
- Run `cdk synth` to check stack
- Run only once `cdk bootstrap` to bootstrap the stack on AWS console

## Initialize manually

- To manually initialize, do NOT run `cdk init app --language typescript`
- Run `npm init -y`
- Run `npm i -D aws-cdk aws-cdk-lib constructs ts-node typescript`
- Setup _Launcher.ts_ and _SpaceStack.ts_ in infrastructure folder
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
- In VS-Code, install Rest Client, then add a _requests.http_ file, it can send requests like postman.

## Add DynamoDB

- Use package `aws-cdk-lib/aws-dynamodb` to create a new class _GenericTable.ts_
- In SpaceStack, initialize the GenericTable class to create a new DynamoDB instance `spacesTable`
- Run `cdk synth`, should see a `SpacesTable` instance with Type: `AWS::DynamoDB::Table`
- Run `cdk deploy`, should create `AWS > DynamoDB > Tables > SpacesTable`, with partition key `spaceId`

## Use Lambda with TypeScript (CDK Node Lambda)

- Install esbuild `npm i -D esbuild@0`
- Install uuid `npm i uuid @types/uuid`
- Create a new lambda function in TypeScript _hello.ts_
- In SpaceStack, `import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'`
- Initialize the NodejsFunction as ts lambda `helloLambdaNodeJs`
- Run `cdk synth`, in folder `cdk.out/asset.***` the ts lambda should be compiled as `index.js`, including uuid
- The compiled file `index.js` is much bigger in size, because it includes the imported dependency `uuid`
- Run `cdk deploy`, it should create a new lambda `SpaceFinder-helloLambdaNodeJs***`

## Test and debug lambdas

- Add some console log in lambda, deploy and then send a request in _requests.http_
- On AWS console, goto CloudWatch > Log Groups > /aws/lambda/SpaceFinder-helloLambdaNodeJs\*\*\*, check for logs
- To list S3 buckets, add S3 using aws-sdk into _hello.ts_
- To allow lambda to list S3 buckets, add **role policy** to lambda using aws-cdk `PolicyStatement` in _SpaceStack.ts_
- Redeploy the SpaceStack, then send a request in _requests.http_, the log group should show S3 buckets

## Run and debug lambda on LOCAL MACHINE

- Make sure admin access is configured in CLI
- Make sure `ts-node` is installed in package.json
- In VS Code, go to _Run and Degug_ (ctrl + shift + D), create a debug configuration: `.vscode/launch.json`
- In launch.json, name it `Debug local file`, add runtime as `ts-node/register`, and set AWS_REGION to `ap-southeast-2`
- If AWS session token is used, add them into the `env` property of `launch.json` as environment variables
- Create a test file _Hello.test.ts_, import the handler, call the handler with empty objects as args
- Now we can put a break point into the lambda, right aafter `const buckets = await s3Client.listBuckets().promise()`
- Open _Hello.test.ts_ in VS Code, click **Run and Degug**, select `Debug local file`, then click `Run`
- Now the break point will be hit, all the buckets from AWS will be listed on the left hand side

## Refactor GenericTable.ts

- Add interface `TableProps` and inject it into constructor as props
- Run `this.initialize()` in constructor, which will run `createTable` `createLambdas` and `grantTableRights`
- In `createTable`, pass in `tableName` and `primaryKey` from `this.props`
- In `createLambdas`, add 4 lambdas for CRUD operations and integrate them
- In `grantTableRights`, allow the 4 lambdas to read from or write into DynamoDB table
- Once refactored, goto SpaceStack.ts, and integrate the `createLambda` with API Gateway
- In _requests.http_, add a POST request with payload `location` and `name`
- Run `cdk synth` to check for errors, then run `cdk deploy` to deploy
- Send the POST request, a new item with location and name will be created in DynamoDB

## Scan method: get all items from DynamoDB

- Create a new handler file _Read.ts_, use `dbClient.scan()` to get all items from DynamoDb
- To test it locally, create _Read.test.ts_, import handler from _Read.ts_, add a break point at the end
- Add environment variable `TABLE_NAME` into the env property of `launch.json` for local debug
- Run debug in _Read.test.ts_, the items variable should show all the items in DynamoDB

## Query method: search by condition in DynamoDB

- Use query string parameter as the search condition
- Search by primary key (spaceId): `{{endpoint}}/spaces?spaceId=6928c6b4-d227-4422-b4c1-89bd4e05782e`
- Add the new logic in Read.ts, use `dbClient.query()` to search by spaceId
- To test it locally, create a new item and get the new ID
- Add _QueryString.test.ts_, mock the event with the new ID as `queryStringParameters`
- Add environment variable `PRIMARY_KEY` into the env property of `launch.json` for local debug
- Add a break point in _QueryString.test.ts_, run debug, the items array will show 1 element with the mocked ID
- To deploy the read lambda, in _SpaceStack.ts_ add `readLambdaPath` and a GET method for `readLambdaIntegration`
- Run `cdk deploy`, add a GET method with query string in _requests.http_, run the GET method should return the item with privided ID

## Query on secondary indexes (location, name...)

- To use `location` as a secondary index, add a new TableProps `secondaryIndexes` in _GenericTable.ts_
- Add a new method `addSecondaryIndexes`, and call it in the `initialize` mothod
- In _SpaceStack.ts_, initialize the GenericTable with `secondaryIndexes: ['location']`
- Refactor _Read.ts_, add a new method `queryWithSecondaryPartition`, use `dbClient.query()` to search by location
- To debug locally, need to deploy first, because the table config has changed
- Create a new file _SecondaryIndex.test.ts_, mock query parameter location to be London, add a break point at the end, run debug, the `items` variable should included all items with location equals London
- In requests.http, add a new GET method with `location=London`, the response should include all items with location equals London

## Update item

- Create _Update.ts_, use `dbClient.update()` to modify the item
- Get the request data from `event.body`, get primary key (spaceId) from query string `event.queryStringParameters.spaceId`
- Locally test the handler in _Update.test.ts_, grab an existing item ID from db
- Mock spaceId and location in the event arg, run debug, the item with provided spaceId should be updated

## Delete item

- Create _Delete.ts_, use `dbClient.delete()` to remove the item with provided ID
- Locally test the handler in _Delete.test.ts_, grab an existing item ID from db
- Update _SpaceStack.ts_ to include update and delete handlers, then deploy the stack

## Manually setup Cognito in AWS console

- Go to AWS console > Cognito, select **Manage user pools**
- Create a new user pool _User-pool-test_
- In **Attributes**, allow sign in with email and username
- Follow default settings in all other steps, then click **Create pool**
- Once the pool is created, copy the User Pool ID `ap-southeast-2_wM1n73HNa`
- Go to **App integration > Domain name**, add domain prefix `joe-cui`, click **Save changes**
- Go to **General Settings > App clients > Add an app client**
- Name it `my-app-client`, uncheck **Generate client secret**, check all boxes in **Auth Flows Configuration**
- Click **Create app client**, copy the App Client ID `14n91s6eirhj5b22pgpsi6k99u`
- Go to **General Settings > Users and groups > Create user**
- Set username, initial password and email, click Create button
- The initial password is only temporary, need to set it to _permanent_ in CLI
- Go to CLI, enter `aws cognito-idp admin-set-user-password --user-pool-id ap-southeast-2_wM1n73HNa --username joe.cui --password "g98yad0Thj#la5" --permanent`, then the user account status should become _CONFIRMED_

## Login with Amplify and Cognito before creating React app

- Run `npm i aws-amplify @aws-amplify/auth`
- Create _config.ts_ to store Cognito user pool data from previous section
- Create _AuthService.ts_ to configure Amplify and include `login()` method from Amplify Auth
- To test the login method locally, create a test file _auth.test.ts_
- In test file, login with the username and password in _config.ts_
- In _AuthService.ts_, add a break point before returning the CognitoUser in login method
- Run debug in _auth.test.ts_, the returned `user` from Cognito should contain JWT `{signInUserSession:{idToken:{jwtToken:'eyJra...'}}}`

## Manually setup ApiGateway Authorizer

- Go to **API Gateway > SpaceApi > Authorizers**, click **Create new authorizer**
- Name it `My-test-authorizer`, select Type `Cognito`, enter Cognito User Pool `User-pool-test`
- In **Token Source**, enter `Authorization` which means authorization header of HTTP request
- Click **Create** button, copy Authorizer ID: `yb2rr0`
- Go to **API Gateway > SpaceApi > Resources**, select **/hello > GET > Method Request**
- In **Settings > Authorization**, select `My-test-authorizer`
- Once updated, need to redeploy API. Click **Actions** button and select **Deploy API**, select `prod` stage and click **Deploy**
- Once redeployed, the request `GET {{endpoint}}/hello/` (without token) should return 401 "Unauthorized"
- To test the JWT auth, run debug in _auth.test.ts_, brab the `jwtToken` and use it in _requests.http_
- Add `Authorization: {{token}}` after `GET {{endpoint}}/hello/`, make the request, it should return 200 with data payload

## Setup Cognito infrastructure using CDK

- In folder _infrastructure > auth_, create a new file _AuthorizerWrapper.ts_
- Write the logic to create Cognito user pool, user pool client, authorizer, and attach authorizer to API
- Include `AuthorizerWrapper` in _SpaceStack.ts_, add authorizer to the GET method of `helloLambdaResource` as options
- Run `cdk synth` to check for errors, then run `cdk deploy`
- Once deployed, the terminal will show `UserPoolClientId = 2vlc9u75nen5sr9q4qhrqr6url` and `UserPoolId = ap-southeast-2_NX7tExP4e`, thanks to the `CfnOutput` in _AuthorizerWrapper.ts_
- Grab `UserPoolId` and `UserPoolClientId` from terminal, update the values in _config.ts_, which were created manually before
- To test it, need to create a new user. Go to **AWS > Cognito > Manage User Pools**, we should see the **SpaceUserPool** button
- Click **SpaceUserPool**, create a new user _joe.cui.2_, with the same password as before, update the user name in _config.ts_
- Once created, use CLI to update account status, with the new `UserPoolId`, then the account _joe.cui.2_ should become _CONFIRMED_
- Open _auth.test.ts_, run debug, copy jwtToken, paste it into _requests.http_, send request to `GET {{endpoint}}/hello/`, should receive 200 response
- Go to **AWS > API Gateway > SpaceApi > Resources > /hello > GET**, Method Request should have `Auth: SpaceUserAuthorizer`

## Add admin user group

- In _AuthorizerWrapper.ts_ add a new method `createAdminsGroup`
- In _hello.ts_, update the lambda to return stringified event
- Run `cdk deploy`, go to **AWS > Cognito > Manage User Pools > Users and groups > Groups**, we should see `admins` group
- Select _joe.cui.2_, click **Add to group**, then select `admins`. Now the user has been added to the admins group
- Open _requests.http_, send request to `GET {{endpoint}}/hello/`, should see the whole lambda event (APIGatewayProxyEvent)
- In response, in `event.requestContext.authorizer.claims`, there should be `"cognito:groups": "admins"`
- Update _hello.ts_ to check for `cognito:groups` for authorization, then run `cdk deploy`
- Send request to `GET {{endpoint}}/hello/`, should see 200 response
- Remove user from `admins` group on AWS, get a new JWT, then send request with new token, should see 401 response

## Manually setup Cognito Identity Pools from console

- Cognito Identity Pools will allow users to assume IAM roles from token, to access other AWS services (e.g. S3)
- Go to **AWS > Cognito > Manage Identity Pools > Create New Identity Pool**
- Name it _my-test-identity-pool_, tick box **Enable access to unauthenticated identities** and **Allow Basic (Classic) Flow**
- In Authentication providers, select **Cognito** tab, enter User Pool ID and App client ID, click **Create** button
- In IAM roles page, click **Allow** button, then will get the Identity Pool ID, save it into _config.ts_
- Go to **Dashboard > Edit Identity Pool > Authentication Providers > Cognito**, change _Use default role_ to _Choose role from token_, click **Save Changes** button
- To test it locally, add new method `getAWSTemporaryCreds` in _AuthService.ts_, call this method in _auth.test.ts_, run debug, call to the aws-sdk `AWS.config.credentials` should return _accessKeyId_ and _sessionToken_

## Setup Identity Pool from CDK

- Create a new class _IdentityPoolWrapper.ts_, pass in the created `UserPool` and `UserPoolClient` in constructor
- In class, create a method `initializeIdentityPool`, to auto create identity pool from CDK
- To add new IAM roles, create a method `initializeRoles`, need to get the the args from **AWS > IAM > Roles > Cognito_mytestidentitypoolAuth_Role > Trust relationship tab**
- Once the roles are added, attach the roles to the identity pool in _AuthorizerWrapper.ts_, by adding a new method `initializeIdentityPoolWrapper`
- Run `cdk deploy`, **SpaceFinderIdentityPool** should be created
- Copy the _Space-finder.IdentityPoolId_ from terminal after deploy, copy it to replace the `IDENTITY_POOL_ID` in _config.ts_
- To test it locally, update _auth.test.ts_ and run debug, `getBuckets()` should throw error _accessDenied_
- Manually add user _joe.cui.2_ to Group _admins_ in AWS console, run debug again, it should return buckets list

## Deploy frontend

- In backend infrastructure folder, add new class `WebAppDeployment.ts`, which will read the *build* folder in frontend
- In frontend end folder, run `npm run build`
- In backend, run `cdk deploy`, S3 bucket will be updated together with other services
- To invalidate CloudFront cache, run `aws cloudfront create-invalidation --distribution-id <dist_id> --paths '/*'`

## Update users in cognito user pool

- Once users are added in user pool, password can be reset by AWS CLI
```
aws cognito-idp admin-set-user-password --user-pool-id <userpoolid> --username joe --password <password> --permanent
```
