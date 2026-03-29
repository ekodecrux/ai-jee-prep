import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  lessonPlanDays, indianHolidays, mockTestSchedule,
  tuitionSessions, chapters, chapterProgress,
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte, between } from "drizzle-orm";

// 20-month chapter distribution (chapterId prefix patterns)
// Month 1-12: Class 11 chapters, Month 13-20: Class 12 chapters
const CHAPTER_MONTH_MAP: Record<number, string[]> = {
  1:  ["PHY_C11_01", "PHY_C11_02", "CHE_C11_01"],
  2:  ["PHY_C11_03", "PHY_C11_04", "CHE_C11_02", "CHE_C11_03"],
  3:  ["PHY_C11_05", "PHY_C11_06", "CHE_C11_04", "MAT_C11_01"],
  4:  ["PHY_C11_07", "PHY_C11_08", "CHE_C11_05", "MAT_C11_02"],
  5:  ["PHY_C11_09", "PHY_C11_10", "CHE_C11_06", "MAT_C11_03", "MAT_C11_04"],
  6:  ["PHY_C11_11", "PHY_C11_12", "CHE_C11_07", "MAT_C11_05", "MAT_C11_06"],
  7:  ["CHE_C11_08", "CHE_C11_09", "CHE_C11_10", "MAT_C11_07", "MAT_C11_08"],
  8:  ["CHE_C11_11", "CHE_C11_12", "CHE_C11_13", "MAT_C11_09", "MAT_C11_10"],
  9:  ["CHE_C11_14", "MAT_C11_11", "MAT_C11_12", "MAT_C11_13"],
  10: ["MAT_C11_14", "PHY_C12_01", "PHY_C12_02", "CHE_C12_01"],
  11: ["PHY_C12_03", "PHY_C12_04", "CHE_C12_02", "CHE_C12_03", "MAT_C12_01"],
  12: ["PHY_C12_05", "PHY_C12_06", "CHE_C12_04", "CHE_C12_05", "MAT_C12_02"],
  13: ["PHY_C12_07", "PHY_C12_08", "CHE_C12_06", "CHE_C12_07", "MAT_C12_03"],
  14: ["PHY_C12_09", "PHY_C12_10", "CHE_C12_08", "CHE_C12_09", "MAT_C12_04"],
  15: ["PHY_C12_11", "PHY_C12_12", "CHE_C12_10", "CHE_C12_11", "MAT_C12_05"],
  16: ["PHY_C12_13", "CHE_C12_12", "CHE_C12_13", "MAT_C12_06", "MAT_C12_07"],
  17: ["PHY_C12_14", "PHY_C12_15", "CHE_C12_14", "MAT_C12_08", "MAT_C12_09"],
  18: ["PHY_C12_16", "PHY_C12_17", "MAT_C12_10", "MAT_C12_11"],
  19: ["PHY_C12_18", "PHY_C12_19", "MAT_C12_12", "MAT_C12_13"],
  20: ["PHY_C12_20", "PHY_C12_21", "PHY_C12_22"],
};

