import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { errorHandler } from "./middleware/error";
import { userRoutes } from "./routes/users";

const port = Number(process.env.PORT || 3000);

const app = new Elysia()
  .use(swagger({
    path: "/swagger",
    documentation: {
      info: {
        title: "Bun + Elysia + Drizzle REST API",
        version: "1.0.0",
        description: "User Management REST API developed with Bun, ElysiaJS, Drizzle ORM, and MySQL.",
      },
    },
  }))
  .use(errorHandler)
  .use(userRoutes)
  .get("/", () => ({
    message: "Welcome to Bun + Elysia + Drizzle REST API! Visit /swagger for documentation.",
    docs: "/swagger",
  }))
  .listen(port);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`📖 API Documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`);

export type App = typeof app;
export default app;
