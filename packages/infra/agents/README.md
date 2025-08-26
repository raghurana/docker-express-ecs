# Infrastructure Agents

This directory contains Product Requirements Documents (PRDs) and specifications for infrastructure components.

## Current Infrastructure Components

### ECS Fargate Cluster

- **Documentation**: `ECS_FARGATE_CLUSTER_PRD.md`
- **Purpose**: Non-production ECS Fargate cluster with minimal cost configuration
- **Region**: ap-southeast-2 (Sydney)
- **Components**: ECR registry, ALB, target groups, health checks

## Infrastructure Requirements

### Region Configuration

All infrastructure deployments are configured for **ap-southeast-2** (Sydney) region.

### CDK Configuration

- **Stack Name**: DockerExpressStack
- **Region**: ap-southeast-2
- **Account**: Uses default AWS CLI configuration

### Key Features

- Single AZ deployment for cost optimization
- Leverages existing VPC infrastructure
- Comprehensive health check configuration
- Minimal resource allocation (0.25 vCPU, 0.5GB RAM)

## Task Management

For current implementation tasks and progress tracking, see [TASKS.md](./TASKS.md).

## Deployment

To deploy the infrastructure:

```bash
cd packages/infra
npm run build
cdk deploy
```

## Cost Optimization

- **Estimated Monthly Cost**: $27-35/month
- Single AZ deployment
- Minimal resource allocation
- ECR lifecycle policies for image cleanup

## Health Checks

- **Container Level**: ECS task health check using `/health` endpoint
- **Load Balancer Level**: ALB health check with same endpoint
- **Health Check Path**: `/health`
- **Grace Period**: 60 seconds for container startup
