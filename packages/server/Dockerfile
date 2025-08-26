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

# Copy .env.sample and generate .env if it doesn't exist
RUN mv .env.sample .env


# Build the application
RUN npm run build

# Runtime stage
FROM node:22-slim AS runtime

# Set working directory
WORKDIR /app

# Copy built application and dependencies from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.env ./.env

# Exposed port from copied .env file
EXPOSE 5000

# Check the contents of the container
RUN ls -la
RUN ls -la dist
RUN cat .env

# Start the application
CMD ["node", "--env-file=.env", "dist/index"]
