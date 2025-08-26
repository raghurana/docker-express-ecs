import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export interface AlbConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly ecsService: ecs.FargateService;
  readonly loadBalancerName?: string;
  readonly targetGroupName?: string;
}

export class AlbConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  public readonly listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    const {
      vpc,
      albSecurityGroup,
      ecsService,
      loadBalancerName = 'docker-express-alb',
      targetGroupName = 'docker-express-tg',
    } = props;

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'DockerExpressALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'DockerExpressTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        port: '3000',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      targetGroupName,
    });

    // ALB Listener
    this.listener = this.alb.addListener('DockerExpressListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup],
    });

    // Attach the service to the target group
    ecsService.attachToApplicationTargetGroup(this.targetGroup);

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'LoadBalancerURL', {
      value: `http://${this.alb.loadBalancerDnsName}`,
      description: 'Application Load Balancer URL',
    });

    new cdk.CfnOutput(this, 'HealthCheckURL', {
      value: `http://${this.alb.loadBalancerDnsName}/health`,
      description: 'Health check endpoint URL',
    });
  }
}
