#!/bin/bash

# ECS Fargate Infrastructure Deployment Script
# This script deploys the Docker Express environment to AWS

set -e

echo "🚀 Starting ECS Fargate Infrastructure Deployment"
echo "================================================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' to set up your credentials"
    exit 1
fi

# Get AWS account and region info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-southeast-2"

echo "📋 Deployment Information:"
echo "   Account ID: $ACCOUNT_ID"
echo "   Region: $REGION"
echo "   Stack Name: DockerExpressStack"
echo ""

# Build the CDK project
echo "🔨 Building CDK project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Check if CDK is bootstrapped
echo "🔍 Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION > /dev/null 2>&1; then
    echo "⚠️  CDK not bootstrapped in region $REGION"
    echo "🔧 Bootstrapping CDK..."
    npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
    
    if [ $? -ne 0 ]; then
        echo "❌ CDK bootstrap failed"
        exit 1
    fi
    
    echo "✅ CDK bootstrap successful"
else
    echo "✅ CDK already bootstrapped"
fi

# Show what will be deployed
echo "📋 Reviewing deployment plan..."
npx cdk diff

echo ""
echo "🚀 Deploying infrastructure..."
echo "This will create the following resources:"
echo "   - VPC with single AZ (cost optimized)"
echo "   - ECR Repository (docker-express-env)"
echo "   - ECS Fargate Cluster"
echo "   - Application Load Balancer"
echo "   - Security Groups and IAM Roles"
echo ""

read -p "Do you want to proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy the stack
npx cdk deploy --require-approval never

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo "================================================"

# Get stack outputs
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name DockerExpressStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,Description]' \
    --output table

echo ""
echo "📝 Next Steps:"
echo "1. Build your Docker image:"
echo "   cd ../../server && docker build -t docker-express-env ."
echo ""
echo "2. Get ECR login token:"
echo "   aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
echo ""
echo "3. Tag and push your image:"
echo "   docker tag docker-express-env:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/docker-express-env:latest"
echo "   docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/docker-express-env:latest"
echo ""
echo "4. The ECS service will automatically pull and deploy the image"
echo ""
echo "🔗 Your application will be available at the LoadBalancerURL shown above"
echo "🏥 Health check endpoint: LoadBalancerURL/health"
