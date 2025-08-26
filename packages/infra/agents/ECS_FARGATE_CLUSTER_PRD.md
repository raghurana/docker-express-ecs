# ECS Fargate Cluster Implementation PRD

## Overview

This document outlines the implementation of a new ECS Fargate cluster for non-production environments with minimal cost configuration. The cluster will be fronted by an Application Load Balancer (ALB) and include an ECR registry for container image management.

## Business Requirements

- **Environment**: Non-production account
- **Region**: ap-southeast-2 (Sydney)
- **Cost Optimization**: Minimal/cheap configuration
- **Availability**: Single AZ deployment
- **Container Registry**: ECR for image storage and management
- **Load Balancing**: ALB with target group routing to ECS cluster
- **Health Monitoring**: Container-level and load balancer-level health checks
- **VPC**: Leverage existing VPC infrastructure (no new VPC provisioning)

## Technical Requirements

### ECS Fargate Cluster

- **Service Type**: Fargate (serverless)
- **Capacity Provider**: FARGATE
- **Desired Count**: 1 (minimal cost)
- **CPU**: 0.25 vCPU (256 CPU units)
- **Memory**: 0.5 GB (512 MB)
- **Platform Version**: LATEST

### ECR Registry

- **Repository Name**: `docker-express-env`
- **Image Tagging**: Latest and versioned tags
- **Lifecycle Policy**: Clean up untagged images older than 7 days
- **Cross-Account Access**: Configured for non-prod account

### Application Load Balancer

- **Type**: Application Load Balancer (ALB)
- **Scheme**: Internet-facing
- **Security Groups**: Allow HTTP (80) and HTTPS (443)
- **Target Group**: ECS service target group
- **Health Check Path**: `/health`
- **Health Check Interval**: 30 seconds
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 3

### Health Checks

- **Container Level**: ECS task health check using `/health` endpoint
- **Load Balancer Level**: ALB health check with same endpoint
- **Grace Period**: 60 seconds for container startup
- **Timeout**: 5 seconds for health check response

### Security

- **IAM Roles**: ECS task execution and task running roles
- **Security Groups**: Minimal required ports (80, 443)
- **Encryption**: ECR images encrypted at rest
- **Network**: Use existing VPC and subnets

## Architecture

```
Internet → ALB → Target Group → ECS Fargate Service → Container
                ↓
            ECR Registry ← Container Image Push
```

## Implementation Plan

### Phase 1: Infrastructure Setup

1. Create ECR repository with lifecycle policies
2. Deploy ECS Fargate cluster
3. Configure IAM roles and security groups
4. Deploy Application Load Balancer

### Phase 2: Service Configuration

1. Create ECS service definition
2. Configure task definition with health checks
3. Set up target group and listener rules
4. Test health check endpoints

### Phase 3: Testing & Validation

1. Deploy container image to ECR
2. Verify ECS service health
3. Test load balancer health checks
4. Validate end-to-end connectivity

## CDK Implementation

### Stack Structure

```typescript
// New stack: EcsFargateStack
export class EcsFargateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECR Repository
    // ECS Cluster
    // Load Balancer
    // Target Group
    // ECS Service
    // Security Groups
    // IAM Roles
  }
}
```

### Key Constructs

- `ecr.Repository` - Container image registry
- `ecs.Cluster` - Fargate cluster
- `ecs.FargateService` - ECS service
- `elasticloadbalancingv2.ApplicationLoadBalancer` - ALB
- `elasticloadbalancingv2.ApplicationTargetGroup` - Target group
- `iam.Role` - Task execution and running roles

## Cost Estimation

### Monthly Costs (ap-southeast-2)

- **ECS Fargate**: ~$8-12/month (0.25 vCPU, 0.5GB RAM, 24/7)
- **ECR**: ~$0.10/month (storage + data transfer)
- **ALB**: ~$18/month (fixed cost)
- **Data Transfer**: ~$1-5/month (depending on usage)
- **Total Estimated**: ~$27-35/month

### Cost Optimization Strategies

- Single AZ deployment
- Minimal resource allocation
- ECR lifecycle policies for image cleanup
- Auto-scaling based on demand (future enhancement)

## Success Criteria

- [ ] ECS Fargate cluster successfully deployed
- [ ] ECR repository accessible and functional
- [ ] Load balancer health checks passing
- [ ] Container health checks working
- [ ] End-to-end connectivity verified
- [ ] Cost within budget (<$50/month)
- [ ] Health check endpoint responding correctly

## Risk Assessment

### Low Risk

- ECS Fargate deployment (well-established pattern)
- ECR repository creation
- Basic load balancer configuration

### Medium Risk

- Health check configuration complexity
- Security group and IAM role setup
- Integration between ALB and ECS

### Mitigation Strategies

- Use existing CDK patterns and constructs
- Implement health checks incrementally
- Test in isolated environment first
- Document all configuration steps

## Dependencies

- Existing VPC infrastructure in ap-southeast-2
- CDK v2.211.0 or higher
- TypeScript 5.3.0+
- AWS CLI configured for target account in ap-southeast-2
- Container image ready for deployment

## Future Enhancements

- Multi-AZ deployment for production
- Auto-scaling based on CPU/memory metrics
- Blue-green deployment strategy
- CloudWatch monitoring and alerting
- Cost optimization through spot instances
- Integration with CI/CD pipeline

## Testing Strategy

### Unit Tests

- CDK construct validation
- IAM policy verification
- Security group rule validation

### Integration Tests

- ECR push/pull operations
- ECS service deployment
- Load balancer health checks
- End-to-end HTTP requests

### Load Tests

- Container performance under load
- Load balancer capacity
- Health check responsiveness

## Rollback Plan

1. **Immediate Rollback**: CDK destroy command
2. **Partial Rollback**: Revert specific constructs
3. **Data Preservation**: ECR images backed up
4. **Service Continuity**: Minimal downtime during rollback

## Documentation Requirements

- Infrastructure as Code (CDK)
- Deployment procedures
- Troubleshooting guide
- Cost monitoring setup
- Security configuration details
- Health check endpoint specifications
