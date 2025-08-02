import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { configureAuthentication } from "./middleware/auth";
import { registerRoutes } from "./routes/index";
import { log, serveStatic, setupVite } from "./vite";

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware setup
app.use(express.json());
configureAuthentication(app);
app.use(express.urlencoded({ extended: false }));

// Add helmet for security headers
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["*"],
//         scriptSrc: ["*", "'unsafe-inline'"],
//         styleSrc: ["*", "'unsafe-inline'"],
//         imgSrc: ["*"],
//         connectSrc: ["*"],
//         fontSrc: ["*"],
//         mediaSrc: ["*"],
//         frameSrc: ["*"],
//       },
//     },
//   })
// );

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === "development" 
    ? ["http://localhost:3000", "http://localhost:5000"] 
    : process.env.ALLOWED_ORIGINS?.split(",") || [],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Add 404 handler for API routes
  // app.use("/api/*", notFoundHandler);

  // Setup Vite for development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler - should be added after all routes
  // app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000');
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();