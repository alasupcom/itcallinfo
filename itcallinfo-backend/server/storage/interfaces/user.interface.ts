import { User, InsertUser } from "../../../shared/schema.js";

export interface UserStorageInterface {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  generateAndSaveOTP(userId: number): Promise<string | undefined>;
  verifyOTP(userId: number, otp: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  deactivateUser(id: number): Promise<User | undefined>;
  activateUser(id: number): Promise<User | undefined>;
}