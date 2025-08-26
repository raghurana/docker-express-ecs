import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface EcsConstructProps {
  readonly vpc: ec2.IVpc;
  readonly ecrRepository: ecr.IRepository;
  readonly ecsSecurityGroup: ec2.ISecurityGroup;
  readonly clusterName?: string;
  readonly serviceName?: string;
  readonly memoryLimitMiB?: number;
  readonly cpu?: number;
  readonly desiredCount?: number;
  readonly logRetention?: logs.RetentionDays;
}

export class EcsConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly service: ecs.FargateService;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    const {
      vpc,
      ecrRepository,
      ecsSecurityGroup,
      clusterName = 'docker-express-cluster',
      serviceName = 'docker-express-service',
      memoryLimitMiB = 512,
      cpu = 256,
      desiredCount = 1,
      logRetention = logs.RetentionDays.ONE_DAY,
    } = props;

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'DockerExpressCluster', {
      vpc,
      clusterName,
      containerInsights: false, // Disabled for cost optimization
    });

    // CloudWatch Log Group for ECS tasks
    this.logGroup = new logs.LogGroup(this, 'DockerExpressLogGroup', {
      logGroupName: '/ecs/docker-express-env',
      retention: logRetention, // Cost optimization
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')],
      inlinePolicies: {
        ECRAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              resources: [ecrRepository.repositoryArn],
            }),
          ],
        }),
      },
    });

    // Task Role (for application permissions)
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'DockerExpressTaskDef', {
      memoryLimitMiB,
      cpu,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Container Definition
    const container = this.taskDefinition.addContainer('DockerExpressContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'docker-express',
        logGroup: this.logGroup,
      }),
      portMappings: [
        {
          containerPort: 3000,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    });

    // ECS Fargate Service
    this.service = new ecs.FargateService(this, 'DockerExpressService', {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      serviceName,
      desiredCount, // Minimal cost configuration
      assignPublicIp: true, // Required for Fargate in public subnets
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster name',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      description: 'ECS Service name',
    });
  }
}
