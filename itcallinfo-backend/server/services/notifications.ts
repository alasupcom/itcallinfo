import nodemailer from 'nodemailer';
import twilio from 'twilio';
import storage from '../storage';

interface EmailNotification {
  to: string;
  subject: string;
  content: string;
}

interface SMSNotification {
  to: string;
  content: string;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;

  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: notification.to,
        subject: notification.subject,
        html: notification.content,
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendSMS(notification: SMSNotification): Promise<boolean> {
    try {
      await this.twilioClient.messages.create({
        body: notification.content,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.to,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const notification: EmailNotification = {
      to: email,
      subject: 'Welcome to ITCallInfo',
      content: `
        <h1>Welcome to ITCallInfo!</h1>
        <p>Hello ${username},</p>
        <p>Thank you for registering with ITCallInfo. Your account has been successfully created.</p>
        <p>You can now log in and start using our VoIP services.</p>
        <p>Best regards,<br>The ITCallInfo Team</p>
      `,
    };

    return this.sendEmail(notification);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const notification: EmailNotification = {
      to: email,
      subject: 'Password Reset Request',
      content: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    return this.sendEmail(notification);
  }

  async sendSMSVerification(phoneNumber: string, code: string): Promise<boolean> {
    const notification: SMSNotification = {
      to: phoneNumber,
      content: `Your ITCallInfo verification code is: ${code}. This code will expire in 10 minutes.`,
    };

    return this.sendSMS(notification);
  }
}