import express, { type Application } from "express";
import { type Server } from "http";
import path from "path";

export const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

export const serveStatic = (app: Application) => {
  // Serve static files from the client build directory
  const clientBuildPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientBuildPath));
  
  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    }
  });
};

export const setupVite = async (app: Application, server: Server) => {
  // For development, we'll just log that Vite would be set up here
  // In a real implementation, this would integrate with Vite dev server
  log("Vite development server would be set up here");
  
  // For now, just serve static files even in development
  serveStatic(app);
}; 