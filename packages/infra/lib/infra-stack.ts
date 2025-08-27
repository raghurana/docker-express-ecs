import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { VpcConstruct, EcrConstruct, EcsConstruct, AlbConstruct } from './custom_constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and Security Groups
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      maxAzs: 1, // Single AZ for cost optimization
      natGateways: 0, // No NAT Gateway for cost optimization
    });

    // Create ECR Repository
    const ecrConstruct = new EcrConstruct(this, 'EcrConstruct', {
      repositoryName: 'docker-express-env',
      imageScanOnPush: false,
      maxImageAge: cdk.Duration.days(3),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For non-prod environment
    });

    // Create ECS Cluster, Task Definition, and Service
    const ecsConstruct = new EcsConstruct(this, 'EcsConstruct', {
      vpc: vpcConstruct.vpc,
      ecrRepository: ecrConstruct.repository,
      ecsSecurityGroup: vpcConstruct.ecsSecurityGroup,
      clusterName: 'docker-express-cluster',
      serviceName: 'docker-express-service',
      memoryLimitMiB: 512, // 0.5 GB for cost optimization
      cpu: 256, // 0.25 vCPU for cost optimization
      desiredCount: 1, // Minimal cost configuration
      logRetention: logs.RetentionDays.ONE_DAY, // Cost optimization
    });

    // Create Application Load Balancer and Target Group
    const albConstruct = new AlbConstruct(this, 'AlbConstruct', {
      vpc: vpcConstruct.vpc,
      albSecurityGroup: vpcConstruct.albSecurityGroup,
      ecsService: ecsConstruct.service,
      loadBalancerName: 'docker-express-alb',
      targetGroupName: 'docker-express-tg',
    });

    // Additional Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: albConstruct.alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
    });

    new cdk.CfnOutput(this, 'AlbUrl', {
      value: `http://${albConstruct.alb.loadBalancerDnsName}`,
      description: 'ALB URL',
    });
  }
}
