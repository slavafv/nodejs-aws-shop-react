import * as cdk from "aws-cdk-lib"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment"
import { RemovalPolicy } from "aws-cdk-lib"
import * as path from "path"

export class NodejsAwsShopReactStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create an S3 bucket to host the website
    const websiteBucket = new s3.Bucket(this, "slava-aws-shop-react-bucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    })

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "Distribution-slava",
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          responseHeadersPolicy:
            cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    )

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, "slava-aws-shop-react", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../dist"))], // Path to your built frontend assets
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    })

    // Output the CloudFront URL
    new cdk.CfnOutput(this, "DistributionDomainName-slava", {
      value: distribution.distributionDomainName,
    })
  }
}
