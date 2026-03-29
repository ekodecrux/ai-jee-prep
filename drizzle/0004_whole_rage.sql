CREATE TABLE `institute_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`brandColor` varchar(32) DEFAULT '#2563eb',
	`logoUrl` varchar(512),
	`customDomain` varchar(256),
	`maxStudents` int DEFAULT 500,
	`subscriptionPlan` enum('free','basic','pro','enterprise') NOT NULL DEFAULT 'free',
	`subscriptionExpiry` timestamp,
	`featuresEnabled` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institute_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `institute_settings_instituteId_unique` UNIQUE(`instituteId`)
);
--> statement-breakpoint
CREATE TABLE `invite_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(128) NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('institute_admin','teacher','student','parent') NOT NULL,
	`instituteId` int,
	`classId` int,
	`linkedStudentId` int,
	`invitedBy` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`isUsed` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `invite_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(64) NOT NULL,
	`step` enum('role_selected','profile_complete','institute_linked','class_assigned','ready') NOT NULL DEFAULT 'role_selected',
	`completedSteps` json,
	`instituteId` int,
	`inviteTokenId` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_progress_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `role_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(64) NOT NULL,
	`instituteId` int,
	`ipAddress` varchar(64),
	`userAgent` varchar(512),
	`loginAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`logoutAt` timestamp,
	CONSTRAINT `role_sessions_id` PRIMARY KEY(`id`)
);
