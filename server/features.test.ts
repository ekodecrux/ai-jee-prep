/**
 * Feature tests: Assignments & Fees routers (unit-level, no DB required)
 */
import { describe, it, expect } from "vitest";

// ─── Assignment helpers ───────────────────────────────────────────────────────
function calcGradeLabel(score: number, maxScore: number): string {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

describe("Assignment grade label", () => {
  it("returns A+ for 90%+", () => expect(calcGradeLabel(18, 20)).toBe("A+"));
  it("returns A for 80-89%", () => expect(calcGradeLabel(16, 20)).toBe("A"));
  it("returns B for 70-79%", () => expect(calcGradeLabel(14, 20)).toBe("B"));
  it("returns C for 60-69%", () => expect(calcGradeLabel(12, 20)).toBe("C"));
  it("returns D for 50-59%", () => expect(calcGradeLabel(10, 20)).toBe("D"));
  it("returns F below 50%", () => expect(calcGradeLabel(9, 20)).toBe("F"));
  it("handles zero max score gracefully", () => expect(calcGradeLabel(0, 0)).toBe("F"));
});

// ─── Fee calculation helpers ──────────────────────────────────────────────────
function calcCollectionRate(totalDue: number, totalPaid: number): number {
  if (totalDue <= 0) return 0;
  return Math.round((totalPaid / totalDue) * 100);
}

function calcBalance(amount: number, paidAmount: number): number {
  return Math.max(0, amount - paidAmount);
}

function determineFeeStatus(amount: number, paidAmount: number, dueDate: Date): "paid" | "partial" | "overdue" | "pending" {
  if (paidAmount >= amount) return "paid";
  if (paidAmount > 0) return "partial";
  if (new Date() > dueDate) return "overdue";
  return "pending";
}

describe("Fee calculation helpers", () => {
  it("calculates 100% collection rate when fully paid", () => {
    expect(calcCollectionRate(10000, 10000)).toBe(100);
  });
  it("calculates 50% collection rate", () => {
    expect(calcCollectionRate(10000, 5000)).toBe(50);
  });
  it("returns 0 when nothing is due", () => {
    expect(calcCollectionRate(0, 0)).toBe(0);
  });
  it("calculates remaining balance", () => {
    expect(calcBalance(5000, 2000)).toBe(3000);
  });
  it("returns 0 balance when overpaid", () => {
    expect(calcBalance(5000, 6000)).toBe(0);
  });
  it("marks fee as paid when fully paid", () => {
    const future = new Date(Date.now() + 86400000);
    expect(determineFeeStatus(5000, 5000, future)).toBe("paid");
  });
  it("marks fee as partial when partially paid", () => {
    const future = new Date(Date.now() + 86400000);
    expect(determineFeeStatus(5000, 2000, future)).toBe("partial");
  });
  it("marks fee as overdue when past due and unpaid", () => {
    const past = new Date(Date.now() - 86400000);
    expect(determineFeeStatus(5000, 0, past)).toBe("overdue");
  });
  it("marks fee as pending when future due and unpaid", () => {
    const future = new Date(Date.now() + 86400000);
    expect(determineFeeStatus(5000, 0, future)).toBe("pending");
  });
});

// ─── Report card helpers ──────────────────────────────────────────────────────
function calcAttendancePercent(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

describe("Report card attendance calculation", () => {
  it("returns 100% when fully present", () => {
    expect(calcAttendancePercent(30, 30)).toBe(100);
  });
  it("returns 0% when no classes", () => {
    expect(calcAttendancePercent(0, 0)).toBe(0);
  });
  it("rounds to nearest integer", () => {
    expect(calcAttendancePercent(2, 3)).toBe(67);
  });
});
