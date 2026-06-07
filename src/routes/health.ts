import { Elysia, t } from "elysia";
import { db } from "../db/connection";
import { sql } from "drizzle-orm";

export const healthRoutes = new Elysia({ prefix: "/api/health", detail: { tags: ["Health"] } })
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
  }, {
    response: {
      200: t.Object({
        status: t.String(),
        uptime: t.Number(),
        database: t.String(),
        timestamp: t.String(),
      }),
      503: t.Object({
        status: t.String(),
        database: t.String(),
        error: t.String(),
        timestamp: t.String(),
      }),
    },
  });
