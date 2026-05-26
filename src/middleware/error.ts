import { Elysia } from "elysia";

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(({ code, error, set }) => {
    console.error(`[Error] Code: ${code} | Message:`, error.message);

    // Handle HTTP errors thrown by Elysia's error() helper
    const status = (error as any).status || (error as any).statusCode;
    if (typeof status === "number") {
      set.status = status;
      
      const body = (error as any).body;
      if (body) {
        return body;
      }
      
      return {
        success: false,
        message: error.message || "HTTP Error",
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        message: "Validation Error",
        errors: error.message,
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        message: error.message || "Resource not found",
      };
    }

    // Default database/server error
    set.status = 500;
    return {
      success: false,
      message: error.message || "Internal Server Error",
    };
  });

