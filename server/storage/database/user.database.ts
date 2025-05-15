import { User, InsertUser, users } from "../../../shared/schema";
import { UserStorageInterface } from "../interfaces/user.interface";
import { db } from '../../db';
import { eq } from 'drizzle-orm';

export class UserDatabaseStorage implements UserStorageInterface {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.facebookId, facebookId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      isVerified: false,
      status: 'offline',
    }).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async generateAndSaveOTP(userId: number): Promise<string | undefined> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // OTP valid for 3 minutes
    const otpExpiresAt = new Date(Date.now() + 3 * 60 * 1000);

    const [user] = await db.update(users)
      .set({ otp, otpExpiresAt })
      .where(eq(users.id, userId))
      .returning();

    return user ? otp : undefined;
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.otp || !user.otpExpiresAt) return false;

    // Check if OTP is valid and not expired10
    if (user.otp === otp && new Date() < new Date(user.otpExpiresAt)) {
      // Mark user as verified and clear OTP
      await db.update(users)
        .set({ isVerified: true, otp: null, otpExpiresAt: null })
        .where(eq(users.id, userId));
      return true;
    }
    return false;
  }
}