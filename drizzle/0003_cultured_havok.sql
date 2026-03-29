CREATE TABLE `avatar_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chapterId` varchar(64),
	`sessionType` enum('lesson_narration','doubt_clarification','parent_report','welcome') NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`durationSeconds` int,
	`doubtsAsked` int DEFAULT 0,
	`sectionsCompleted` json,
	`voiceInputUsed` boolean NOT NULL DEFAULT false,
	`doubtsLog` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avatar_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `class_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` varchar(64) NOT NULL,
	`instituteId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`grade` enum('11','12','dropper','integrated') NOT NULL,
	`teacherId` int,
	`academicYear` varchar(16),
	`examFocus` varchar(64) DEFAULT 'jee_main',
	`maxStudents` int DEFAULT 60,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_classId_unique` UNIQUE(`classId`)
);
--> statement-breakpoint
CREATE TABLE `doubt_board` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`chapterId` varchar(64),
	`questionText` text NOT NULL,
	`questionImageUrl` varchar(512),
	`aiAnswer` text,
	`aiAnsweredAt` timestamp,
	`teacherAnswer` text,
	`teacherAnsweredBy` int,
	`teacherAnsweredAt` timestamp,
	`status` enum('open','ai_answered','teacher_answered','resolved') NOT NULL DEFAULT 'open',
	`upvotes` int DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doubt_board_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institute_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`instituteId` int NOT NULL,
	`role` enum('institute_admin','teacher','student','parent') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`invitedBy` int,
	`inviteToken` varchar(128),
	`inviteAcceptedAt` timestamp,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institute_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`shortName` varchar(64),
	`code` varchar(32),
	`logoUrl` varchar(512),
	`primaryColor` varchar(7),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`address` text,
	`city` varchar(128),
	`state` varchar(128),
	`country` varchar(64) DEFAULT 'India',
	`website` varchar(512),
	`subscriptionPlan` enum('trial','basic','standard','premium','enterprise') NOT NULL DEFAULT 'trial',
	`subscriptionExpiresAt` timestamp,
	`maxStudents` int DEFAULT 100,
	`maxTeachers` int DEFAULT 10,
	`enrollmentModel` enum('institute_led','self_enrolled','hybrid') NOT NULL DEFAULT 'self_enrolled',
	`onboardedBy` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutes_id` PRIMARY KEY(`id`),
	CONSTRAINT `institutes_instituteId_unique` UNIQUE(`instituteId`),
	CONSTRAINT `institutes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `institution_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` varchar(64) NOT NULL,
	`instituteId` int,
	`uploadedBy` int NOT NULL,
	`contentType` enum('mock_test','model_paper','chapter_dump','question_bank','lecture_notes','formula_sheet','previous_year_paper','reference_material') NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`fileUrl` varchar(1024),
	`fileKey` varchar(512),
	`fileType` varchar(32),
	`fileSizeBytes` int,
	`chapterId` varchar(64),
	`subjectId` varchar(64),
	`examId` varchar(64),
	`targetGrade` enum('11','12','both','dropper') DEFAULT 'both',
	`parsedStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`parsedAt` timestamp,
	`parsedData` json,
	`questionsExtracted` int DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT false,
	`isApproved` boolean NOT NULL DEFAULT false,
	`approvedBy` int,
	`approvedAt` timestamp,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institution_content_id` PRIMARY KEY(`id`),
	CONSTRAINT `institution_content_contentId_unique` UNIQUE(`contentId`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonReminders` boolean NOT NULL DEFAULT true,
	`mockTestAlerts` boolean NOT NULL DEFAULT true,
	`streakAlerts` boolean NOT NULL DEFAULT true,
	`weeklyDigest` boolean NOT NULL DEFAULT true,
	`parentReports` boolean NOT NULL DEFAULT true,
	`teacherMessages` boolean NOT NULL DEFAULT true,
	`achievementAlerts` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('lesson_overdue','mock_test_unlocked','mock_test_overdue','streak_at_risk','chapter_unlocked','assessment_reminder','weak_chapter_alert','plan_behind_alert','score_milestone','weekly_summary','admin_broadcast','teacher_message','parent_report','system') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`urgency` enum('info','warning','critical','success') NOT NULL DEFAULT 'info',
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedId` varchar(64),
	`relatedType` varchar(64),
	`actionUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parent_student_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentId` int NOT NULL,
	`studentId` int NOT NULL,
	`relationship` enum('father','mother','guardian','other') NOT NULL DEFAULT 'guardian',
	`isVerified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parent_student_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`instituteId` int,
	`enrollmentModel` enum('institute','standalone','parent_enrolled') NOT NULL DEFAULT 'standalone',
	`targetExam` varchar(64) DEFAULT 'jee_main',
	`targetYear` int,
	`currentGrade` enum('11','12','dropper') DEFAULT '11',
	`schoolName` varchar(256),
	`city` varchar(128),
	`state` varchar(128),
	`planStartDate` timestamp,
	`planEndDate` timestamp,
	`subscriptionPlan` enum('free','premium','institute') NOT NULL DEFAULT 'free',
	`subscriptionExpiresAt` timestamp,
	`avatarPreference` varchar(32) DEFAULT 'priya',
	`voicePreference` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `teacher_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`instituteId` int NOT NULL,
	`subjects` json,
	`qualification` varchar(256),
	`experienceYears` int,
	`bio` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_profiles_userId_unique` UNIQUE(`userId`)
);
