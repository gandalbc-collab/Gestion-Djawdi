CREATE TABLE `course_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`icon` varchar(8) NOT NULL DEFAULT '📚',
	`color` varchar(32) NOT NULL DEFAULT 'emerald',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`content` text NOT NULL,
	`isApproved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int,
	`title` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`excerpt` varchar(256),
	`content` text NOT NULL DEFAULT (''),
	`coverEmoji` varchar(8) NOT NULL DEFAULT '📖',
	`readingMinutes` int NOT NULL DEFAULT 5,
	`isPublished` boolean NOT NULL DEFAULT false,
	`allowLikes` boolean NOT NULL DEFAULT true,
	`allowRatings` boolean NOT NULL DEFAULT true,
	`allowComments` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `learning_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeChannelUrl` varchar(256),
	`showYoutubeButton` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_settings_id` PRIMARY KEY(`id`)
);
