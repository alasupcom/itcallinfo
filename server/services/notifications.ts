import nodemailer from 'nodemailer';
import twilio from 'twilio';
import storage from '../storage';

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Configure Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class NotificationService {
  static async sendEmail(userId: number, subject: string, content: string) {
    try {
      // First create a pending notification
      const pendingNotification = await storage.createNotification({
        userId,
        type: 'email',
        status: 'pending',
        content,
        recipient: '', // Will be filled after getting user
      });

      const user = await storage.getUser(userId);
      if (!user?.email) {
        await storage.updateNotification(pendingNotification.id, {
          status: 'failed',
          recipient: 'unknown', 
        });
        throw new Error('User email not found');
      }

      // Update recipient now that we have the email
      await storage.updateNotification(pendingNotification.id, {
        recipient: user.email
      });

      const info = await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject,
        html: content,
      });

      // Update notification as sent
      await storage.updateNotification(pendingNotification.id, {
        status: 'sent',
        sentAt: new Date(),
      });

      return info;
    } catch (error) {
      console.error('Email notification error:', error);
      throw error;
    }
  }

  static async sendSMS(userId: number, content: string) {
    try {
      // First create a pending notification
      const pendingNotification = await storage.createNotification({
        userId,
        type: 'sms',
        status: 'pending',
        content,
        recipient: '', // Will be filled after getting user
      });

      const user = await storage.getUser(userId);
      if (!user?.phoneNumber) {
        await storage.updateNotification(pendingNotification.id, {
          status: 'failed',
          recipient: 'unknown', 
        });
        throw new Error('User phone number not found');
      }

      // Update recipient now that we have the phone number
      await storage.updateNotification(pendingNotification.id, {
        recipient: user.phoneNumber
      });

      const message = await twilioClient.messages.create({
        body: content,
        to: user.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      // Update notification as sent
      await storage.updateNotification(pendingNotification.id, {
        status: 'sent',
        sentAt: new Date(),
      });

      return message;
    } catch (error) {
      console.error('SMS notification error:', error);
      throw error;
    }
  }
}