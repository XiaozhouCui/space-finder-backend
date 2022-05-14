import { CfnOutput, Stack } from "aws-cdk-lib";
import { CloudFrontWebDistribution } from "aws-cdk-lib/aws-cloudfront";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { join } from "path";

export class WebAppDeployment {
  // inject 2 properties with constructor
  private stack: Stack
  private bucketSuffix: string

  constructor(stack: Stack, bucketSuffix: string) {
    this.stack = stack
    this.bucketSuffix = bucketSuffix
    this.initialize()
  }

  // S3 bucket for the frontend app
  private deploymentBucket: Bucket

  private initialize() {
    // create the S3 bucket for frontend app
    const bucketName = 'space-app-web' + this.bucketSuffix
    this.deploymentBucket = new Bucket(
      this.stack,
      'space-app-web-id',
      {
        bucketName,
        publicReadAccess: true,
        websiteIndexDocument: 'index.html'
      }
    )
    // move the frontend build folder into S3 bucket
    new BucketDeployment(
      this.stack,
      'space-app-web-id-deployment',
      {
        destinationBucket: this.deploymentBucket,
        sources: [
          Source.asset(
            join(__dirname, '..', '..', 'space-finder-frontend', 'build')
          )
        ],
      }
    )
    // print out the bucket information
    new CfnOutput(this.stack, 'spaceFinderWebAppS3Url', {
      value: this.deploymentBucket.bucketWebsiteUrl
    })
    // Add CloudFront for S3 bucket
    const cloudFront = new CloudFrontWebDistribution(
      this.stack,
      'space-app-web-distribution',
      {
        originConfigs: [
          {
            behaviors: [{ isDefaultBehavior: true }],
            s3OriginSource: {
              s3BucketSource: this.deploymentBucket
            }
          }
        ],
        // redirect SPA routes back to root '/'
        errorConfigurations: [
          {
            errorCode: 403,
            responsePagePath: '/index.html',
            responseCode: 200,
            errorCachingMinTtl: 10
          }
        ]
      }
    )
    // print out the CloudFront information
    new CfnOutput(this.stack, 'spaceFinderWebAppCloudFrontUrl', {
      value: cloudFront.distributionDomainName
    })
  }
}