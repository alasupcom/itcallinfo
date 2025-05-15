import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { InsertNotification, Notification, notifications } from '../../../shared/schema';
import { NotificationStorageInterface } from '../interfaces/notification.interface';

export class NotificationDatabaseStorage implements NotificationStorageInterface {
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      const { userId, type, status, content, recipient, sentAt } = notificationData;
      
      const insertedNotifications = await db.insert(notifications).values({
        userId,
        type,
        status,
        content,
        recipient,
        sentAt: sentAt || null,
      }).returning();

      if (!insertedNotifications || insertedNotifications.length === 0) {
        throw new Error('Failed to create notification');
      }

      const notification = insertedNotifications[0];
      
      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as 'email' | 'sms',
        status: notification.status as 'pending' | 'sent' | 'failed',
        content: notification.content,
        recipient: notification.recipient,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt
      };
    } catch (error) {
      console.error('Database error creating notification:', error);
      throw new Error('Failed to create notification in database');
    }
  }

  async getNotification(id: number): Promise<Notification | null> {
    try {
      const result = await db.select().from(notifications).where(eq(notifications.id, id));

      if (result.length === 0) {
        return null;
      }

      const notification = result[0];
      
      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as 'email' | 'sms',
        status: notification.status as 'pending' | 'sent' | 'failed',
        content: notification.content,
        recipient: notification.recipient,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt
      };
    } catch (error) {
      console.error('Database error getting notification:', error);
      throw new Error('Failed to get notification from database');
    }
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(notifications.createdAt);

      return result.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type as 'email' | 'sms',
        status: notification.status as 'pending' | 'sent' | 'failed',
        content: notification.content,
        recipient: notification.recipient,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt
      }));
    } catch (error) {
      console.error('Database error getting user notifications:', error);
      throw new Error('Failed to get user notifications from database');
    }
  }

  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification | null> {
    try {
      // Prepare update data
      const updateData: any = {};
      
      if (notificationData.status !== undefined) {
        updateData.status = notificationData.status;
      }
      if (notificationData.content !== undefined) {
        updateData.content = notificationData.content;
      }
      if (notificationData.recipient !== undefined) {
        updateData.recipient = notificationData.recipient;
      }
      if (notificationData.sentAt !== undefined) {
        updateData.sentAt = notificationData.sentAt;
      }

      // If no data to update
      if (Object.keys(updateData).length === 0) {
        return await this.getNotification(id);
      }

      const updatedNotifications = await db
        .update(notifications)
        .set(updateData)
        .where(eq(notifications.id, id))
        .returning();

      if (updatedNotifications.length === 0) {
        return null;
      }

      const notification = updatedNotifications[0];
      
      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as 'email' | 'sms',
        status: notification.status as 'pending' | 'sent' | 'failed',
        content: notification.content,
        recipient: notification.recipient,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt
      };
    } catch (error) {
      console.error('Database error updating notification:', error);
      throw new Error('Failed to update notification in database');
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const deletedNotifications = await db
        .delete(notifications)
        .where(eq(notifications.id, id))
        .returning({ id: notifications.id });
      
      return deletedNotifications.length > 0;
    } catch (error) {
      console.error('Database error deleting notification:', error);
      throw new Error('Failed to delete notification from database');
    }
  }
}