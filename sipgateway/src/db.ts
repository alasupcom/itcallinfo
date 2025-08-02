import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// export const db = drizzle(connectionString, { schema, mode: 'default' });

const pool = mysql.createPool(connectionString);
export const db = drizzle(pool, { schema, mode: 'default' });
