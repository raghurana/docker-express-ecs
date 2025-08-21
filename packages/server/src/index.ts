import express, { Request, Response, NextFunction } from "express";

const app = express();
const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

// Basic route handlers
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to Docker Express TypeScript API",
    version: "1.0.0",
    environment: NODE_ENV,
  });
});

app.get("/api/status", (req: Request, res: Response) => {
  res.json({
    status: "running",
    environment: NODE_ENV,
    port: PORT,
  });
});

// No route found middleware
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  res.status(500).json({
    error: "Internal server error",
    message: NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
