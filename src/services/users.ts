import { db } from "../db/connection";
import { users, type User, type NewUser } from "../db/schema";
import { eq } from "drizzle-orm";

export class UserService {
  async findAll(): Promise<User[]> {
    return await db.select().from(users);
  }

  async findById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async create(user: NewUser): Promise<User> {
    const [result] = await db.insert(users).values(user);
    const insertedId = result.insertId;
    const [createdUser] = await db.select().from(users).where(eq(users.id, insertedId));
    return createdUser;
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    await db.update(users).set(data).where(eq(users.id, id));
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await db.delete(users).where(eq(users.id, id));
    return result.affectedRows > 0;
  }
}
export const userService = new UserService();
