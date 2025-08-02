import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "", 
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
  },
});
