import { InsertUser, User } from "../../../shared/schema";
import { UserStorageInterface } from "../interfaces/user.interface";
import bcrypt from 'bcrypt';

export class UserMemoryStorage implements UserStorageInterface {
  private users: Map<number, User>;
  private userId: number;

  constructor() {
    this.users = new Map();
    this.userId = 1;
  }
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
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

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const newUser: User = { 
      id, 
      username: user.username,
      email: user.email,
      password: user.password,
      status: user.status || 'offline',
      role: user.role || null,
      createdAt: now,
      isVerified: user.isVerified || false,
      fullName: user.fullName || null,
      avatarUrl: user.avatarUrl || null,
      phoneNumber: user.phoneNumber || null,
      otp: null,
      otpExpiresAt: null,
      googleId: user.googleId || null,
      facebookId: user.facebookId || null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async generateAndSaveOTP(userId: number): Promise<string | undefined> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.updateUser(userId, {
      otp,
      otpExpiresAt,
    });

    return otp;
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.otp || !user.otpExpiresAt) {
      return false;
    }

    if (user.otp !== otp) {
      return false;
    }

    if (new Date() > user.otpExpiresAt) {
      return false;
    }

    // Clear OTP after successful verification
    await this.updateUser(userId, {
      otp: null,
      otpExpiresAt: null,
    });

    return true;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    );
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    return await this.updateUser(id, { status: 'inactive' });
  }

  async activateUser(id: number): Promise<User | undefined> {
    return await this.updateUser(id, { status: 'active' });
  }
}