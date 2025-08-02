import { mysqlTable, text, int, boolean, timestamp, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Model
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  status: text("status").default("offline"),
  role: text("role").default("user"), // "admin" or "user"
  createdAt: timestamp("created_at").defaultNow(),
  phoneNumber: text("phone_number"),
  isVerified: boolean("is_verified").default(false),
  otp: text("otp"),
  otpExpiresAt: timestamp("otp_expires_at"),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string(),
  email: z.string().email(),
  fullName: z.string().optional(),
  password: z.string(),
  phoneNumber: z.string().optional(),
  googleId: z.string().optional(),
  facebookId: z.string().optional(),
  avatarUrl: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  isVerified: z.boolean().optional(),
});

// SIP Configuration Relationship Model (links users to gateway SIP configs)
export const sipConfigs = mysqlTable("sip_configs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  sipConfigId: int("sip_config_id").notNull(), // ID from the SIP gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSipConfigSchema = createInsertSchema(sipConfigs, {
  userId: z.number(),
  sipConfigId: z.number(),
});

// Contacts Model
export const contacts = mysqlTable("contacts", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  sipAddress: text("sip_address"),
  avatarUrl: text("avatar_url"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts, {
  userId: z.number(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  sipAddress: z.string().optional(),
  avatarUrl: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

// Call History Model
export const callHistory = mysqlTable("call_history", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  contactId: int("contact_id").references(() => contacts.id),
  direction: text("direction").notNull(), // "incoming" or "outgoing"
  status: text("status").notNull(), // "answered", "missed", "rejected"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: int("duration"), // in seconds
  recordingUrl: text("recording_url"),
  notes: text("notes"),
});

export const insertCallHistorySchema = createInsertSchema(callHistory, {
  userId: z.number(),
  contactId: z.number().optional(),
  direction: z.string(),
  status: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  recordingUrl: z.string().optional(),
  notes: z.string().optional(),
});

// Conversations Model
export const conversations = mysqlTable("conversations", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  contactId: int("contact_id").references(() => contacts.id),
  senderId: int("sender_id").notNull().references(() => users.id),
  lastMessage: text("last_message"),
  lastMessageTime: timestamp("last_message_time"),
  unreadCount: int("unread_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Call Settings Model
export const callSettings = mysqlTable("call_settings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  doNotDisturb: boolean("do_not_disturb").default(false),
  allowCallWaiting: boolean("allow_call_waiting").default(true),
  forwardingNumber: text("forwarding_number"),
  forwardingEnabled: boolean("forwarding_enabled").default(false),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  calendarIntegration: boolean("calendar_integration").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar Events table
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  meetingId: int("meeting_id").references(() => meetings.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  attendees: json("attendees").default([]),
  calendarId: text("calendar_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "email", "sms"
  status: text("status").notNull(), // "pending", "sent", "failed"
  content: text("content").notNull(),
  recipient: text("recipient").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  userId: z.number(),
  type: z.string(),
  status: z.string(),
  content: z.string(),
  recipient: z.string(),
  sentAt: z.date().optional(),
});

// Blocked Numbers Model
export const blockedNumbers = mysqlTable("blocked_numbers", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  phoneNumber: text("phone_number").notNull(),
  sipAddress: text("sip_address"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCallSettingsSchema = createInsertSchema(callSettings, {
  userId: z.number(),
  doNotDisturb: z.boolean().optional(),
  allowCallWaiting: z.boolean().optional(),
  forwardingNumber: z.string().optional(),
  forwardingEnabled: z.boolean().optional(),
});

export const insertBlockedNumberSchema = createInsertSchema(blockedNumbers, {
  userId: z.number(),
  phoneNumber: z.string(),
  sipAddress: z.string().optional(),
  reason: z.string().optional(),
});

export const insertConversationSchema = createInsertSchema(conversations, {
  userId: z.number(),
  contactId: z.number().optional(),
  senderId: z.number(),
  lastMessage: z.string().optional(),
  lastMessageTime: z.date().optional(),
  unreadCount: z.number().optional(),
});

// Messages Model
// Message status enum
export const MessageStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
} as const;

// Extended message schema
export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversation_id").notNull().references(() => conversations.id),
  senderId: int("sender_id").notNull().references(() => users.id),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // "image", "video", "audio", "file", "contact", "voice"
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
  reactions: json("reactions").default([]),
  replyToId: int("reply_to_id"),
  status: text("status").notNull().default(MessageStatus.SENT),
  isTyping: boolean("is_typing").notNull().default(false),
  readAt: timestamp("read_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const insertMessageSchema = createInsertSchema(messages, {
  conversationId: z.number(),
  senderId: z.number(),
  content: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  isRead: z.boolean().optional(),
  status: z.string().optional(),
  isTyping: z.boolean().optional(),
  readAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});

// Message Reactions table
export const messageReactions = mysqlTable("message_reactions", {
  id: int("id").primaryKey().autoincrement(),
  messageId: int("message_id").notNull().references(() => messages.id),
  userId: int("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Group Chat table
export const groupChats = mysqlTable("group_chats", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  creatorId: int("creator_id").notNull().references(() => users.id),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Chat Members table
export const groupChatMembers = mysqlTable("group_chat_members", {
  id: int("id").primaryKey().autoincrement(),
  groupId: int("group_id").notNull().references(() => groupChats.id),
  userId: int("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // "admin" or "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Meetings Model
export const meetings = mysqlTable("meetings", {
  id: int("id").primaryKey().autoincrement(),
  creatorId: int("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").default("pending"), // "pending", "confirmed", "cancelled"
  meetingUrl: text("meeting_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings, {
  creatorId: z.number(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.string().optional(),
  meetingUrl: z.string().optional(),
});

// Meeting Participants Model
export const meetingParticipants = mysqlTable("meeting_participants", {
  id: int("id").primaryKey().autoincrement(),
  meetingId: int("meeting_id").notNull().references(() => meetings.id),
  userId: int("user_id").references(() => users.id),
  contactId: int("contact_id").references(() => contacts.id),
  status: text("status").default("invited"), // "invited", "confirmed", "declined"
  joinTime: timestamp("join_time"),
  leaveTime: timestamp("leave_time"),
});

export const insertMeetingParticipantSchema = createInsertSchema(meetingParticipants, {
  meetingId: z.number(),
  userId: z.number().optional(),
  contactId: z.number().optional(),
  status: z.string().optional(),
  joinTime: z.date().optional(),
  leaveTime: z.date().optional(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SipConfig = typeof sipConfigs.$inferSelect;
export type InsertSipConfig = z.infer<typeof insertSipConfigSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type CallHistory = typeof callHistory.$inferSelect;
export type InsertCallHistory = z.infer<typeof insertCallHistorySchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type MeetingParticipant = typeof meetingParticipants.$inferSelect;
export type InsertMeetingParticipant = z.infer<typeof insertMeetingParticipantSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;