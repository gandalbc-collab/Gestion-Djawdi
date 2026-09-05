CREATE TABLE `contact_page` (
	`id` int AUTO_INCREMENT NOT NULL,
	`displayName` varchar(128) NOT NULL DEFAULT 'Cim Bailo',
	`fullName` varchar(256) NOT NULL DEFAULT 'Cissé Mamadou Bailo',
	`title` varchar(256) NOT NULL DEFAULT 'Coach en gestion financière',
	`bio` text,
	`photoUrl` varchar(512),
	`email` varchar(320) DEFAULT 'djawdi@gmail.com',
	`phone` varchar(64) DEFAULT '+1 267 206 44 17',
	`facebook` varchar(256) DEFAULT 'https://facebook.com/Cimbailo',
	`youtube` varchar(256),
	`tiktok` varchar(256),
	`appDescription` text,
	`howItWorks` text,
	`howToUse` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_page_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `learning_settings` ADD `allowLikes` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_settings` ADD `allowRatings` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_settings` ADD `allowComments` boolean DEFAULT true NOT NULL;