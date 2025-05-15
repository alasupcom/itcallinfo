import { IStorage } from '../interfaces';
import { NotificationDatabaseStorage } from './notification.database';
import { SipConfigDatabaseStorage } from './sip-config.database';
import { UserDatabaseStorage } from './user.database';

export class DatabaseStorage implements IStorage {
  private userStorage: UserDatabaseStorage;
  private sipConfigStorage: SipConfigDatabaseStorage;
  private notificationStorage: NotificationDatabaseStorage;


  constructor() {
    this.userStorage = new UserDatabaseStorage();
    this.sipConfigStorage = new SipConfigDatabaseStorage();
    this. notificationStorage = new NotificationDatabaseStorage();
  }

  // Delegate methods to individual storage classes
  // UserStorageInterface methods
  get getUser() {
    return this.userStorage.getUser;
  }
  // getUser = this.userStorage.getUser;
  get getUserByUsername() {
    return this.userStorage.getUserByUsername;
  }
  get getUserByEmail() {
    return this.userStorage.getUserByEmail;
  };
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
  };
  get generateAndSaveOTP() {
    return this.userStorage.generateAndSaveOTP;
  };
  get verifyOTP() {
    return this.userStorage.verifyOTP;
  };

  //sip config
  get getSipConfig(){
    return this.sipConfigStorage.getSipConfig;
  }
  get createSipConfig(){
    return this.sipConfigStorage.createSipConfig;
  }
  get updateSipConfig(){
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