import { InsertNotification, Notification } from '../../../shared/schema';
import { NotificationStorageInterface } from '../interfaces/notification.interface';

export class NotificationMemoryStorage implements NotificationStorageInterface {
  private notifications: Notification[] = [];
  private nextId = 1;

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const now = new Date();
    const notification: Notification = {
      id: this.nextId++,
      userId: notificationData.userId,
      type: notificationData.type,
      status: notificationData.status,
      content: notificationData.content,
      recipient: notificationData.recipient,
      sentAt: notificationData.sentAt || null,
      createdAt: now
    };

    this.notifications.push(notification);
    return { ...notification };
  }

  async getNotification(id: number): Promise<Notification | null> {
    const notification = this.notifications.find(n => n.id === id);
    return notification ? { ...notification } : null;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0))
      .map(notification => ({ ...notification }));
  }

  async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification | null> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return null;

    const notification = this.notifications[index];
    const updatedNotification: Notification = {
      ...notification,
      ...notificationData
    };

    this.notifications[index] = updatedNotification;
    return { ...updatedNotification };
  }

  async deleteNotification(id: number): Promise<boolean> {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    return initialLength > this.notifications.length;
  }}