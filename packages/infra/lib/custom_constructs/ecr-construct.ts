import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export interface EcrConstructProps {
  readonly repositoryName?: string;
  readonly imageScanOnPush?: boolean;
  readonly maxImageAge?: cdk.Duration;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class EcrConstruct extends Construct {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcrConstructProps = {}) {
    super(scope, id);

    const {
      repositoryName = 'docker-express-env',
      imageScanOnPush = true,
      maxImageAge = cdk.Duration.days(7),
      removalPolicy = cdk.RemovalPolicy.DESTROY,
    } = props;

    // ECR Repository for container images
    this.repository = new ecr.Repository(this, 'DockerExpressRepo', {
      repositoryName,
      imageScanOnPush,
      lifecycleRules: [
        {
          description: 'Clean up untagged images older than 7 days',
          maxImageAge,
          tagStatus: ecr.TagStatus.UNTAGGED,
        },
      ],
      removalPolicy, // For non-prod environment
    });

    // Outputs
    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI for docker-express-env',
    });
  }
}
