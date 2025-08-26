#!/bin/bash

# ECS Fargate Infrastructure Cleanup Script
# This script destroys the Docker Express environment from AWS

set -e

echo "🧹 Starting ECS Fargate Infrastructure Cleanup"
echo "=============================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' to set up your credentials"
    exit 1
fi

# Get AWS account and region info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-southeast-2"

echo "📋 Cleanup Information:"
echo "   Account ID: $ACCOUNT_ID"
echo "   Region: $REGION"
echo "   Stack Name: DockerExpressStack"
echo ""

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name DockerExpressStack --region $REGION > /dev/null 2>&1; then
    echo "ℹ️  Stack DockerExpressStack does not exist or has already been deleted"
    exit 0
fi

# Show what will be destroyed
echo "⚠️  This will destroy the following resources:"
echo "   - VPC and all networking components"
echo "   - ECR Repository and all container images"
echo "   - ECS Fargate Cluster and Service"
echo "   - Application Load Balancer"
echo "   - Security Groups and IAM Roles"
echo "   - CloudWatch Log Groups"
echo ""

read -p "Are you sure you want to destroy all resources? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo "🧹 Destroying infrastructure..."

# First, try to empty ECR repository if it exists
ECR_REPO_URI=$(aws cloudformation describe-stacks \
    --stack-name DockerExpressStack \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$ECR_REPO_URI" ]; then
    echo "🗑️  Emptying ECR repository..."
    aws ecr list-images --repository-name docker-express-env --region $REGION --query 'imageIds[*]' --output json | \
    jq '.[] | select(.imageTag != null) | {imageTag: .imageTag}' | \
    jq -s '.' | \
    xargs -I {} aws ecr batch-delete-image --repository-name docker-express-env --region $REGION --image-ids '{}' 2>/dev/null || true
    
    # Also delete untagged images
    aws ecr list-images --repository-name docker-express-env --region $REGION --filter tagStatus=UNTAGGED --query 'imageIds[*]' --output json | \
    jq -s '.' | \
    xargs -I {} aws ecr batch-delete-image --repository-name docker-express-env --region $REGION --image-ids '{}' 2>/dev/null || true
    
    echo "✅ ECR repository emptied"
fi

# Destroy the CDK stack
npx cdk destroy --force

if [ $? -ne 0 ]; then
    echo "❌ Cleanup failed"
    echo "You may need to manually delete some resources in the AWS console"
    exit 1
fi

echo ""
echo "🎉 Cleanup successful!"
echo "=============================================="
echo "All resources have been destroyed."
echo ""
echo "💰 Cost Impact:"
echo "   - No more charges for ECS Fargate tasks"
echo "   - No more charges for Application Load Balancer"
echo "   - No more charges for VPC NAT Gateway (none was created)"
echo "   - ECR storage charges stopped"
echo "   - CloudWatch logs charges stopped"
echo ""
echo "Note: It may take a few minutes for all resources to be fully deleted"
echo "and for charges to stop appearing in your AWS bill."
