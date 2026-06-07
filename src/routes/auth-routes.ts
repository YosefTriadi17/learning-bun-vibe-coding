import { Elysia, t } from "elysia";
import { authService } from "../services/auth-service";

export const authRoutes = new Elysia({ prefix: "/api/auth", detail: { tags: ["Auth"] } })
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
      name: t.String({ 
        minLength: 1, 
        maxLength: 100, 
        error: "Nama tidak boleh kosong atau lebih dari 100 karakter" 
      }),
      email: t.String({ 
        format: "email", 
        maxLength: 100, 
        error: "Email tidak valid atau lebih dari 100 karakter" 
      }),
      password: t.String({ 
        minLength: 6, 
        maxLength: 100, 
        error: "Password harus berukuran 6-100 karakter" 
      }),
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
      email: t.String({ 
        format: "email", 
        maxLength: 100, 
        error: "Email tidak valid atau lebih dari 100 karakter" 
      }),
      password: t.String({ 
        minLength: 1, 
        maxLength: 100, 
        error: "Password tidak boleh kosong atau lebih dari 100 karakter" 
      }),
    }),
  })
  .group("", (app) =>
    app
      .derive(async ({ headers }) => {
        const authHeader = headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return {
            authError: "Authorization token is required",
            user: null,
            token: null,
          };
        }

        const token = authHeader.replace("Bearer ", "");
        const user = await authService.getCurrentUser(token);
        if (!user) {
          return {
            authError: "Invalid or expired token",
            user: null,
            token: null,
          };
        }

        return {
          authError: null,
          user,
          token,
        };
      })
      .onBeforeHandle(({ authError, set }) => {
        if (authError) {
          set.status = 401;
          return {
            success: false,
            message: authError,
          };
        }
      })
      .post("/logout", async ({ token }) => {
        const user = await authService.logout(token!);
        return {
          success: true,
          data: user!,
        };
      })
      .post("/current-user", async ({ user }) => {
        return {
          success: true,
          data: user!,
        };
      })
  );

