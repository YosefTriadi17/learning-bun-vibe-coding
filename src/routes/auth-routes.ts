import { Elysia, t } from "elysia";
import { authService } from "../services/auth-service";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post("/register", async ({ body, set }) => {
    try {
      const result = await authService.register(body);
      set.status = 201;
      return {
        success: true,
        message: "User registered successfully",
        data: result,
      };
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        set.status = 409;
        return {
          success: false,
          message: "Email already registered",
        };
      }
      throw err;
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      email: t.String({ format: "email", maxLength: 100 }),
      password: t.String({ minLength: 6, maxLength: 100 }),
    }),
  })
  .post("/login", async ({ body, set }) => {
    const result = await authService.login(body.email, body.password);
    if (!result) {
      set.status = 401;
      return {
        success: false,
        message: "Invalid email or password",
      };
    }
    return {
      success: true,
      message: "Login successful",
      data: result,
    };
  }, {
    body: t.Object({
      email: t.String({ format: "email", maxLength: 100 }),
      password: t.String({ minLength: 1, maxLength: 100 }),
    }),
  })
  .post("/logout", async ({ body, set }) => {
    const success = await authService.logout(body.token);
    if (!success) {
      set.status = 404;
      return {
        success: false,
        message: "Session not found or already expired",
      };
    }
    return {
      success: true,
      message: "Logout successful",
    };
  }, {
    body: t.Object({
      token: t.String({ minLength: 1 }),
    }),
  });
