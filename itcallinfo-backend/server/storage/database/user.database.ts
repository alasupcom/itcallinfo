import { db } from "../../db";
import { users } from "../../../shared/schema";
import { eq, and, or } from "drizzle-orm";
import { User, InsertUser } from "../../../shared/schema";
import bcrypt from "bcrypt";

export class UserDatabaseStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.facebookId, facebookId)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    await db.insert(users).values(user);
    const newUser = await this.getUserByEmail(user.email);
    return newUser!;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    await db.update(users).set(data).where(eq(users.id, id));
    return this.getUser(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateAndSaveOTP(userId: number): Promise<string | undefined> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.updateUser(userId, { otp, otpExpiresAt });
    return otp;
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.otp || !user.otpExpiresAt) return false;

    if (user.otp !== otp || new Date() > user.otpExpiresAt) return false;

    await this.updateUser(userId, { otp: null, otpExpiresAt: null, isVerified: true });
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { status: "inactive" });
  }

  async activateUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { status: "active" });
  }
}