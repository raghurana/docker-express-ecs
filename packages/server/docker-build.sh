#!/bin/bash

# Docker build and run script for Express server

# Set default values
IMAGE_NAME="express-server"
CONTAINER_NAME="express-server-container"
PORT=${PORT:-3000}
NODE_ENV=${NODE_ENV:-production}

echo "🐳 Building Docker image: $IMAGE_NAME"
echo "📦 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"

# Build the Docker image
docker build -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
    
    # Stop and remove existing container if it exists
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    echo "🚀 Starting container: $CONTAINER_NAME"
    
    # Run the container with environment variables
    docker run -d --name $CONTAINER_NAME -p $PORT:5000 $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully"
        echo "🌐 Server accessible at: http://localhost:$PORT"
        echo "📊 Health check: http://localhost:$PORT/health"
        echo "📋 Container logs: docker logs $CONTAINER_NAME"
    else
        echo "❌ Failed to start container"
        exit 1
    fi
else
    echo "❌ Docker build failed"
    exit 1
fi
