# Docker Express TypeScript Workspace Project Tasks

## Project Setup Tasks

### 1. Initialize NPM Workspaces Project

- [ ] Create `package.json` with workspaces configuration
- [ ] Set up workspace structure with root and packages directories
- [ ] Configure root-level scripts and dependencies

### 2. Express Server Package Setup

- [ ] Create `packages/server` directory
- [ ] Initialize package.json for server package
- [ ] Install Express.js and TypeScript dependencies
- [ ] Configure TypeScript compiler options (`tsconfig.json`)
- [ ] Set up TSX for development with inspect and watch options. This will be executed with npm run dev command
- [ ] Use esbuild to build the project into a single index.js file file inside dist folder, make packages external
- [ ] Use .env.sample to have two variables NODE_ENV and PORT.
- [ ] Create a .env file based on .env.sample and gitignore it.

### 3. TypeScript Configuration

- [ ] Create root-level `tsconfig.json` for workspace
- [ ] Configure server-specific TypeScript settings
- [ ] Set up path mapping and module resolution
- [ ] Configure build output directory

### 4. Express Server Implementation

- [ ] Create basic Express server with TypeScript
- [ ] Set up middleware configuration
- [ ] Create basic route handlers
- [ ] Implement global error handling middleware
- [ ] Implement no route found middleware
- [ ] Add health check endpoint

### 5. Development Environment

- [ ] Configure TSX for hot reloading
- [ ] Set up nodemon configuration
- [ ] Create development scripts in package.json
- [ ] Configure environment variables

### 6. Docker Configuration

- [ ] Create multi-stage Dockerfile
  - [ ] First stage: Build stage with Node.js 22 slim
  - [ ] Second stage: Production stage with Node.js 22 slim
- [ ] Configure build context and dependencies
- [ ] Set up production environment
- [ ] Optimize Docker image size
- [ ] Dockerfile must be able to accept command line args that get written to a .env file inside the container using envsubst command.

### 7. Docker Build and Run

- [ ] Create Docker build script
- [ ] Configure Docker run commands
- [ ] Test Docker build process

### 8. Workspace Scripts

- [ ] Create root-level build scripts
- [ ] Set up cross-package dependency management
- [ ] Configure workspace-wide testing
- [ ] Add workspace cleanup scripts

### 9. Documentation

- [ ] Create README.md for root project
- [ ] Document server package usage
- [ ] Add Docker usage instructions
- [ ] Document development workflow

### 10. Testing and Validation

- [ ] Test workspace setup and package linking
- [ ] Verify TypeScript compilation
- [ ] Test Express server functionality
- [ ] Validate Docker build and run
- [ ] Test development hot reloading

## File Structure

```
docker-express-env/
├── package.json
├── tsconfig.json
├── packages/
│   └── server/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   └── middleware/
│       ├── Dockerfile
│       └── README.md
└── README.md
```

## Dependencies to Install

### Root Level

- TypeScript
- Workspace management tools

### Server Package

- Express.js
- TypeScript
- TSX (https://tsx.is/)
- esbuild
- @types/node
- @types/express

## Notes

- Use Node.js 22 slim image for both Docker stages
- Implement multi-stage Docker build for optimization
- Configure TSX for development with hot reloading
- Set up proper workspace package linking
