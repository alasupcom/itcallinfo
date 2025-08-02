import { IStorage } from '../interfaces';
import { NotificationMemoryStorage } from './notification.memory';
import { SipConfigMemoryStorage } from './sip-config.memory';
import { UserMemoryStorage } from './user.memory';
import { User, InsertUser } from '../../../shared/schema';

export class MemStorage implements IStorage {
  private userStorage = new UserMemoryStorage();
  private sipConfigStorage = new SipConfigMemoryStorage();
  private notificationStorage = new NotificationMemoryStorage();
  private users: Map<number, User>;
  private userId: number;

  constructor() {
    this.users = new Map();
    this.userId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userStorage.getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.userStorage.getUserByGoogleId(googleId);
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    return this.userStorage.getUserByFacebookId(facebookId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const newUser: User = { 
      id,
      username: user.username,
      email: user.email,
      password: user.password,
      createdAt: now,
      otp: null,
      otpExpiresAt: null,
      status: user.status || 'offline',
      role: user.role || null,
      isVerified: user.isVerified || false,
      avatarUrl: user.avatarUrl || null,
      fullName: user.fullName || null,
      phoneNumber: user.phoneNumber || null,
      googleId: user.googleId || null,
      facebookId: user.facebookId || null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      this.users.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateAndSaveOTP(userId: number): Promise<string | undefined> {
    return this.userStorage.generateAndSaveOTP(userId);
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    return this.userStorage.verifyOTP(userId, otp);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, status: 'inactive' };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async activateUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, status: 'active' };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // SIP Config methods
  async getSipConfig(userId: number): Promise<any | undefined> {
    return this.sipConfigStorage.getSipConfig(userId);
  }

  async getSipConfigById(id: number): Promise<any | undefined> {
    return this.sipConfigStorage.getSipConfigById(id);
  }

  async getAllSipConfigs(): Promise<any[]> {
    return this.sipConfigStorage.getAllSipConfigs();
  }

  async createSipConfig(config: any): Promise<any> {
    return this.sipConfigStorage.createSipConfig(config);
  }

  async updateSipConfig(id: number, data: any): Promise<any | undefined> {
    return this.sipConfigStorage.updateSipConfig(id, data);
  }

  async updateSipConfigByUserId(userId: number, data: any): Promise<any | undefined> {
    return this.sipConfigStorage.updateSipConfigByUserId(userId, data);
  }

  async deleteSipConfig(id: number): Promise<boolean> {
    return this.sipConfigStorage.deleteSipConfig(id);
  }

  async deleteSipConfigByUserId(userId: number): Promise<boolean> {
    return this.sipConfigStorage.deleteSipConfigByUserId(userId);
  }

  async assignSipConfigToUser(userId: number, sipConfigId: number): Promise<any> {
    return this.sipConfigStorage.assignSipConfigToUser(userId, sipConfigId);
  }

  async unassignSipConfigFromUser(userId: number): Promise<boolean> {
    return this.sipConfigStorage.unassignSipConfigFromUser(userId);
  }

  // Notification methods
  async createNotification(notification: any): Promise<any> {
    return this.notificationStorage.createNotification(notification);
  }

  async getNotification(id: number): Promise<any | undefined> {
    return this.notificationStorage.getNotification(id);
  }

  async getNotificationsByUser(userId: number): Promise<any[]> {
    return this.notificationStorage.getNotificationsByUser(userId);
  }

  async updateNotification(id: number, data: any): Promise<any | undefined> {
    return this.notificationStorage.updateNotification(id, data);
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notificationStorage.deleteNotification(id);
  }
}