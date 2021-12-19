import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class SpaceStack extends Stack {
  // app is of type Construct
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)
  }
}