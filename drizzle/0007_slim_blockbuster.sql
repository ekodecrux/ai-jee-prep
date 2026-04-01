CREATE TABLE `fee_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feeRecordId` int NOT NULL,
	`instituteId` int NOT NULL,
	`studentId` int NOT NULL,
	`amountPaid` float NOT NULL,
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`paymentMode` varchar(64),
	`transactionRef` varchar(128),
	`recordedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fee_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instituteId` int NOT NULL,
	`studentId` int NOT NULL,
	`classId` int,
	`feeType` varchar(64) NOT NULL,
	`description` varchar(256),
	`amount` float NOT NULL,
	`dueDate` timestamp NOT NULL,
	`status` enum('pending','paid','overdue','waived') NOT NULL DEFAULT 'pending',
	`reminderSentAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fee_records_id` PRIMARY KEY(`id`)
);
