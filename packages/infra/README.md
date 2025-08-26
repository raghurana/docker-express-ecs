# ECS Fargate Infrastructure

This CDK project deploys a complete ECS Fargate cluster with Application Load Balancer and ECR repository for the Docker Express environment.

## Architecture

```
Internet → ALB → Target Group → ECS Fargate Service → Container
                ↓
            ECR Registry ← Container Image Push
```

## Infrastructure Components

- **VPC**: Single AZ VPC with public subnet (cost optimized)
- **ECR Repository**: `docker-express-env` with lifecycle policies
- **ECS Cluster**: `docker-express-cluster` with Fargate capacity
- **Application Load Balancer**: Internet-facing ALB with health checks
- **Target Group**: HTTP target group monitoring `/health` endpoint
- **ECS Service**: Fargate service with 1 desired count (minimal cost)
- **Security Groups**: Proper ingress/egress rules for ALB and ECS
- **IAM Roles**: Task execution and task roles with ECR permissions
- **CloudWatch Logs**: Log group for ECS task logging

## Cost Optimization

- **Estimated Monthly Cost**: ~$27-35/month
- Single AZ deployment to reduce data transfer costs
- No NAT Gateway (uses public subnets only)
- Minimal resources: 0.25 vCPU, 0.5GB RAM
- Short log retention: 1 week CloudWatch logs
- ECR lifecycle policies for automatic image cleanup
- Container insights disabled to reduce monitoring costs

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm installed
- Docker installed (for building container images)
- CDK CLI installed: `npm install -g aws-cdk`

## Quick Start

### 1. Deploy Infrastructure

```bash
# Install dependencies
npm install

# Deploy using the provided script
./deploy.sh
```

Or manually:

```bash
# Build the project
npm run build

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy the stack
npx cdk deploy
```

### 2. Build and Push Container Image

```bash
# Navigate to server directory
cd ../server

# Build Docker image
docker build -t docker-express-env .

# Get ECR login token
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com

# Tag and push image
docker tag docker-express-env:latest <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/docker-express-env:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/docker-express-env:latest
```

Replace `<ACCOUNT_ID>` with your AWS account ID from the deployment outputs.

### 3. Access Your Application

After deployment, the stack outputs will show:
- **LoadBalancerURL**: Your application URL
- **HealthCheckURL**: Health check endpoint
- **ECRRepositoryURI**: ECR repository for pushing images

## Available Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run unit tests
- `npx cdk deploy` - Deploy the stack to AWS
- `npx cdk diff` - Compare deployed stack with current state
- `npx cdk synth` - Emit the synthesized CloudFormation template
- `./deploy.sh` - Automated deployment script
- `./cleanup.sh` - Automated cleanup script

## Configuration

The infrastructure is configured for:
- **Region**: ap-southeast-2 (Sydney)
- **Environment**: Non-production
- **Container Port**: 3000
- **Health Check Path**: `/health`
- **Desired Count**: 1 (minimal cost)

## Monitoring and Health Checks

### Container Health Checks
- **Command**: `curl -f http://localhost:3000/health || exit 1`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Retries**: 3
- **Start Period**: 60 seconds

### Load Balancer Health Checks
- **Path**: `/health`
- **Protocol**: HTTP
- **Port**: 3000
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 3

## Security

- **Security Groups**: Minimal required ports (80, 443 for ALB, 3000 for ECS)
- **IAM Roles**: Least privilege access for ECS tasks
- **VPC**: Isolated network environment
- **ECR**: Images encrypted at rest
- **Public Subnets**: Used for cost optimization (no NAT Gateway charges)

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**
   ```bash
   npx cdk bootstrap aws://<ACCOUNT_ID>/ap-southeast-2
   ```

2. **ECR Push Permission Denied**
   ```bash
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com
   ```

3. **ECS Service Not Starting**
   - Check CloudWatch logs: `/ecs/docker-express-env`
   - Verify container image exists in ECR
   - Check security group rules

4. **Health Check Failures**
   - Ensure Express server is running on port 3000
   - Verify `/health` endpoint returns 200 status
   - Check container health check command

### Useful AWS CLI Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster docker-express-cluster --services docker-express-service --region ap-southeast-2

# View ECS task logs
aws logs tail /ecs/docker-express-env --follow --region ap-southeast-2

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN> --region ap-southeast-2

# List ECR images
aws ecr list-images --repository-name docker-express-env --region ap-southeast-2
```

## Cleanup

To destroy all resources and stop charges:

```bash
./cleanup.sh
```

Or manually:

```bash
npx cdk destroy
```

**Warning**: This will permanently delete all resources including the ECR repository and container images.

## Development

### Project Structure

```
packages/infra/
├── bin/
│   └── infra.ts          # CDK app entry point
├── lib/
│   └── infra-stack.ts    # Main infrastructure stack
├── test/
│   └── infra.test.ts     # Unit tests
├── agents/
│   ├── ECS_FARGATE_CLUSTER_PRD.md  # Product requirements
│   ├── README.md         # Agent documentation
│   └── TASKS.md          # Implementation tasks
├── deploy.sh             # Deployment script
├── cleanup.sh            # Cleanup script
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── cdk.json              # CDK configuration
```

### Adding New Resources

1. Add constructs to `lib/infra-stack.ts`
2. Update tests in `test/infra.test.ts`
3. Run `npm run build` to compile
4. Run `npx cdk diff` to review changes
5. Run `npx cdk deploy` to deploy

### Cost Monitoring

Monitor your AWS costs in the AWS Billing Dashboard:
- **ECS Fargate**: Charges per vCPU-hour and GB-hour
- **Application Load Balancer**: Fixed hourly charge + data processing
- **ECR**: Storage charges for container images
- **CloudWatch Logs**: Storage and ingestion charges
- **Data Transfer**: Outbound data transfer charges

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CloudWatch logs for error messages
3. Verify AWS credentials and permissions
4. Check the [CDK documentation](https://docs.aws.amazon.com/cdk/)
5. Review the [ECS Fargate documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
