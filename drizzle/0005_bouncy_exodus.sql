CREATE TABLE `assignment_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`studentId` int NOT NULL,
	`instituteId` int NOT NULL,
	`fileUrl` varchar(1024),
	`textContent` text,
	`grade` int,
	`feedback` text,
	`gradedBy` int,
	`gradedAt` timestamp,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignment_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int,
	`date` varchar(10) NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL,
	`markedBy` int NOT NULL,
	`remarks` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`instituteId` int,
	`action` varchar(128) NOT NULL,
	`targetType` varchar(64),
	`targetId` varchar(64),
	`details` json,
	`ipAddress` varchar(64),
	`userAgent` varchar(512),
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institute_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`classId` int NOT NULL,
	`subjectId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`dueDate` varchar(10),
	`maxMarks` int DEFAULT 100,
	`fileUrl` varchar(1024),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institute_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institute_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`code` varchar(32),
	`description` text,
	`colorHex` varchar(7) DEFAULT '#6366f1',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institute_subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_class_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`classId` int NOT NULL,
	`subjectId` int NOT NULL,
	`instituteId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_class_subjects_id` PRIMARY KEY(`id`)
);
