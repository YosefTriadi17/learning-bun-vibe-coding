import { db } from "../db/connection";
import { users, type User, type NewUser } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export type UserResponse = Omit<User, "password">;

/**
 * Menghapus field password dari objek user sebelum dikembalikan ke response
 */
function excludePassword(user: User): UserResponse {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export class UserService {
  /**
   * Mengambil semua data pengguna dari database
   */
  async findAll(): Promise<UserResponse[]> {
    const result = await db.select().from(users);
    return result.map(excludePassword);
  }

  /**
   * Mengambil data pengguna berdasarkan ID
   */
  async findById(id: number): Promise<UserResponse | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    if (!result[0]) return undefined;
    return excludePassword(result[0]);
  }

  /**
   * Membuat pengguna baru dengan melakukan hashing pada password
   */
  async create(user: NewUser): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    const [result] = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    });
    const insertedId = result.insertId;
    const [createdUser] = await db.select().from(users).where(eq(users.id, insertedId));
    return excludePassword(createdUser);
  }

  /**
   * Memperbarui data pengguna berdasarkan ID
   */
  async update(id: number, data: Partial<NewUser>): Promise<UserResponse | undefined> {
    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }
    await db.update(users).set(updateData).where(eq(users.id, id));
    return await this.findById(id);
  }

  /**
   * Menghapus data pengguna berdasarkan ID
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await db.delete(users).where(eq(users.id, id));
    return result.affectedRows > 0;
  }
}
export const userService = new UserService();
