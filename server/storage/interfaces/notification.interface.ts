import { InsertNotification, Notification } from "shared/schema";

  export interface NotificationStorageInterface {
    createNotification(notificationData: InsertNotification): Promise<Notification>;
    getNotification(id: number): Promise<Notification | null>;
    getNotificationsByUser(userId: number): Promise<Notification[]>;
    updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification | null>;
    deleteNotification(id: number): Promise<boolean>;
  }