export const lessonPlanRouter = router({
  // ─── Get Today's Schedule ─────────────────────────────────────────────────
  getTodaySchedule: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    const today = new Date().toISOString().split("T")[0];

    const [todayPlan] = await db.select()
      .from(lessonPlanDays)
      .where(and(
        eq(lessonPlanDays.userId, ctx.user.id),
        eq(lessonPlanDays.planDate, today),
      ));

    // Check for holiday
    const [holiday] = await db.select()
      .from(indianHolidays)
      .where(eq(indianHolidays.holidayDate, today));

    // Get upcoming sessions (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const upcomingSessions = await db.select()
      .from(lessonPlanDays)
      .where(and(
        eq(lessonPlanDays.userId, ctx.user.id),
        gte(lessonPlanDays.planDate, today),
        lte(lessonPlanDays.planDate, nextWeekStr),
      ))
      .orderBy(lessonPlanDays.planDate)
      .limit(10);

    return {
      today: todayPlan || null,
      holiday: holiday || null,
      upcomingSessions,
    };
  }),

  // ─── Get Monthly Plan ─────────────────────────────────────────────────────
  getMonthlyPlan: protectedProcedure
    .input(z.object({ monthNumber: z.number().min(1).max(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const monthDays = await db.select()
        .from(lessonPlanDays)
        .where(and(
          eq(lessonPlanDays.userId, ctx.user.id),
          eq(lessonPlanDays.monthNumber, input.monthNumber),
        ))
        .orderBy(lessonPlanDays.planDate);

      // Get mock tests for this month
      const monthMocks = await db.select()
        .from(mockTestSchedule)
        .where(eq(mockTestSchedule.monthNumber, input.monthNumber));

      // Get chapters for this month
      const chapterIds = CHAPTER_MONTH_MAP[input.monthNumber] || [];
      const monthChapters = chapterIds.length > 0
        ? await db.select({
            chapterId: chapters.chapterId,
            title: chapters.title,
            subjectId: chapters.subjectId,
          }).from(chapters).where(sql`${chapters.chapterId} IN (${sql.join(chapterIds.map(id => sql`${id}`), sql`, `)})`)
        : [];

      return { days: monthDays, mockTests: monthMocks, chapters: monthChapters };
    }),

  // ─── Generate 20-Month Plan for User ─────────────────────────────────────
  generatePlan: protectedProcedure
    .input(z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      // Check if plan already exists
      const [existing] = await db.select({ id: lessonPlanDays.id })
        .from(lessonPlanDays)
        .where(eq(lessonPlanDays.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        return { success: false, message: "Plan already exists. Use reset to regenerate." };
      }

      // Load all holidays
      const holidays = await db.select().from(indianHolidays);
      const holidaySet = new Set(holidays.map(h => h.holidayDate));

      // Load mock test schedule
      const mocks = await db.select().from(mockTestSchedule).orderBy(mockTestSchedule.monthNumber);
      const mocksByMonth = new Map<number, typeof mocks>();
      for (const m of mocks) {
        if (m.monthNumber) {
          if (!mocksByMonth.has(m.monthNumber)) mocksByMonth.set(m.monthNumber, []);
          mocksByMonth.get(m.monthNumber)!.push(m);
        }
      }

      const days: Array<typeof lessonPlanDays.$inferInsert> = [];
      const start = new Date(input.startDate);
      let currentDate = new Date(start);
      let monthNumber = 1;
      let weekNumber = 1;
      let daysInCurrentMonth = 0;
      const DAYS_PER_MONTH = 30; // ~30 calendar days per study month

      const dayNames: Array<"mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun"> = ["sun","mon","tue","wed","thu","fri","sat"];

      while (monthNumber <= 20) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const dow = currentDate.getDay(); // 0=Sun
        const dayName = dayNames[dow];
        const isHoliday = holidaySet.has(dateStr);
        const holiday = holidays.find(h => h.holidayDate === dateStr);

        // Determine session type
        let sessionType: "lesson_30min"|"exam_15min"|"exam_60min"|"revision"|"holiday"|"mock_test" = "lesson_30min";
        let mockTestId: string | null = null;

        if (isHoliday || dow === 0) {
          // Sunday or holiday = rest/revision
          sessionType = isHoliday ? "holiday" : "revision";
        } else if (dow === 6) {
          // Saturday = 1-hr exam or mock test
          // Check if there's a mock test this month on a Saturday
          const monthMocks = mocksByMonth.get(monthNumber) || [];
          const saturdayMock = monthMocks.find(m => !m.scheduledUnlockDate);
          if (saturdayMock && daysInCurrentMonth >= 20) {
            sessionType = "mock_test";
            mockTestId = saturdayMock.mockTestId;
          } else {
            sessionType = "exam_60min";
          }
        } else {
          // Mon-Fri: alternate lesson and 15-min exam
          // Week pattern: Mon=lesson, Tue=exam_15min, Wed=lesson, Thu=exam_15min, Fri=lesson
          sessionType = (dow === 2 || dow === 4) ? "exam_15min" : "lesson_30min";
        }

        // Get chapter for this day
        const chapterIds = CHAPTER_MONTH_MAP[monthNumber] || [];
        const chapterIndex = Math.floor(daysInCurrentMonth / Math.max(1, Math.ceil(DAYS_PER_MONTH / chapterIds.length)));
        const chapterId = chapterIds[Math.min(chapterIndex, chapterIds.length - 1)] || null;

        days.push({
          userId: ctx.user.id,
          planDate: dateStr,
          monthNumber,
          weekNumber,
          dayOfWeek: dayName,
          isHoliday: isHoliday || dow === 0,
          holidayName: holiday?.name || (dow === 0 ? "Sunday Rest" : undefined),
          chapterId: sessionType !== "holiday" ? chapterId : null,
          subjectId: chapterId ? chapterId.split("_")[0].toLowerCase() === "phy" ? "physics"
            : chapterId.split("_")[0].toLowerCase() === "che" ? "chemistry" : "mathematics" : null,
          sessionType,
          mockTestId: mockTestId || undefined,
          isCompleted: false,
          isRescheduled: false,
        });

        // Advance
        currentDate.setDate(currentDate.getDate() + 1);
        daysInCurrentMonth++;
        if (dow === 0) weekNumber++; // new week on Sunday

        if (daysInCurrentMonth >= DAYS_PER_MONTH) {
          monthNumber++;
          daysInCurrentMonth = 0;
        }
      }

      // Batch insert in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < days.length; i += chunkSize) {
        await db.insert(lessonPlanDays).values(days.slice(i, i + chunkSize));
      }

      return {
        success: true,
        totalDays: days.length,
        message: `20-month study plan generated: ${days.length} days starting ${input.startDate}`,
      };
    }),

  // ─── Mark Day Complete ────────────────────────────────────────────────────
  markDayComplete: protectedProcedure
    .input(z.object({ planDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      await db.update(lessonPlanDays)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(and(
          eq(lessonPlanDays.userId, ctx.user.id),
          eq(lessonPlanDays.planDate, input.planDate),
        ));

      return { success: true };
    }),

  // ─── Get Mock Test Schedule ───────────────────────────────────────────────
  getMockTestSchedule: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    return await db.select().from(mockTestSchedule)
      .where(eq(mockTestSchedule.isActive, true))
      .orderBy(mockTestSchedule.monthNumber);
  }),

  // ─── Get Tuition Sessions ─────────────────────────────────────────────────
  getTuitionSessions: protectedProcedure
    .input(z.object({
      chapterId: z.string().optional(),
      sessionType: z.enum(["lesson_30min","exam_15min","exam_60min","practice","revision"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const conditions = [eq(tuitionSessions.userId, ctx.user.id)];
      if (input.chapterId) conditions.push(eq(tuitionSessions.chapterId, input.chapterId));
      if (input.sessionType) conditions.push(eq(tuitionSessions.sessionType, input.sessionType));

      return await db.select()
        .from(tuitionSessions)
        .where(and(...conditions))
        .orderBy(desc(tuitionSessions.createdAt))
        .limit(input.limit);
    }),

  // ─── Record Tuition Session ───────────────────────────────────────────────
  recordSession: protectedProcedure
    .input(z.object({
      chapterId: z.string(),
      subjectId: z.string(),
      sessionType: z.enum(["lesson_30min","exam_15min","exam_60min","practice","revision"]),
      durationMinutes: z.number(),
      score: z.number().optional(),
      maxScore: z.number().optional(),
      questionsAttempted: z.number().default(0),
      questionsCorrect: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const percentage = input.score && input.maxScore
        ? Math.round((input.score / input.maxScore) * 100)
        : undefined;

      await db.insert(tuitionSessions).values({
        userId: ctx.user.id,
        chapterId: input.chapterId,
        subjectId: input.subjectId,
        sessionType: input.sessionType,
        durationMinutes: input.durationMinutes,
        score: input.score,
        maxScore: input.maxScore,
        percentage,
        questionsAttempted: input.questionsAttempted,
        questionsCorrect: input.questionsCorrect,
        status: "completed",
        completedAt: new Date(),
      });

      return { success: true, percentage };
    }),

  // ─── Get Indian Holidays ──────────────────────────────────────────────────
  getHolidays: protectedProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const yearStr = input.year?.toString();
      return await db.select()
        .from(indianHolidays)
        .where(yearStr ? sql`${indianHolidays.holidayDate} LIKE ${yearStr + '%'}` : sql`1=1`)
        .orderBy(indianHolidays.holidayDate);
    }),

  // ─── Plan Progress Summary ────────────────────────────────────────────────
  getPlanProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    const today = new Date().toISOString().split("T")[0];

    const [totalDays] = await db.select({ count: sql<number>`count(*)` })
      .from(lessonPlanDays)
      .where(eq(lessonPlanDays.userId, ctx.user.id));

    const [completedDays] = await db.select({ count: sql<number>`count(*)` })
      .from(lessonPlanDays)
      .where(and(
        eq(lessonPlanDays.userId, ctx.user.id),
        eq(lessonPlanDays.isCompleted, true),
      ));

    const [currentMonth] = await db.select({ monthNumber: lessonPlanDays.monthNumber })
      .from(lessonPlanDays)
      .where(and(
        eq(lessonPlanDays.userId, ctx.user.id),
        eq(lessonPlanDays.planDate, today),
      ));

    const [missedDays] = await db.select({ count: sql<number>`count(*)` })
      .from(lessonPlanDays)
      .where(and(
        eq(lessonPlanDays.userId, ctx.user.id),
        eq(lessonPlanDays.isCompleted, false),
        lte(lessonPlanDays.planDate, today),
        sql`${lessonPlanDays.sessionType} != 'holiday'`,
      ));

    const total = totalDays?.count || 0;
    const completed = completedDays?.count || 0;
    const missed = missedDays?.count || 0;
    const onTrack = missed <= 3; // tolerance of 3 missed days

    return {
      totalDays: total,
      completedDays: completed,
      missedDays: missed,
      completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentMonth: currentMonth?.monthNumber || 1,
      onTrack,
      planExists: total > 0,
    };
  }),
});
