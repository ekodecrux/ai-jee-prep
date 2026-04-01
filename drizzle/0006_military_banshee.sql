CREATE TABLE `bridge_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`studentId` int NOT NULL,
	`teacherId` int,
	`chapterId` varchar(64),
	`reason` text,
	`aiSuggestion` text,
	`weakTopics` json,
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`teacherNote` text,
	`approvedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bridge_courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`classId` int NOT NULL,
	`subjectId` int,
	`teacherId` int NOT NULL,
	`chapterId` varchar(64),
	`date` varchar(16) NOT NULL,
	`title` varchar(256) NOT NULL,
	`objectives` text,
	`activities` text,
	`resources` text,
	`homework` text,
	`estimatedMinutes` int DEFAULT 45,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `low_attendance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`studentId` int NOT NULL,
	`classId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`attendancePercent` float NOT NULL,
	`notifiedAdmin` boolean NOT NULL DEFAULT false,
	`notifiedParent` boolean NOT NULL DEFAULT false,
	`adminAlertSentAt` timestamp,
	`parentAlertSentAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `low_attendance_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `online_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`classId` int NOT NULL,
	`subjectId` int,
	`teacherId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`meetingUrl` varchar(1024),
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 60,
	`status` enum('scheduled','live','ended','cancelled') NOT NULL DEFAULT 'scheduled',
	`recordingUrl` varchar(1024),
	`webcamRequired` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `online_classes_id` PRIMARY KEY(`id`)
);
