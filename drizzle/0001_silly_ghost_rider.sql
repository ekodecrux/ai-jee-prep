CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyName` varchar(128) NOT NULL,
	`keyHash` varchar(256) NOT NULL,
	`keyPrefix` varchar(16) NOT NULL,
	`scopes` json,
	`rateLimit` int DEFAULT 100,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `assessment_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` varchar(64) NOT NULL,
	`chapterId` varchar(64),
	`examId` varchar(64) NOT NULL,
	`attemptType` enum('practice','chapter_test','subject_mock','full_mock') NOT NULL,
	`answers` json NOT NULL,
	`score` float NOT NULL,
	`maxScore` float NOT NULL,
	`percentage` float NOT NULL,
	`timeTakenSeconds` int,
	`passed` boolean NOT NULL DEFAULT false,
	`questionResults` json,
	`weakTopics` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `assessment_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` varchar(64) NOT NULL,
	`chapterId` varchar(64),
	`examId` varchar(64) NOT NULL,
	`subjectId` varchar(64),
	`title` varchar(256) NOT NULL,
	`description` text,
	`assessmentType` enum('practice','chapter_test','subject_mock','full_mock') NOT NULL,
	`durationMinutes` int DEFAULT 30,
	`totalMarks` int DEFAULT 100,
	`passingScore` int DEFAULT 60,
	`maxDailyAttempts` int DEFAULT 3,
	`questionIds` json NOT NULL,
	`instructions` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessments_assessmentId_unique` UNIQUE(`assessmentId`)
);
--> statement-breakpoint
CREATE TABLE `chapter_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`subjectId` varchar(64) NOT NULL,
	`curriculumId` varchar(64) NOT NULL,
	`status` enum('locked','unlocked','in_progress','completed') NOT NULL DEFAULT 'locked',
	`narrationRead` boolean NOT NULL DEFAULT false,
	`narrationReadAt` timestamp,
	`bestScore` float DEFAULT 0,
	`totalAttempts` int DEFAULT 0,
	`lastAttemptAt` timestamp,
	`completedAt` timestamp,
	`timeSpentMinutes` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapter_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`subjectId` varchar(64) NOT NULL,
	`curriculumId` varchar(64) NOT NULL,
	`chapterNo` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`slug` varchar(256),
	`ncertChapterRef` varchar(64),
	`prerequisites` json,
	`keyTopics` json,
	`learningObjectives` json,
	`difficultyLevel` enum('foundation','intermediate','advanced') DEFAULT 'intermediate',
	`estimatedStudyHours` float,
	`tags` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapters_chapterId_unique` UNIQUE(`chapterId`)
);
--> statement-breakpoint
CREATE TABLE `curricula` (
	`id` int AUTO_INCREMENT NOT NULL,
	`curriculumId` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`board` varchar(128),
	`gradeLevel` varchar(64),
	`gradeLevelNum` int,
	`country` varchar(64) DEFAULT 'India',
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `curricula_id` PRIMARY KEY(`id`),
	CONSTRAINT `curricula_curriculumId_unique` UNIQUE(`curriculumId`)
);
--> statement-breakpoint
CREATE TABLE `daily_attempt_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` varchar(64) NOT NULL,
	`attemptDate` varchar(10) NOT NULL,
	`attemptsUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_attempt_limits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_chapter_weightage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examId` varchar(64) NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`weightagePercent` varchar(16),
	`avgQuestionsPerYear` float,
	`importanceLevel` enum('low','medium','high','critical') DEFAULT 'medium',
	`notes` text,
	CONSTRAINT `exam_chapter_weightage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examId` varchar(64) NOT NULL,
	`subjectId` varchar(64) NOT NULL,
	`totalChapters` int DEFAULT 0,
	`weightagePercent` float,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `exam_subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examId` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`fullName` varchar(512),
	`category` enum('engineering','medical','civil_services','academic','other') NOT NULL,
	`conductingBody` varchar(256),
	`country` varchar(64) DEFAULT 'India',
	`description` text,
	`officialUrl` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`),
	CONSTRAINT `exams_examId_unique` UNIQUE(`examId`)
);
--> statement-breakpoint
CREATE TABLE `mock_test_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mockTestId` varchar(64) NOT NULL,
	`answers` json,
	`score` float,
	`maxScore` float,
	`percentage` float,
	`rank` int,
	`timeTakenSeconds` int,
	`sectionScores` json,
	`questionResults` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`status` enum('in_progress','completed','abandoned') DEFAULT 'in_progress',
	CONSTRAINT `mock_test_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mock_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mockTestId` varchar(64) NOT NULL,
	`examId` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`testType` enum('subject_mock','full_mock') NOT NULL,
	`subjectId` varchar(64),
	`durationMinutes` int DEFAULT 180,
	`totalMarks` int DEFAULT 300,
	`questionIds` json NOT NULL,
	`sectionConfig` json,
	`unlockRequirement` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mock_tests_id` PRIMARY KEY(`id`),
	CONSTRAINT `mock_tests_mockTestId_unique` UNIQUE(`mockTestId`)
);
--> statement-breakpoint
CREATE TABLE `narration_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`introduction` text,
	`conceptualExplanation` text,
	`formulasAndDerivations` text,
	`solvedExamples` text,
	`advancedConcepts` text,
	`examSpecificTips` text,
	`commonMistakes` text,
	`quickRevisionSummary` text,
	`mnemonics` text,
	`wordCount` int DEFAULT 0,
	`language` varchar(16) DEFAULT 'en',
	`generatedBy` varchar(64) DEFAULT 'llm',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `narration_scripts_id` PRIMARY KEY(`id`),
	CONSTRAINT `narration_scripts_chapterId_unique` UNIQUE(`chapterId`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` varchar(64) NOT NULL,
	`subjectId` varchar(64) NOT NULL,
	`examId` varchar(64) NOT NULL,
	`questionType` enum('mcq','nat','integer','multi_correct','subjective','assertion_reason') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`source` enum('official_exam','practice','ai_generated') NOT NULL,
	`year` int,
	`paperCode` varchar(32),
	`questionText` text NOT NULL,
	`questionHtml` text,
	`options` json,
	`correctAnswer` varchar(256) NOT NULL,
	`correctOptions` json,
	`numericalAnswer` float,
	`answerRange` json,
	`solution` text NOT NULL,
	`solutionHtml` text,
	`conceptTested` varchar(256),
	`topicTags` json,
	`marks` int DEFAULT 4,
	`negativeMarks` float DEFAULT 1,
	`isVerified` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`shortName` varchar(32),
	`iconName` varchar(64),
	`colorHex` varchar(7),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_subjectId_unique` UNIQUE(`subjectId`)
);
