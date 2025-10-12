import { Pool } from "pg";
import { DatabaseClient } from "../utils/postgres";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 5432,
  ssl: process.env.NODE_ENV == "development" ? false : {
    rejectUnauthorized: false,
  }
});

export const db = new DatabaseClient(pool);
