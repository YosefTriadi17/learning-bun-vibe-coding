import { describe, expect, it, beforeAll } from "bun:test";
import app from "../index";
import { db } from "../db/connection";
import { users } from "../db/schema";

describe("Elysia Users REST API", () => {
  beforeAll(async () => {
    // Clean table before testing
    await db.delete(users);
  });

  it("should get welcome message", async () => {
    const response = await app
      .handle(new Request("http://localhost/"))
      .then((res) => res.json());

    expect(response.message).toContain("Welcome to Bun");
  });

  it("should return empty list of users initially", async () => {
    const response = await app
      .handle(new Request("http://localhost/api/users"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data).toBeArray();
    expect(response.data).toHaveLength(0);
  });

  let createdUser: any;

  it("should create a new user", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
          }),
        })
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.message).toBe("User created successfully");
    expect(response.data).toBeDefined();
    expect(response.data.name).toBe("John Doe");
    expect(response.data.email).toBe("john@example.com");
    expect(response.data.password).toBeUndefined();
    createdUser = response.data;
  });

  it("should not create user with duplicate email", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Email already registered");
  });

  it("should fail validation if password is missing on create", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "No Password",
            email: "nopass@example.com",
          }),
        })
      );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation Error");
  });

  it("should fail validation if password is too short on create", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Short Password",
            email: "shortpass@example.com",
            password: "123",
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation Error");
  });

  it("should fail validation if email format is invalid on create", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Invalid Email",
            email: "notanemail",
            password: "password123",
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("Email tidak valid atau lebih dari 100 karakter");
  });

  it("should fail validation if fields exceed 100 characters on create", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "a".repeat(101),
            email: "valid@example.com",
            password: "password123",
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("Nama tidak boleh kosong atau lebih dari 100 karakter");
  });

  it("should get user by id", async () => {
    const response = await app
      .handle(new Request(`http://localhost/api/users/${createdUser.id}`))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data.id).toBe(createdUser.id);
    expect(response.data.name).toBe("John Doe");
    expect(response.data.password).toBeUndefined();
  });

  it("should update user", async () => {
    const response = await app
      .handle(
        new Request(`http://localhost/api/users/${createdUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Updated",
          }),
        })
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data.name).toBe("John Updated");
    expect(response.data.password).toBeUndefined();
  });

  it("should return 404 for updating non-existent user", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users/99999", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Does Not Exist",
          }),
        })
      );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("User not found");
  });

  it("should fail validation if update fields exceed 100 characters", async () => {
    const response = await app
      .handle(
        new Request(`http://localhost/api/users/${createdUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "a".repeat(101),
          }),
        })
      );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors).toContain("Nama tidak boleh kosong atau lebih dari 100 karakter");
  });

  it("should fail validation if updating email to an already registered one", async () => {
    // Let's create another user first
    const otherUserRes = await app
      .handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Second User",
            email: "second@example.com",
            password: "password123",
          }),
        })
      )
      .then((res) => res.json());

    const response = await app
      .handle(
        new Request(`http://localhost/api/users/${createdUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "second@example.com",
          }),
        })
      );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Email already registered");
  });

  it("should delete user", async () => {
    const response = await app
      .handle(
        new Request(`http://localhost/api/users/${createdUser.id}`, {
          method: "DELETE",
        })
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.message).toBe("User deleted successfully");
  });

  it("should return 404 for deleting non-existent user", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/api/users/99999", {
          method: "DELETE",
        })
      );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("User not found");
  });

  it("should return 404 for non-existent user get", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/99999")
    );
    expect(response.status).toBe(404);
  });

  it("should return healthy status for API health check", async () => {
    const response = await app
      .handle(new Request("http://localhost/api/health"))
      .then((res) => res.json());

    expect(response.status).toBe("healthy");
    expect(response.database).toBe("connected");
    expect(response.uptime).toBeNumber();
  });
});

