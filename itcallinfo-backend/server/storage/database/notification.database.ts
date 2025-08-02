import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { InsertNotification, Notification, notifications } from '../../../shared/schema';
import { NotificationStorageInterface } from '../interfaces/notification.interface';

export class NotificationDatabaseStorage implements NotificationStorageInterface {
  async getNotification(id: number): Promise<Notification | null> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return result[0] || null;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    await db.insert(notifications).values(notification);
    const newNotification = await this.getNotification(notification.id || 0);
    return newNotification!;
  }

  async updateNotification(id: number, data: Partial<Notification>): Promise<Notification | null> {
    await db.update(notifications).set(data).where(eq(notifications.id, id));
    return this.getNotification(id);
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      await db.delete(notifications).where(eq(notifications.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }
}