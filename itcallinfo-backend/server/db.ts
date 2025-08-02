import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "../shared/schema";
import dotenv from 'dotenv';
dotenv.config();

// Use individual environment variables for database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
};

// Validate required configuration
if (!dbConfig.password || !dbConfig.user || !dbConfig.database) {
  throw new Error(
    "Database configuration is incomplete. Please check your environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME",
  );
}

export const pool = mysql.createPool(dbConfig);
export const db = drizzle(pool, { schema, mode: 'default' });