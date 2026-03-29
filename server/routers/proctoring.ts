import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { proctoringEvents, proctoringReports } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const proctoringRouter = router({
  // Log a single proctoring event during an exam
  logEvent: protectedProcedure
    .input(z.object({
      attemptId: z.number().optional(),
      attemptType: z.enum(["chapter_test", "subject_mock", "full_mock", "weekly_test"]),
      eventType: z.enum([
        "face_not_detected", "multiple_faces", "gaze_away",
        "tab_switch", "window_blur", "fullscreen_exit",
        "keyboard_shortcut", "copy_attempt", "paste_attempt",
        "right_click", "exam_started", "exam_submitted",
        "warning_issued", "auto_submitted",
      ]),
      severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
      durationSeconds: z.number().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      warningNumber: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      await db.insert(proctoringEvents).values({
        userId: ctx.user.id,
        attemptId: input.attemptId,
        attemptType: input.attemptType,
        eventType: input.eventType,
        severity: input.severity,
        durationSeconds: input.durationSeconds,
        metadata: input.metadata,
        warningNumber: input.warningNumber,
        timestamp: new Date(),
      });

      return { success: true };
    }),

  // Submit final proctoring report after exam completion
  submitReport: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      attemptType: z.enum(["chapter_test", "subject_mock", "full_mock", "weekly_test"]),
      events: z.array(z.object({
        eventType: z.string(),
        severity: z.string(),
        timestamp: z.string(),
        durationSeconds: z.number().optional(),
      })),
      wasAutoSubmitted: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      // Calculate suspicious score
      const severityWeights: Record<string, number> = {
        low: 1, medium: 3, high: 7, critical: 15,
      };
      const eventTypeWeights: Record<string, number> = {
        face_not_detected: 8,
        multiple_faces: 15,
        gaze_away: 3,
        tab_switch: 10,
        window_blur: 5,
        fullscreen_exit: 8,
        keyboard_shortcut: 5,
        copy_attempt: 12,
        paste_attempt: 12,
        right_click: 2,
        auto_submitted: 20,
      };

      let rawScore = 0;
      let tabSwitches = 0;
      let faceNotDetected = 0;
      let gazeAway = 0;
      let highSeverity = 0;
      let warnings = 0;

      for (const event of input.events) {
        const sw = severityWeights[event.severity] || 1;
        const ew = eventTypeWeights[event.eventType] || 1;
        rawScore += sw * ew * 0.5;

        if (event.eventType === "tab_switch") tabSwitches++;
        if (event.eventType === "face_not_detected") faceNotDetected++;
        if (event.eventType === "gaze_away") gazeAway++;
        if (event.severity === "high" || event.severity === "critical") highSeverity++;
        if (event.eventType === "warning_issued") warnings++;
      }

      // Normalize to 0-100
      const suspiciousScore = Math.min(100, Math.round(rawScore));

      await db.insert(proctoringReports).values({
        userId: ctx.user.id,
        attemptId: input.attemptId,
        attemptType: input.attemptType,
        suspiciousScore,
        totalEvents: input.events.length,
        highSeverityEvents: highSeverity,
        tabSwitches,
        faceNotDetectedCount: faceNotDetected,
        gazeAwayCount: gazeAway,
        warningsIssued: warnings,
        wasAutoSubmitted: input.wasAutoSubmitted,
        reviewStatus: suspiciousScore > 50 ? "pending" : "reviewed_clean",
      });

      return {
        success: true,
        suspiciousScore,
        flagged: suspiciousScore > 50,
        message: suspiciousScore > 50
          ? "Your exam has been flagged for review due to suspicious activity."
          : "Exam submitted successfully.",
      };
    }),

  // Get proctoring report for a specific attempt
  getReport: protectedProcedure
    .input(z.object({ attemptId: z.number(), attemptType: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const [report] = await db.select()
        .from(proctoringReports)
        .where(and(
          eq(proctoringReports.attemptId, input.attemptId),
          eq(proctoringReports.userId, ctx.user.id),
        ));

      const events = await db.select()
        .from(proctoringEvents)
        .where(and(
          eq(proctoringEvents.attemptId, input.attemptId),
          eq(proctoringEvents.userId, ctx.user.id),
        ))
        .orderBy(proctoringEvents.timestamp);

      return { report: report || null, events };
    }),

  // Get all proctoring reports for current user
  getMyReports: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    return await db.select()
      .from(proctoringReports)
      .where(eq(proctoringReports.userId, ctx.user.id))
      .orderBy(desc(proctoringReports.createdAt))
      .limit(20);
  }),
});
