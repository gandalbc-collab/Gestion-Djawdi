CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(128) NOT NULL,
	`message` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`sentBy` int NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(128) NOT NULL,
	`imageUrl` varchar(512),
	`linkUrl` varchar(512),
	`position` enum('dashboard_top','dashboard_bottom','sidebar','learn_page') NOT NULL DEFAULT 'dashboard_top',
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`clickCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isBlocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetRequestedAt` timestamp;