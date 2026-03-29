/**
 * Seed: Indian Holidays (2025-2027) + Mock Test Schedule (20 months)
 * Covers the full 20-month JEE preparation period
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

// ─── Indian Holidays 2025-2027 ────────────────────────────────────────────────
const holidays = [
  // 2025
  { holidayDate: "2025-01-26", name: "Republic Day", type: "national" },
  { holidayDate: "2025-03-14", name: "Holi", type: "festival" },
  { holidayDate: "2025-03-31", name: "Id-ul-Fitr (Eid)", type: "festival" },
  { holidayDate: "2025-04-14", name: "Dr. Ambedkar Jayanti", type: "national" },
  { holidayDate: "2025-04-18", name: "Good Friday", type: "national" },
  { holidayDate: "2025-05-12", name: "Buddha Purnima", type: "national" },
  { holidayDate: "2025-06-07", name: "Id-ul-Zuha (Bakrid)", type: "festival" },
  { holidayDate: "2025-07-06", name: "Muharram", type: "festival" },
  { holidayDate: "2025-08-15", name: "Independence Day", type: "national" },
  { holidayDate: "2025-08-16", name: "Janmashtami", type: "festival" },
  { holidayDate: "2025-09-05", name: "Milad-un-Nabi (Prophet's Birthday)", type: "festival" },
  { holidayDate: "2025-10-02", name: "Gandhi Jayanti / Dussehra", type: "national" },
  { holidayDate: "2025-10-20", name: "Diwali", type: "festival" },
  { holidayDate: "2025-10-21", name: "Diwali Holiday", type: "festival" },
  { holidayDate: "2025-10-22", name: "Govardhan Puja", type: "festival" },
  { holidayDate: "2025-11-05", name: "Guru Nanak Jayanti", type: "festival" },
  { holidayDate: "2025-12-25", name: "Christmas Day", type: "national" },
  // 2026
  { holidayDate: "2026-01-26", name: "Republic Day", type: "national" },
  { holidayDate: "2026-03-03", name: "Holi", type: "festival" },
  { holidayDate: "2026-03-20", name: "Id-ul-Fitr (Eid)", type: "festival" },
  { holidayDate: "2026-04-03", name: "Good Friday", type: "national" },
  { holidayDate: "2026-04-14", name: "Dr. Ambedkar Jayanti", type: "national" },
  { holidayDate: "2026-05-31", name: "Id-ul-Zuha (Bakrid)", type: "festival" },
  { holidayDate: "2026-08-15", name: "Independence Day", type: "national" },
  { holidayDate: "2026-08-05", name: "Janmashtami", type: "festival" },
  { holidayDate: "2026-09-21", name: "Dussehra", type: "festival" },
  { holidayDate: "2026-10-02", name: "Gandhi Jayanti", type: "national" },
  { holidayDate: "2026-11-08", name: "Diwali", type: "festival" },
  { holidayDate: "2026-11-09", name: "Diwali Holiday", type: "festival" },
  { holidayDate: "2026-11-24", name: "Guru Nanak Jayanti", type: "festival" },
  { holidayDate: "2026-12-25", name: "Christmas Day", type: "national" },
  // 2027
  { holidayDate: "2027-01-26", name: "Republic Day", type: "national" },
  { holidayDate: "2027-03-22", name: "Holi", type: "festival" },
  { holidayDate: "2027-04-02", name: "Good Friday", type: "national" },
  { holidayDate: "2027-04-14", name: "Dr. Ambedkar Jayanti", type: "national" },
  { holidayDate: "2027-08-15", name: "Independence Day", type: "national" },
  { holidayDate: "2027-10-02", name: "Gandhi Jayanti", type: "national" },
  { holidayDate: "2027-10-28", name: "Diwali", type: "festival" },
  { holidayDate: "2027-12-25", name: "Christmas Day", type: "national" },
  // JEE Exam periods (study off)
  { holidayDate: "2026-01-22", name: "JEE Main Session 1 - Day 1", type: "exam_related" },
  { holidayDate: "2026-01-23", name: "JEE Main Session 1 - Day 2", type: "exam_related" },
  { holidayDate: "2026-01-24", name: "JEE Main Session 1 - Day 3", type: "exam_related" },
  { holidayDate: "2026-04-05", name: "JEE Advanced", type: "exam_related" },
];

// ─── Mock Test Schedule (20 months) ──────────────────────────────────────────
// Monthly mock tests: JEE Main style (months 3,6,9,12,15,18,20)
// Weekly tests: every month
// JEE Advanced style: months 10,14,18,20
const mockTests = [];

// Weekly tests - one per month (Saturday of week 3)
for (let month = 1; month <= 20; month++) {
  mockTests.push({
    mockTestId: `weekly_test_m${month.toString().padStart(2,'0')}`,
    examId: "jee_main",
    title: `Month ${month} Weekly Test`,
    testType: "weekly_test",
    subjectId: null,
    monthNumber: month,
    durationMinutes: 60,
    totalMarks: 120,
    totalQuestions: 30,
    isPreGenerated: false,
    isActive: true,
    description: `Weekly assessment for Month ${month} — covers all chapters studied so far`,
    sectionConfig: JSON.stringify([
      { subjectId: "physics", questionCount: 10, marks: 40 },
      { subjectId: "chemistry", questionCount: 10, marks: 40 },
      { subjectId: "mathematics", questionCount: 10, marks: 40 },
    ]),
    questionIds: JSON.stringify([]),
  });
}

// JEE Main Full Mocks (months 4,7,10,13,16,19,20)
const mainMockMonths = [4, 7, 10, 13, 16, 19, 20];
mainMockMonths.forEach((month, i) => {
  mockTests.push({
    mockTestId: `jee_main_full_mock_${i + 1}`,
    examId: "jee_main",
    title: `JEE Main Full Mock Test ${i + 1}`,
    testType: "full_mock",
    subjectId: null,
    monthNumber: month,
    durationMinutes: 180,
    totalMarks: 300,
    totalQuestions: 90,
    isPreGenerated: false,
    isActive: true,
    description: `Full JEE Main pattern mock test — Month ${month}. 3 hours, 90 questions across Physics, Chemistry, Mathematics`,
    sectionConfig: JSON.stringify([
      { subjectId: "physics", questionCount: 30, marks: 100 },
      { subjectId: "chemistry", questionCount: 30, marks: 100 },
      { subjectId: "mathematics", questionCount: 30, marks: 100 },
    ]),
    questionIds: JSON.stringify([]),
  });
});

// JEE Advanced Full Mocks (months 12, 16, 20)
const advMockMonths = [12, 16, 20];
advMockMonths.forEach((month, i) => {
  mockTests.push({
    mockTestId: `jee_advanced_full_mock_${i + 1}`,
    examId: "jee_advanced",
    title: `JEE Advanced Full Mock Test ${i + 1}`,
    testType: "full_mock",
    subjectId: null,
    monthNumber: month,
    durationMinutes: 180,
    totalMarks: 360,
    totalQuestions: 54,
    isPreGenerated: false,
    isActive: true,
    description: `Full JEE Advanced pattern mock test — Month ${month}. Paper 1 style: 3 hours, 54 questions`,
    sectionConfig: JSON.stringify([
      { subjectId: "physics", questionCount: 18, marks: 120 },
      { subjectId: "chemistry", questionCount: 18, marks: 120 },
      { subjectId: "mathematics", questionCount: 18, marks: 120 },
    ]),
    questionIds: JSON.stringify([]),
  });
});

// Subject mocks (end of each subject completion)
const subjectMocks = [
  { id: "physics_subject_mock_1", subject: "physics", month: 6, title: "Physics Subject Mock — Class 11 Complete" },
  { id: "chemistry_subject_mock_1", subject: "chemistry", month: 7, title: "Chemistry Subject Mock — Class 11 Complete" },
  { id: "mathematics_subject_mock_1", subject: "mathematics", month: 8, title: "Mathematics Subject Mock — Class 11 Complete" },
  { id: "physics_subject_mock_2", subject: "physics", month: 15, title: "Physics Subject Mock — Full Syllabus" },
  { id: "chemistry_subject_mock_2", subject: "chemistry", month: 16, title: "Chemistry Subject Mock — Full Syllabus" },
  { id: "mathematics_subject_mock_2", subject: "mathematics", month: 17, title: "Mathematics Subject Mock — Full Syllabus" },
];

subjectMocks.forEach(sm => {
  mockTests.push({
    mockTestId: sm.id,
    examId: "jee_main",
    title: sm.title,
    testType: "subject_mock",
    subjectId: sm.subject,
    monthNumber: sm.month,
    durationMinutes: 60,
    totalMarks: 100,
    totalQuestions: 30,
    isPreGenerated: false,
    isActive: true,
    description: `Subject-level mock test for ${sm.subject} — Month ${sm.month}`,
    sectionConfig: JSON.stringify([
      { subjectId: sm.subject, questionCount: 30, marks: 100 },
    ]),
    questionIds: JSON.stringify([]),
  });
});

// ─── Insert holidays ──────────────────────────────────────────────────────────
console.log(`Seeding ${holidays.length} Indian holidays...`);
for (const h of holidays) {
  await db.execute(
    `INSERT IGNORE INTO indian_holidays (holidayDate, name, type, isStudyOff) VALUES (?, ?, ?, ?)`,
    [h.holidayDate, h.name, h.type, true]
  );
}
console.log(`✓ ${holidays.length} holidays seeded`);

// ─── Insert mock test schedule ────────────────────────────────────────────────
console.log(`Seeding ${mockTests.length} mock tests in schedule...`);
for (const mt of mockTests) {
  await db.execute(
    `INSERT IGNORE INTO mock_test_schedule 
     (mockTestId, examId, title, testType, subjectId, monthNumber, durationMinutes, totalMarks, totalQuestions, sectionConfig, questionIds, isPreGenerated, isActive, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [mt.mockTestId, mt.examId, mt.title, mt.testType, mt.subjectId, mt.monthNumber,
     mt.durationMinutes, mt.totalMarks, mt.totalQuestions, mt.sectionConfig, mt.questionIds,
     mt.isPreGenerated, mt.isActive, mt.description]
  );
}
console.log(`✓ ${mockTests.length} mock tests scheduled`);

await db.end();
console.log("\n✅ Holiday and mock test schedule seeding complete!");
console.log(`   - ${holidays.length} Indian holidays (2025-2027)`);
console.log(`   - 20 monthly weekly tests`);
console.log(`   - 7 JEE Main full mocks`);
console.log(`   - 3 JEE Advanced full mocks`);
console.log(`   - 6 subject-level mocks`);
