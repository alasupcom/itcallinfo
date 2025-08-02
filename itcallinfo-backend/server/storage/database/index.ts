import { IStorage } from '../interfaces';
import { NotificationDatabaseStorage } from './notification.database';
import { SipConfigDatabaseStorage } from './sip-config.database';
import { UserDatabaseStorage } from './user.database';
import { User, InsertUser } from '../../../shared/schema';

export class DatabaseStorage implements IStorage {
  private userStorage: UserDatabaseStorage;
  private sipConfigStorage: SipConfigDatabaseStorage;
  private notificationStorage: NotificationDatabaseStorage;

  constructor() {
    this.userStorage = new UserDatabaseStorage();
    this.sipConfigStorage = new SipConfigDatabaseStorage();
    this.notificationStorage = new NotificationDatabaseStorage();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userStorage.getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userStorage.getUserByEmail(email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.userStorage.getUserByGoogleId(googleId);
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    return this.userStorage.getUserByFacebookId(facebookId);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.userStorage.createUser(user);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.userStorage.getUserById(id);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    return this.userStorage.updateUser(id, data);
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.userStorage.deleteUser(id);
  }

  async generateAndSaveOTP(userId: number): Promise<string | undefined> {
    return this.userStorage.generateAndSaveOTP(userId);
  }

  async verifyOTP(userId: number, otp: string): Promise<boolean> {
    return this.userStorage.verifyOTP(userId, otp);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userStorage.getAllUsers();
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    return this.userStorage.deactivateUser(id);
  }

  async activateUser(id: number): Promise<User | undefined> {
    return this.userStorage.activateUser(id);
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