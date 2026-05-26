import { Elysia } from "elysia";
import { db } from "../db/connection";
import { sql } from "drizzle-orm";

export const healthRoutes = new Elysia({ prefix: "/api/health" })
  .get("/", async ({ set }) => {
    try {
      // Query database to ensure connection is healthy
      await db.execute(sql`SELECT 1`);
      
      return {
        status: "healthy",
        uptime: process.uptime(),
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      set.status = 503;
      return {
        status: "unhealthy",
        database: "disconnected",
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  });
