import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Configure postgres-js for serverless with connection pooling
// Use Supabase's connection pooler (pgbouncer) for production
const conn = globalForDb.conn ?? postgres(env.SUPABASE_DATABASE_URL, {
  prepare: false, // Disable prepared statements for pgbouncer compatibility
  max: 1, // Maximum 1 connection per serverless function instance
  idle_timeout: 20, // Close idle connections after 20s
  max_lifetime: 60 * 30, // Close connections after 30 minutes
});

if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
