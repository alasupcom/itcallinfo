import { User, InsertUser } from "../../../shared/schema";

export interface UserStorageInterface {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  generateAndSaveOTP(userId: number): Promise<string | undefined>;
  verifyOTP(userId: number, otp: string): Promise<boolean>;
}