# Multi-stage Dockerfile for Express TypeScript server
FROM node:22 AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime stage
FROM node:22-slim AS runtime

# Set working directory
WORKDIR /app

# Copy built application and dependencies from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
