import { InsertUser, User } from "../../../shared/schema";
import { UserStorageInterface } from "../interfaces/user.interface";

export class UserMemoryStorage implements UserStorageInterface {
  private users: Map<number, User>;
  private userId: number;

  constructor() {
    this.users = new Map();
    this.userId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.facebookId === facebookId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      fullName: insertUser.fullName ?? '',
      phoneNumber: insertUser.phoneNumber ?? '',
      googleId: insertUser.googleId ?? '',
      facebookId: insertUser.facebookId ?? '',
      isVerified: false,
      status: 'offline',
      createdAt: now,
      avatarUrl: null,
      otp: null,
      otpExpiresAt: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async generateAndSaveOTP(userId: number): Promise<string | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // OTP valid for 10 minutes
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const updatedUser = { ...user, otp, otpExpiresAt };
    this.users.set(userId, updatedUser);
    return otp;
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.otp || !user.otpExpiresAt) return false;

    // Check if OTP is valid and not expired
    if (user.otp === otp && new Date() < new Date(user.otpExpiresAt)) {
      // Mark user as verified and clear OTP
      const updatedUser = { ...user, isVerified: true, otp: null, otpExpiresAt: null };
      this.users.set(userId, updatedUser);
      return true;
    }
    return false;
  }
}