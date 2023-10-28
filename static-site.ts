import { aws_iam as iam, aws_s3 as s3, aws_cloudfront as cloudfront, aws_s3_deployment as s3deploy, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class StaticSite extends Construct {
  constructor(parent: Stack, name: string) {
    super(parent, name);

    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'JSCC-OAI');

    const siteBucket = new s3.Bucket(this, 'JSCCStaticBucket', {
      bucketName: 'js-ccc-cloudfront-s3',
      websiteIndexDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [siteBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      }),
    );

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'JSCC-distribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
    });

    new s3deploy.BucketDeployment(this, 'JSCC-Bucket-Deployment', {
      sources: [s3deploy.Source.asset('./dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}
