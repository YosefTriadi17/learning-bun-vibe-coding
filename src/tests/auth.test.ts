import { describe, expect, it, beforeAll } from "bun:test";
import app from "../index";
import { db } from "../db/connection";
import { users, sessions } from "../db/schema";

describe("Elysia Auth REST API", () => {
  beforeAll(async () => {
    // Clean tables before testing
    await db.delete(sessions);
    await db.delete(users);
  });

  let sessionToken: string;

  it("should register a new user successfully", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Alice Smith",
            email: "alice@example.com",
            password: "password123",
          }),
        })
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.message).toBe("User registered successfully");
    expect(response.data).toBeDefined();
    expect(response.data.user.name).toBe("Alice Smith");
    expect(response.data.user.email).toBe("alice@example.com");
    expect(response.data.user.password).toBeUndefined();
    expect(response.data.token).toBeString();
    expect(response.data.expiredAt).toBeString();
  });

  it("should not register user with duplicate email", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Alice Clone",
            email: "alice@example.com",
            password: "newpassword123",
          }),
        })
      );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Email already registered");
  });

  it("should fail validation if password is too short on register", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Alice Short",
            email: "aliceshort@example.com",
            password: "123",
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation Error");
  });

  it("should fail validation if name exceeds 100 characters on register", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "a".repeat(101),
            email: "longname@example.com",
            password: "password123",
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation Error");
    expect(body.errors).toContain("Nama tidak boleh kosong atau lebih dari 100 karakter");
  });

  it("should fail validation if email exceeds 100 characters on register", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Alice Smith",
            email: "a".repeat(90) + "@example.com",
            password: "password123",
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation Error");
    expect(body.errors).toContain("Email tidak valid atau lebih dari 100 karakter");
  });

  it("should fail validation if password exceeds 100 characters on register", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Alice Smith",
            email: "longpwd@example.com",
            password: "a".repeat(101),
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation Error");
    expect(body.errors).toContain("Password harus berukuran 6-100 karakter");
  });

  it("should login successfully with correct credentials", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "alice@example.com",
            password: "password123",
          }),
        })
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.message).toBe("Login successful");
    expect(response.data.user.email).toBe("alice@example.com");
    expect(response.data.user.password).toBeUndefined();
    expect(response.data.token).toBeString();
    expect(response.data.expiredAt).toBeString();
    sessionToken = response.data.token;
  });

  it("should fail login with wrong password", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "alice@example.com",
            password: "wrongpassword",
          }),
        })
      );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid email or password");
  });

  it("should fail login with unregistered email", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "password123",
          }),
        })
      );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid email or password");
  });

  it("should retrieve current user details successfully with valid token", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/current-user", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.id).toBeDefined();
    expect(response.data.name).toBe("Alice Smith");
    expect(response.data.email).toBe("alice@example.com");
    expect(response.data.password).toBeUndefined();
  });

  it("should fail to retrieve current user if token is missing", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/current-user", {
          method: "POST",
        })
      );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Authorization token is required");
  });

  it("should fail to retrieve current user if token is invalid", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/current-user", {
          method: "POST",
          headers: {
            Authorization: "Bearer invalid-uuid-token",
          },
        })
      );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid or expired token");
  });

  it("should logout successfully with valid token", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.name).toBe("Alice Smith");
    expect(response.data.email).toBe("alice@example.com");
    expect(response.data.password).toBeUndefined();
  });

  it("should fail logout with invalid token", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: "Bearer invalid-uuid-token-123456",
          },
        })
      );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Invalid or expired token");
  });

  it("should fail logout without Authorization header", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/auth/logout", {
          method: "POST",
        })
      );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Authorization token is required");
  });
});
