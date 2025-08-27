import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface VpcConstructProps {
  readonly maxAzs?: number;
  readonly natGateways?: number;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps = {}) {
    super(scope, id);

    const { maxAzs = 1, natGateways = 0 } = props;

    // Create a VPC with at least 2 AZs for ALB requirements
    this.vpc = new ec2.Vpc(this, 'DockerExpressVpc', {
      maxAzs: Math.max(maxAzs, 2), // Ensure at least 2 AZs for ALB
      natGateways,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group for ALB
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from internet');

    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from internet');

    // Security Group for ECS Service
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS Fargate service',
      allowAllOutbound: true,
    });

    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB to ECS service',
    );
  }
}
