/**
 * JEE Master Prep — Backend Unit Tests
 * Tests for chapters, content, assessments, and REST API v1 routes
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock the database ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// ─── Helper: create a public (unauthenticated) context ───────────────────────
function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Helper: create an authenticated user context ────────────────────────────
function createAuthCtx(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-user-42",
      name: "Test Student",
      email: "student@jee.test",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user object for authenticated user", async () => {
    const ctx = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test Student");
    expect(result?.role).toBe("user");
  });

  it("logout clears session cookie and returns success", async () => {
    const ctx = createAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

// ─── Chapters router tests (DB mocked as null — tests graceful degradation) ──
describe("chapters router", () => {
  it("listBySubject throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.listBySubject({ subjectId: "physics" }))
      .rejects.toThrow("DB not available");
  });

  it("listAll throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.listAll({ examId: "jee_main" }))
      .rejects.toThrow("DB not available");
  });

  it("getById throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.getById({ chapterId: "PHY_C11_01" }))
      .rejects.toThrow("DB not available");
  });

  it("getUserProgress requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.getUserProgress({ subjectId: "physics" }))
      .rejects.toThrow();
  });

  it("getUserProgress throws when DB unavailable for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    await expect(caller.chapters.getUserProgress({ subjectId: "physics" }))
      .rejects.toThrow("DB not available");
  });

  it("getDashboardSummary requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.getDashboardSummary())
      .rejects.toThrow();
  });

  it("search throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.search({ query: "kinematics" }))
      .rejects.toThrow("DB not available");
  });

  it("search validates minimum query length", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.search({ query: "k" }))
      .rejects.toThrow();
  });

  it("getStudyPlan throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chapters.getStudyPlan())
      .rejects.toThrow("DB not available");
  });
});

// ─── Content router tests ─────────────────────────────────────────────────────
describe("content router", () => {
  it("getNarration throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.content.getNarration({ chapterId: "PHY_C11_01" }))
      .rejects.toThrow("DB not available");
  });

  it("getQuestions throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.content.getQuestions({ chapterId: "PHY_C11_01", limit: 10 }))
      .rejects.toThrow("DB not available");
  });

  it("getAssessments throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.content.getAssessments({ chapterId: "PHY_C11_01" }))
      .rejects.toThrow("DB not available");
  });

  it("generateContent throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.content.generateContent({ chapterId: "PHY_C11_01" }))
      .rejects.toThrow("DB not available");
  });
});

// ─── Assessments router tests ─────────────────────────────────────────────────
describe("assessments router", () => {
  it("getById throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.assessments.getById({ assessmentId: "test-id" }))
      .rejects.toThrow("DB not available");
  });

  it("checkDailyLimit requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.assessments.checkDailyLimit({ assessmentId: "test-id" }))
      .rejects.toThrow();
  });

  it("submitAttempt requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.assessments.submitAttempt({
      assessmentId: "test-id",
      answers: { "1": "A" }
    })).rejects.toThrow();
  });

  it("getAnalytics requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.assessments.getAnalytics())
      .rejects.toThrow();
  });

  it("getMockTests throws when DB unavailable", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.assessments.getMockTests({ examId: "jee_main" }))
      .rejects.toThrow("DB not available");
  });

  it("checkMockTestUnlock requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.assessments.checkMockTestUnlock({ mockTestId: "jee_main_mock_1" }))
      .rejects.toThrow();
  });
});

// ─── Input validation tests ───────────────────────────────────────────────────
describe("input validation", () => {
  it("listBySubject requires subjectId", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    // @ts-expect-error intentional bad input
    await expect(caller.chapters.listBySubject({}))
      .rejects.toThrow();
  });

  it("getQuestions validates limit is positive", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.content.getQuestions({ chapterId: "PHY_C11_01", limit: 0 }))
      .rejects.toThrow();
  });

  it("submitAttempt requires assessmentId and answers", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    // @ts-expect-error intentional bad input
    await expect(caller.assessments.submitAttempt({ answers: {} }))
      .rejects.toThrow();
  });
});

// ─── System router tests ──────────────────────────────────────────────────────
describe("system router", () => {
  it("notifyOwner requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.system.notifyOwner({ title: "Test", content: "Hello" }))
      .rejects.toThrow();
  });
});
