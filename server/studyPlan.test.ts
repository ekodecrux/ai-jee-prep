/**
 * Study Plan router unit tests
 * Tests plan structure validation, week allocation, and subject coverage.
 */
import { describe, it, expect } from "vitest";

// ─── Plan structure helpers ───────────────────────────────────────────────────

interface WeekPlan {
  week: number;
  subject: string;
  topics: string[];
  hoursPerDay: number;
  focusType: "new" | "revision" | "mock";
}

interface StudyPlan {
  examId: string;
  targetDate: string;
  totalWeeks: number;
  weeklyPlans: WeekPlan[];
  weakChapters: string[];
}

function validatePlan(plan: StudyPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!plan.examId) errors.push("examId is required");
  if (!plan.targetDate) errors.push("targetDate is required");
  if (plan.totalWeeks < 1) errors.push("totalWeeks must be >= 1");
  if (plan.weeklyPlans.length === 0) errors.push("weeklyPlans must not be empty");
  if (plan.weeklyPlans.length > plan.totalWeeks) errors.push("weeklyPlans cannot exceed totalWeeks");
  plan.weeklyPlans.forEach((w, i) => {
    if (w.hoursPerDay < 1 || w.hoursPerDay > 12) {
      errors.push(`Week ${i + 1}: hoursPerDay must be between 1 and 12`);
    }
    if (!["new", "revision", "mock"].includes(w.focusType)) {
      errors.push(`Week ${i + 1}: invalid focusType`);
    }
  });
  return { valid: errors.length === 0, errors };
}

describe("Study Plan — Validation", () => {
  const validPlan: StudyPlan = {
    examId: "jee_main",
    targetDate: "2025-05-15",
    totalWeeks: 12,
    weeklyPlans: [
      { week: 1, subject: "Physics", topics: ["Kinematics"], hoursPerDay: 6, focusType: "new" },
      { week: 2, subject: "Chemistry", topics: ["Mole Concept"], hoursPerDay: 5, focusType: "new" },
      { week: 12, subject: "All", topics: ["Full Syllabus"], hoursPerDay: 8, focusType: "mock" },
    ],
    weakChapters: ["Organic Chemistry", "Calculus"],
  };

  it("validates a correct plan", () => {
    const result = validatePlan(validPlan);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects plan with missing examId", () => {
    const bad = { ...validPlan, examId: "" };
    const result = validatePlan(bad);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("examId is required");
  });

  it("rejects plan with 0 totalWeeks", () => {
    const bad = { ...validPlan, totalWeeks: 0 };
    const result = validatePlan(bad);
    expect(result.valid).toBe(false);
  });

  it("rejects plan with hoursPerDay > 12", () => {
    const bad = {
      ...validPlan,
      weeklyPlans: [{ week: 1, subject: "Physics", topics: [], hoursPerDay: 15, focusType: "new" as const }],
    };
    const result = validatePlan(bad);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("hoursPerDay");
  });

  it("rejects plan with invalid focusType", () => {
    const bad = {
      ...validPlan,
      weeklyPlans: [{ week: 1, subject: "Physics", topics: [], hoursPerDay: 6, focusType: "study" as any }],
    };
    const result = validatePlan(bad);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("focusType");
  });
});

// ─── Subject coverage check ───────────────────────────────────────────────────

function getSubjectCoverage(weeklyPlans: WeekPlan[]): Record<string, number> {
  const coverage: Record<string, number> = {};
  weeklyPlans.forEach(w => {
    if (w.subject !== "All") {
      coverage[w.subject] = (coverage[w.subject] || 0) + 1;
    }
  });
  return coverage;
}

