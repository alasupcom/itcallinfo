import { IStorage } from '../interfaces';
import { NotificationMemoryStorage } from './notification.memory';
import { SipConfigMemoryStorage } from './sip-config.memory';
import { UserMemoryStorage } from './user.memory';

export class MemStorage implements IStorage {
  private userStorage = new UserMemoryStorage();
  private sipConfigStorage = new SipConfigMemoryStorage();
  private notificationStorage = new NotificationMemoryStorage();

  // User
  get getUser() {
    return this.userStorage.getUser;
  }

  get getUserByUsername() {
    return this.userStorage.getUserByUsername;
  }

  get getUserByEmail() {
    return this.userStorage.getUserByEmail;
  }

  get getUserByGoogleId() {
    return this.userStorage.getUserByGoogleId;
  }

  get getUserByFacebookId() {
    return this.userStorage.getUserByFacebookId;
  }

  get createUser() {
    return this.userStorage.createUser;
  }

  get updateUser() {
    return this.userStorage.updateUser;
  }

  get generateAndSaveOTP() {
    return this.userStorage.generateAndSaveOTP;
  }

  get verifyOTP() {
    return this.userStorage.verifyOTP;
  }

  // SIP Config
  get getSipConfig() {
    return this.sipConfigStorage.getSipConfig;
  }

  get createSipConfig() {
    return this.sipConfigStorage.createSipConfig;
  }

  get updateSipConfig() {
    return this.sipConfigStorage.updateSipConfig;
  }

  // Notification
  get createNotification() {
    return this.notificationStorage.createNotification;
  }

  get getNotification() {
    return this.notificationStorage.getNotification;
  }

  get getNotificationsByUser() {
    return this.notificationStorage.getNotificationsByUser;
  }

  get updateNotification() {
    return this.notificationStorage.updateNotification;
  }

  get deleteNotification() {
    return this.notificationStorage.deleteNotification;
  }
}