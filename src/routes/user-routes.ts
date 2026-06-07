import { Elysia, t } from "elysia";
import { userService } from "../services/user-service";

const userResponseSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  email: t.String(),
  createdAt: t.Any(),
  updatedAt: t.Any(),
});

export const userRoutes = new Elysia({ prefix: "/api/users", detail: { tags: ["Users"] } })
  .get("/", async () => {
    const users = await userService.findAll();
    return {
      success: true,
      data: users,
    };
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Array(userResponseSchema),
      }),
    },
  })
  .get("/:id", async ({ params: { id }, set }) => {
    const user = await userService.findById(Number(id));
    if (!user) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }
    return {
      success: true,
      data: user,
    };
  }, {
    params: t.Object({
      id: t.Numeric(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: userResponseSchema,
      }),
      404: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  })
  .post("/", async ({ body, set }) => {
    try {
      const newUser = await userService.create(body);
      set.status = 201;
      return {
        success: true,
        message: "User created successfully",
        data: newUser,
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
    response: {
      201: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: userResponseSchema,
      }),
      409: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  })
  .put("/:id", async ({ params: { id }, body, set }) => {
    try {
      const updatedUser = await userService.update(Number(id), body);
      if (!updatedUser) {
        set.status = 404;
        return { success: false, message: "User not found" };
      }
      return {
        success: true,
        message: "User updated successfully",
        data: updatedUser,
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
    params: t.Object({
      id: t.Numeric(),
    }),
    body: t.Object({
      name: t.Optional(t.String({ 
        minLength: 1, 
        maxLength: 100, 
        error: "Nama tidak boleh kosong atau lebih dari 100 karakter" 
      })),
      email: t.Optional(t.String({ 
        format: "email", 
        maxLength: 100, 
        error: "Email tidak valid atau lebih dari 100 karakter" 
      })),
      password: t.Optional(t.String({ 
        minLength: 6, 
        maxLength: 100, 
        error: "Password harus berukuran 6-100 karakter" 
      })),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: userResponseSchema,
      }),
      404: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
      409: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  })
  .delete("/:id", async ({ params: { id }, set }) => {
    const success = await userService.delete(Number(id));
    if (!success) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }
    return {
      success: true,
      message: "User deleted successfully",
    };
  }, {
    params: t.Object({
      id: t.Numeric(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
      404: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  });