describe("Study Plan — Subject coverage", () => {
  const plans: WeekPlan[] = [
    { week: 1, subject: "Physics", topics: ["Kinematics"], hoursPerDay: 6, focusType: "new" },
    { week: 2, subject: "Chemistry", topics: ["Mole Concept"], hoursPerDay: 5, focusType: "new" },
    { week: 3, subject: "Mathematics", topics: ["Calculus"], hoursPerDay: 6, focusType: "new" },
    { week: 4, subject: "Physics", topics: ["Thermodynamics"], hoursPerDay: 6, focusType: "revision" },
    { week: 5, subject: "All", topics: ["Full Mock"], hoursPerDay: 8, focusType: "mock" },
  ];

  it("counts Physics weeks correctly", () => {
    const cov = getSubjectCoverage(plans);
    expect(cov["Physics"]).toBe(2);
  });

  it("counts Chemistry weeks correctly", () => {
    const cov = getSubjectCoverage(plans);
    expect(cov["Chemistry"]).toBe(1);
  });

  it("excludes 'All' subject weeks from coverage", () => {
    const cov = getSubjectCoverage(plans);
    expect(cov["All"]).toBeUndefined();
  });

  it("covers all three JEE subjects", () => {
    const cov = getSubjectCoverage(plans);
    expect(Object.keys(cov)).toContain("Physics");
    expect(Object.keys(cov)).toContain("Chemistry");
    expect(Object.keys(cov)).toContain("Mathematics");
  });
});

// ─── Weak chapter prioritisation ─────────────────────────────────────────────

function prioritiseWeakChapters(
  chapters: Array<{ name: string; score: number }>,
  topN: number
): string[] {
  return chapters
    .sort((a, b) => a.score - b.score)
    .slice(0, topN)
    .map(c => c.name);
}

describe("Study Plan — Weak chapter prioritisation", () => {
  const chapters = [
    { name: "Organic Chemistry", score: 35 },
    { name: "Calculus", score: 42 },
    { name: "Electrostatics", score: 28 },
    { name: "Thermodynamics", score: 61 },
    { name: "Probability", score: 55 },
  ];

  it("returns the weakest chapter first", () => {
    const result = prioritiseWeakChapters(chapters, 1);
    expect(result[0]).toBe("Electrostatics");
  });

  it("returns top 3 weakest chapters", () => {
    const result = prioritiseWeakChapters(chapters, 3);
    expect(result).toEqual(["Electrostatics", "Organic Chemistry", "Calculus"]);
  });

  it("returns all chapters when topN >= length", () => {
    const result = prioritiseWeakChapters(chapters, 10);
    expect(result).toHaveLength(5);
  });
});

// ─── Exam-specific plan parameters ───────────────────────────────────────────

const EXAM_PLAN_DEFAULTS: Record<string, { subjects: string[]; totalWeeks: number; mockTestsPerMonth: number }> = {
  jee_main:     { subjects: ["Physics", "Chemistry", "Mathematics"], totalWeeks: 48, mockTestsPerMonth: 4 },
  jee_advanced: { subjects: ["Physics", "Chemistry", "Mathematics"], totalWeeks: 52, mockTestsPerMonth: 6 },
  neet:         { subjects: ["Physics", "Chemistry", "Biology"],     totalWeeks: 48, mockTestsPerMonth: 4 },
  gate:         { subjects: ["Core Engineering", "Engineering Mathematics", "General Aptitude"], totalWeeks: 24, mockTestsPerMonth: 2 },
  upsc:         { subjects: ["General Studies", "CSAT", "Optional Subject"], totalWeeks: 52, mockTestsPerMonth: 2 },
};

describe("Study Plan — Exam defaults", () => {
  it("JEE Main has 3 subjects", () => {
    expect(EXAM_PLAN_DEFAULTS["jee_main"].subjects).toHaveLength(3);
  });

  it("NEET includes Biology", () => {
    expect(EXAM_PLAN_DEFAULTS["neet"].subjects).toContain("Biology");
  });

  it("GATE has shorter plan (24 weeks)", () => {
    expect(EXAM_PLAN_DEFAULTS["gate"].totalWeeks).toBe(24);
  });

  it("JEE Advanced has more mock tests per month than JEE Main", () => {
    expect(EXAM_PLAN_DEFAULTS["jee_advanced"].mockTestsPerMonth).toBeGreaterThan(
      EXAM_PLAN_DEFAULTS["jee_main"].mockTestsPerMonth
    );
  });

  it("all 5 exams have defined defaults", () => {
    expect(Object.keys(EXAM_PLAN_DEFAULTS)).toHaveLength(5);
  });
});
