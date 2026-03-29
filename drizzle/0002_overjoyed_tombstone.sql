CREATE TABLE `chapter_heatmap` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`subjectId` varchar(64) NOT NULL,
	`heatmapScore` float NOT NULL DEFAULT 0,
	`colorBand` enum('red','amber','green','unstarted') NOT NULL DEFAULT 'unstarted',
	`assessmentAvgScore` float DEFAULT 0,
	`pastPaperAvgScore` float DEFAULT 0,
	`mockTestAvgScore` float DEFAULT 0,
	`attemptsCount` int DEFAULT 0,
	`previousColorBand` enum('red','amber','green','unstarted') DEFAULT 'unstarted',
	`trendDirection` enum('improving','stable','declining','new') DEFAULT 'new',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chapter_heatmap_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `indian_holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`holidayDate` varchar(10) NOT NULL,
	`name` varchar(256) NOT NULL,
	`type` enum('national','regional','festival','exam_related') NOT NULL,
	`isStudyOff` boolean NOT NULL DEFAULT true,
	`description` text,
	CONSTRAINT `indian_holidays_id` PRIMARY KEY(`id`),
	CONSTRAINT `indian_holidays_holidayDate_unique` UNIQUE(`holidayDate`)
);
--> statement-breakpoint
CREATE TABLE `jee_score_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`examId` varchar(64) NOT NULL,
	`predictedScore` float NOT NULL,
	`maxPossibleScore` float NOT NULL,
	`optimisticScore` float,
	`conservativeScore` float,
	`confidencePercent` float DEFAULT 50,
	`predictedRank` int,
	`predictedRankRange` json,
	`subjectScores` json,
	`weakChapters` json,
	`recommendations` json,
	`scoreHistory` json,
	`dataPointsUsed` int DEFAULT 0,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jee_score_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_plan_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planDate` varchar(10) NOT NULL,
	`monthNumber` int NOT NULL,
	`weekNumber` int NOT NULL,
	`dayOfWeek` enum('mon','tue','wed','thu','fri','sat','sun') NOT NULL,
	`isHoliday` boolean NOT NULL DEFAULT false,
	`holidayName` varchar(256),
	`chapterId` varchar(64),
	`subjectId` varchar(64),
	`sessionType` enum('lesson_30min','exam_15min','exam_60min','revision','holiday','mock_test'),
	`mockTestId` varchar(64),
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`isRescheduled` boolean NOT NULL DEFAULT false,
	`originalDate` varchar(10),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_plan_days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mock_test_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mockTestId` varchar(64) NOT NULL,
	`examId` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`testType` enum('subject_mock','full_mock','weekly_test') NOT NULL,
	`subjectId` varchar(64),
	`monthNumber` int,
	`scheduledUnlockDate` varchar(10),
	`durationMinutes` int DEFAULT 180,
	`totalMarks` int DEFAULT 300,
	`totalQuestions` int DEFAULT 90,
	`sectionConfig` json,
	`questionIds` json,
	`isPreGenerated` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mock_test_schedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `mock_test_schedule_mockTestId_unique` UNIQUE(`mockTestId`)
);
--> statement-breakpoint
CREATE TABLE `proctoring_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attemptId` int,
	`attemptType` enum('chapter_test','subject_mock','full_mock','weekly_test') NOT NULL,
	`eventType` enum('face_not_detected','multiple_faces','gaze_away','tab_switch','window_blur','fullscreen_exit','keyboard_shortcut','copy_attempt','paste_attempt','right_click','exam_started','exam_submitted','warning_issued','auto_submitted') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`durationSeconds` int,
	`metadata` json,
	`warningNumber` int,
	CONSTRAINT `proctoring_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proctoring_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attemptId` int NOT NULL,
	`attemptType` enum('chapter_test','subject_mock','full_mock','weekly_test') NOT NULL,
	`suspiciousScore` float NOT NULL DEFAULT 0,
	`totalEvents` int NOT NULL DEFAULT 0,
	`highSeverityEvents` int DEFAULT 0,
	`tabSwitches` int DEFAULT 0,
	`faceNotDetectedCount` int DEFAULT 0,
	`gazeAwayCount` int DEFAULT 0,
	`warningsIssued` int DEFAULT 0,
	`wasAutoSubmitted` boolean NOT NULL DEFAULT false,
	`reviewStatus` enum('pending','reviewed_clean','reviewed_flagged','invalidated') DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNotes` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proctoring_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tuition_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`subjectId` varchar(64) NOT NULL,
	`sessionType` enum('lesson_30min','exam_15min','exam_60min','practice','revision') NOT NULL,
	`scheduledDate` varchar(10),
	`scheduledTime` varchar(5),
	`durationMinutes` int,
	`completedAt` timestamp,
	`score` float,
	`maxScore` float,
	`percentage` float,
	`questionsAttempted` int DEFAULT 0,
	`questionsCorrect` int DEFAULT 0,
	`status` enum('scheduled','in_progress','completed','missed') DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tuition_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekStartDate` varchar(10) NOT NULL,
	`weekNumber` int NOT NULL,
	`year` int NOT NULL,
	`avgScore` float DEFAULT 0,
	`chaptersCompleted` int DEFAULT 0,
	`assessmentsTaken` int DEFAULT 0,
	`mockTestsTaken` int DEFAULT 0,
	`studyMinutes` int DEFAULT 0,
	`physicsAvg` float DEFAULT 0,
	`chemistryAvg` float DEFAULT 0,
	`mathematicsAvg` float DEFAULT 0,
	`greenChapters` int DEFAULT 0,
	`amberChapters` int DEFAULT 0,
	`redChapters` int DEFAULT 0,
	`predictedJeeMainScore` float,
	`predictedJeeAdvancedScore` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_performance_id` PRIMARY KEY(`id`)
);
