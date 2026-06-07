import { db } from "../db/connection";
import { users, sessions, type User, type NewUser } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const SALT_ROUNDS = 10;
const SESSION_DURATION_HOURS = 24;

export type AuthResponse = {
  user: Omit<User, "password">;
  token: string;
  expiredAt: Date;
};

function excludePassword(user: User): Omit<User, "password"> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export class AuthService {
  async register(data: NewUser): Promise<AuthResponse> {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const [result] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    const insertedId = result.insertId;
    const [createdUser] = await db.select().from(users).where(eq(users.id, insertedId));

    const token = randomUUID();
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + SESSION_DURATION_HOURS);

    await db.insert(sessions).values({
      token,
      userId: insertedId,
      expiredAt,
    });

    return {
      user: excludePassword(createdUser),
      token,
      expiredAt,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const token = randomUUID();
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + SESSION_DURATION_HOURS);

    await db.insert(sessions).values({
      token,
      userId: user.id,
      expiredAt,
    });

    return {
      user: excludePassword(user),
      token,
      expiredAt,
    };
  }

  async logout(token: string): Promise<Omit<User, "password"> | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));

    if (!session) return null;

    const now = new Date();
    if (session.expiredAt < now) {
      await db.delete(sessions).where(eq(sessions.token, token));
      return null;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) return null;

    await db.delete(sessions).where(eq(sessions.token, token));

    return excludePassword(user);
  }

  async getCurrentUser(token: string): Promise<Omit<User, "password"> | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));

    if (!session) return null;

    const now = new Date();
    if (session.expiredAt < now) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) return null;

    return excludePassword(user);
  }
}

export const authService = new AuthService();
