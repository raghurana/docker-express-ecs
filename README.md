# Docker Express TypeScript Workspace

A modern Express.js TypeScript project with Docker support, built using NPM workspaces for scalable development.

## 🚀 Features

- **NPM Workspaces** - Monorepo structure for scalable development
- **Express.js Server** - TypeScript-based API server with hot reloading
- **Docker Support** - Multi-stage builds with environment variable substitution
- **Modern Tooling** - TSX for development, ESBuild for production
- **TypeScript** - Full type safety and modern JavaScript features

## 📁 Project Structure

```
docker-express-env/
├── package.json              # Root workspace configuration
├── tsconfig.json            # Root TypeScript configuration
├── packages/
│   └── server/              # Express server package
│       ├── package.json     # Server dependencies and scripts
│       ├── tsconfig.json    # Server TypeScript config
│       ├── src/             # Source code
│       ├── Dockerfile       # Multi-stage Docker build
│       ├── docker-build.sh  # Docker build and run script
│       └── README.md        # Server package documentation
└── README.md                # This file
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 22 or higher
- Docker (for containerized deployment)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd docker-express-env
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cd packages/server
   cp env.sample .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on port 3000 with hot reloading enabled.

## 🐳 Docker Usage

### Quick Docker Build and Run

```bash
cd packages/server
./docker-build.sh
```

### Manual Docker Commands

```bash
# Build the image
docker build -t express-server .

# Run with custom environment
docker run -d \
  --name express-server-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  express-server
```

### Environment Variable Substitution

The Docker container automatically substitutes environment variables at runtime using `envsubst`. Pass environment variables when running the container:

```bash
docker run -d \
  --name express-server-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  express-server
```

## 📚 Available Scripts

### Root Level

- `npm run build` - Build all packages
- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run clean` - Clean all build artifacts

### Server Package

- `npm run dev` - Start development server with TSX
- `npm run build` - Build production bundle with ESBuild
- `npm start` - Start production server

## 🔧 Development

### Hot Reloading

The development server uses TSX for automatic restarting when files change. Just save your files and the server will restart automatically.

### TypeScript Configuration

- Root `tsconfig.json` provides base configuration
- Package-specific configs extend the root configuration
- ESBuild handles production builds with external dependencies

### Workspace Management

```bash
# Install dependencies in a specific package
npm install express --workspace=server

# Run scripts in a specific package
npm run dev --workspace=server

# Build all packages
npm run build
```

## 🧪 Testing

```bash
# Run tests in all packages
npm test

# Run tests in specific package
npm test --workspace=server
```

## 📦 Production Build

```bash
# Build all packages
npm run build

# Start production server
npm start
```

The production build creates optimized bundles in the `dist/` directory of each package.

## 🌍 Environment Variables

| Variable   | Default       | Description             |
| ---------- | ------------- | ----------------------- |
| `NODE_ENV` | `development` | Application environment |
| `PORT`     | `3000`        | Server port             |

## 📖 API Documentation

### Endpoints

- `GET /` - Welcome message and API info
- `GET /health` - Health check endpoint
- `GET /api/status` - Server status information

### Health Check

The health check endpoint (`/health`) returns:

- Server status
- Current timestamp
- Environment information
- Uptime statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information
