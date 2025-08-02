CREATE TABLE `blocked_numbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`phone_number` text NOT NULL,
	`sip_address` text,
	`reason` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `blocked_numbers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`meeting_id` int,
	`title` text NOT NULL,
	`description` text,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`location` text,
	`attendees` json DEFAULT ('[]'),
	`calendar_id` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`contact_id` int,
	`direction` text NOT NULL,
	`status` text NOT NULL,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`duration` int,
	`recording_url` text,
	`notes` text,
	CONSTRAINT `call_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`do_not_disturb` boolean DEFAULT false,
	`allow_call_waiting` boolean DEFAULT true,
	`forwarding_number` text,
	`forwarding_enabled` boolean DEFAULT false,
	`email_notifications` boolean DEFAULT true,
	`sms_notifications` boolean DEFAULT false,
	`calendar_integration` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `call_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` text NOT NULL,
	`phone_number` text,
	`email` text,
	`sip_address` text,
	`avatar_url` text,
	`is_favorite` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`contact_id` int,
	`sender_id` int NOT NULL,
	`last_message` text,
	`last_message_time` timestamp,
	`unread_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_chat_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` text DEFAULT ('member'),
	`joined_at` timestamp DEFAULT (now()),
	CONSTRAINT `group_chat_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`creator_id` int NOT NULL,
	`avatar_url` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `group_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meeting_id` int NOT NULL,
	`user_id` int,
	`contact_id` int,
	`status` text DEFAULT ('invited'),
	`join_time` timestamp,
	`leave_time` timestamp,
	CONSTRAINT `meeting_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creator_id` int NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` timestamp NOT NULL,
	`end_time` timestamp,
	`status` text DEFAULT ('pending'),
	`meeting_url` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`user_id` int NOT NULL,
	`emoji` text NOT NULL,
	`timestamp` timestamp DEFAULT (now()),
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`content` text,
	`media_url` text,
	`media_type` text,
	`timestamp` timestamp DEFAULT (now()),
	`is_read` boolean DEFAULT false,
	`reactions` json DEFAULT ('[]'),
	`reply_to_id` int,
	`status` text NOT NULL DEFAULT ('sent'),
	`is_typing` boolean NOT NULL DEFAULT false,
	`read_at` timestamp,
	`delivered_at` timestamp,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`content` text NOT NULL,
	`recipient` text NOT NULL,
	`sent_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sip_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`domain` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`server` text NOT NULL,
	`port` int NOT NULL,
	`transport` text DEFAULT ('WSS'),
	`ice_servers` json NOT NULL DEFAULT ('[]'),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `sip_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`password` text NOT NULL,
	`avatar_url` text,
	`status` text DEFAULT ('offline'),
	`role` text DEFAULT ('user'),
	`created_at` timestamp DEFAULT (now()),
	`phone_number` text,
	`is_verified` boolean DEFAULT false,
	`otp` text,
	`otp_expires_at` timestamp,
	`google_id` text,
	`facebook_id` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blocked_numbers` ADD CONSTRAINT `blocked_numbers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_meeting_id_meetings_id_fk` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_history` ADD CONSTRAINT `call_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_history` ADD CONSTRAINT `call_history_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `call_settings` ADD CONSTRAINT `call_settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_chat_members` ADD CONSTRAINT `group_chat_members_group_id_group_chats_id_fk` FOREIGN KEY (`group_id`) REFERENCES `group_chats`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_chat_members` ADD CONSTRAINT `group_chat_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_chats` ADD CONSTRAINT `group_chats_creator_id_users_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_meeting_id_meetings_id_fk` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_participants` ADD CONSTRAINT `meeting_participants_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_creator_id_users_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sip_configs` ADD CONSTRAINT `sip_configs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;