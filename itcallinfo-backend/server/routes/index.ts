import { Express } from "express";
import { createServer, Server } from "http";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import sipRoutes from "./sip.routes";
import adminRoutes from "./admin.routes";

/**
 * Register all application routes
 * @param app Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/sip", sipRoutes);
  app.use("/api/admin", adminRoutes);

  // Also register routes under /itcallinfo for proxy support
  app.use("/itcallinfo/api/auth", authRoutes);
  app.use("/itcallinfo/api/user", userRoutes);
  app.use("/itcallinfo/api/sip", sipRoutes);
  app.use("/itcallinfo/api/admin", adminRoutes);

  const httpServer = createServer(app);
  
  return httpServer;
}