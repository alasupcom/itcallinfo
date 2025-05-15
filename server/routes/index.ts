import { Express } from "express";
import { createServer, Server } from "http";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

/**
 * Register all application routes
 * @param app Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);

  const httpServer = createServer(app);
  
  return httpServer;
}