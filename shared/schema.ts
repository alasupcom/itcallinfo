import { pgTable, text, serial, integer, boolean, timestamp, jsonb, PgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  status: text("status").default("offline"),
  createdAt: timestamp("created_at").defaultNow(),
  phoneNumber: text("phone_number"),
  isVerified: boolean("is_verified").default(false),
  otp: text("otp"),
  otpExpiresAt: timestamp("otp_expires_at"),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    fullName: true,
    password: true,
    phoneNumber: true,
    googleId: true,
    facebookId: true,
    avatarUrl: true,
    status: true,
    isVerified: true,
  })
  .partial({
    fullName: true,
    phoneNumber: true,
    googleId: true,
    facebookId: true,
  });

// SIP Configuration Model
export const sipConfigs = pgTable("sip_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  server: text("server").notNull(),
  port: integer("port").notNull(),
  transport: text("transport").default("WSS"),
  iceServers: jsonb("ice_servers").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSipConfigSchema = createInsertSchema(sipConfigs).pick({
  userId: true,
  domain: true,
  username: true,
  password: true,
  server: true,
  port: true,
  transport: true,
  iceServers: true,
});

// Contacts Model
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  sipAddress: text("sip_address"),
  avatarUrl: text("avatar_url"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  userId: true,
  name: true,
  phoneNumber: true,
  email: true,
  sipAddress: true,
  avatarUrl: true,
  isFavorite: true,
});

// Call History Model
export const callHistory = pgTable("call_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  direction: text("direction").notNull(), // "incoming" or "outgoing"
  status: text("status").notNull(), // "answered", "missed", "rejected"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  recordingUrl: text("recording_url"),
  notes: text("notes"),
});

export const insertCallHistorySchema = createInsertSchema(callHistory).pick({
  userId: true,
  contactId: true,
  direction: true,
  status: true,
  startTime: true,
  endTime: true,
  duration: true,
  recordingUrl: true,
  notes: true,
});

// Conversations Model
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  lastMessage: text("last_message"),
  lastMessageTime: timestamp("last_message_time"),
  unreadCount: integer("unread_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Call Settings Model
export const callSettings = pgTable("call_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
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
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  meetingId: integer("meeting_id").references(() => meetings.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  attendees: jsonb("attendees").default([]),
  calendarId: text("calendar_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "email", "sms"
  status: text("status").notNull(), // "pending", "sent", "failed"
  content: text("content").notNull(),
  recipient: text("recipient").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  status: true,
  content: true,
  recipient: true,
  sentAt: true,
});

// Blocked Numbers Model
export const blockedNumbers = pgTable("blocked_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  phoneNumber: text("phone_number").notNull(),
  sipAddress: text("sip_address"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCallSettingsSchema = createInsertSchema(callSettings).pick({
  userId: true,
  doNotDisturb: true,
  allowCallWaiting: true,
  forwardingNumber: true,
  forwardingEnabled: true,
});

export const insertBlockedNumberSchema = createInsertSchema(blockedNumbers).pick({
  userId: true,
  phoneNumber: true,
  sipAddress: true,
  reason: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  contactId: true,
  senderId: true,
  lastMessage: true,
  lastMessageTime: true,
  unreadCount: true,
});

// Messages Model
// Message status enum
export const MessageStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
} as const;

// Extended message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // "image", "video", "audio", "file", "contact", "voice"
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
  reactions: jsonb("reactions").default([]),
  replyToId: integer("reply_to_id").references((): PgColumn => messages.id),
  status: text("status").notNull().default(MessageStatus.SENT),
  isTyping: boolean("is_typing").notNull().default(false),
  readAt: timestamp("read_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  senderId: true,
  content: true,
  mediaUrl: true,
  mediaType: true,
  isRead: true,
  status:true,
  isTyping:true,
  readAt:true,
  deliveredAt:true,
});

// Message Reactions table
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Group Chat table
export const groupChats = pgTable("group_chats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Chat Members table
export const groupChatMembers = pgTable("group_chat_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groupChats.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // "admin" or "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Meetings Model
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").default("pending"), // "pending", "confirmed", "cancelled"
  meetingUrl: text("meeting_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).pick({
  creatorId: true,
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  status: true,
  meetingUrl: true,
});

// Meeting Participants Model
export const meetingParticipants = pgTable("meeting_participants", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull().references(() => meetings.id),
  userId: integer("user_id").references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  status: text("status").default("invited"), // "invited", "confirmed", "declined"
  joinTime: timestamp("join_time"),
  leaveTime: timestamp("leave_time"),
});

export const insertMeetingParticipantSchema = createInsertSchema(meetingParticipants).pick({
  meetingId: true,
  userId: true,
  contactId: true,
  status: true,
  joinTime: true,
  leaveTime: true,
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