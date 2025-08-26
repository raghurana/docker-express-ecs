import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a simple VPC for cost optimization (single AZ)
    const vpc = new ec2.Vpc(this, "DockerExpressVpc", {
      maxAzs: 1, // Single AZ for cost optimization
      natGateways: 0, // No NAT Gateway for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // ECR Repository for container images
    const ecrRepository = new ecr.Repository(this, "DockerExpressRepo", {
      repositoryName: "docker-express-env",
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: "Clean up untagged images older than 7 days",
          maxImageAge: cdk.Duration.days(7),
          tagStatus: ecr.TagStatus.UNTAGGED,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For non-prod environment
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, "DockerExpressCluster", {
      vpc,
      clusterName: "docker-express-cluster",
      containerInsights: false, // Disabled for cost optimization
    });

    // CloudWatch Log Group for ECS tasks
    const logGroup = new logs.LogGroup(this, "DockerExpressLogGroup", {
      logGroupName: "/ecs/docker-express-env",
      retention: logs.RetentionDays.ONE_DAY, // Cost optimization
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Execution Role
    const taskExecutionRole = new iam.Role(this, "TaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
      inlinePolicies: {
        ECRAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    // Task Role (for application permissions)
    const taskRole = new iam.Role(this, "TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "DockerExpressTaskDef",
      {
        memoryLimitMiB: 512, // 0.5 GB for cost optimization
        cpu: 256, // 0.25 vCPU for cost optimization
        executionRole: taskExecutionRole,
        taskRole: taskRole,
      }
    );

    // Container Definition
    const container = taskDefinition.addContainer("DockerExpressContainer", {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository, "latest"),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "docker-express",
        logGroup: logGroup,
      }),
      portMappings: [
        {
          containerPort: 3000,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
      environment: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
      vpc,
      description: "Security group for Application Load Balancer",
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic from internet"
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from internet"
    );

    // Security Group for ECS Service
    const ecsSecurityGroup = new ec2.SecurityGroup(this, "ECSSecurityGroup", {
      vpc,
      description: "Security group for ECS Fargate service",
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      "Allow traffic from ALB to ECS service"
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, "DockerExpressALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: "docker-express-alb",
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "DockerExpressTargetGroup",
      {
        vpc,
        port: 3000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          enabled: true,
          path: "/health",
          protocol: elbv2.Protocol.HTTP,
          port: "3000",
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targetGroupName: "docker-express-tg",
      }
    );

    // ALB Listener
    const listener = alb.addListener("DockerExpressListener", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // ECS Fargate Service
    const service = new ecs.FargateService(this, "DockerExpressService", {
      cluster,
      taskDefinition,
      serviceName: "docker-express-service",
      desiredCount: 1, // Minimal cost configuration
      assignPublicIp: true, // Required for Fargate in public subnets
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });

    // Attach the service to the target group
    service.attachToApplicationTargetGroup(targetGroup);

    // Outputs
    new cdk.CfnOutput(this, "ECRRepositoryURI", {
      value: ecrRepository.repositoryUri,
      description: "ECR Repository URI for docker-express-env",
    });

    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: alb.loadBalancerDnsName,
      description: "Application Load Balancer DNS name",
    });

    new cdk.CfnOutput(this, "LoadBalancerURL", {
      value: `http://${alb.loadBalancerDnsName}`,
      description: "Application Load Balancer URL",
    });

    new cdk.CfnOutput(this, "HealthCheckURL", {
      value: `http://${alb.loadBalancerDnsName}/health`,
      description: "Health check endpoint URL",
    });

    new cdk.CfnOutput(this, "ClusterName", {
      value: cluster.clusterName,
      description: "ECS Cluster name",
    });

    new cdk.CfnOutput(this, "ServiceName", {
      value: service.serviceName,
      description: "ECS Service name",
    });

    new cdk.CfnOutput(this, "VpcId", {
      value: vpc.vpcId,
      description: "VPC ID",
    });
  }
}
