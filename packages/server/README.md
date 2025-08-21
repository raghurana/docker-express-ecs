# Express Server Package

This package contains the Express.js server implementation for the Docker Express TypeScript project.

## Features

- Express.js server with TypeScript
- Hot reloading with TSX during development
- ESBuild for production builds
- Environment variable configuration
- Health check endpoint
- Global error handling
- Request logging middleware

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server with hot reloading
npm run dev
```

The server will start on port 3000 (or the port specified in your `.env` file).

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env` file based on `env.sample`:

```bash
NODE_ENV=development
PORT=3000
```

## API Endpoints

- `GET /` - Welcome message and API info
- `GET /health` - Health check endpoint
- `GET /api/status` - Server status information

## Docker

### Build and Run

```bash
# Build and run with default settings
./docker-build.sh

# Or build manually
docker build -t express-server .

# Run with custom environment variables
docker run -d \
  --name express-server-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  express-server
```

### Environment Variable Substitution

The Docker container uses `envsubst` to substitute environment variables at runtime. You can pass environment variables when running the container:

```bash
docker run -d \
  --name express-server-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  express-server
```

## Scripts

- `npm run dev` - Start development server with TSX hot reloading
- `npm run build` - Build production bundle with ESBuild
- `npm start` - Start production server

## Development

The development server uses TSX for hot reloading and debugging support. The server will automatically restart when you make changes to the source code.

## Production

For production builds, the application is bundled using ESBuild into a single `dist/index.js` file. The Docker container runs this bundled version for optimal performance.
