import { createConnection } from "mysql2/promise";

const sql = `
CREATE TABLE IF NOT EXISTS \`adaptive_study_plans\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`examId\` varchar(64),
  \`targetExamDate\` varchar(10),
  \`weekStart\` varchar(10) NOT NULL,
  \`generatedPlan\` json,
  \`weakChapters\` json,
  \`isActive\` boolean NOT NULL DEFAULT true,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`adaptive_study_plans_id\` PRIMARY KEY(\`id\`)
);

CREATE TABLE IF NOT EXISTS \`user_streaks\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`currentStreak\` int NOT NULL DEFAULT 0,
  \`longestStreak\` int NOT NULL DEFAULT 0,
  \`lastActivityDate\` varchar(10),
  \`totalActiveDays\` int NOT NULL DEFAULT 0,
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`user_streaks_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`user_streaks_userId_unique\` UNIQUE(\`userId\`)
);

CREATE TABLE IF NOT EXISTS \`user_xp_summary\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`totalXp\` int NOT NULL DEFAULT 0,
  \`weeklyXp\` int NOT NULL DEFAULT 0,
  \`level\` int NOT NULL DEFAULT 1,
  \`badges\` json,
  \`weekStartDate\` varchar(10),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`user_xp_summary_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`user_xp_summary_userId_unique\` UNIQUE(\`userId\`)
);

CREATE TABLE IF NOT EXISTS \`xp_ledger\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`action\` varchar(64) NOT NULL,
  \`xpEarned\` int NOT NULL,
  \`description\` varchar(256),
  \`metadata\` json,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`xp_ledger_id\` PRIMARY KEY(\`id\`)
);
`;

const conn = await createConnection(process.env.DATABASE_URL);
const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 10);
for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("✓", stmt.slice(0, 60).replace(/\n/g, " "));
  } catch (e) {
    console.error("✗", e.message.slice(0, 80));
  }
}
await conn.end();
console.log("Migration complete");
