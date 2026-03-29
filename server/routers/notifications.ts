import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notifications, notificationPreferences } from "../../drizzle/schema";

export const notificationsRouter = router({
  getMyNotifications: protectedProcedure
    .input(z.object({
      unreadOnly: z.boolean().default(false),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(notifications.userId, ctx.user.id)];
      if (input.unreadOnly) conditions.push(eq(notifications.isRead, false));
      return await db.select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(notifications.id, input.notificationId),
          eq(notifications.userId, ctx.user.id),
        ));
      return { success: true };
    }),

  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false),
        ));
      return { success: true };
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const [result] = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false),
        ));
      return { count: Number(result?.count || 0) };
    }),

  createNotification: protectedProcedure
    .input(z.object({
      userId: z.number(),
      type: z.enum([
        "lesson_overdue", "mock_test_unlocked", "mock_test_overdue",
        "streak_at_risk", "chapter_unlocked", "assessment_reminder",
        "weak_chapter_alert", "plan_behind_alert", "score_milestone",
        "weekly_summary", "admin_broadcast", "teacher_message",
        "parent_report", "system",
      ]),
      title: z.string(),
      message: z.string(),
      urgency: z.enum(["info", "warning", "critical", "success"]).default("info"),
      relatedId: z.string().optional(),
      relatedType: z.string().optional(),
      actionUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const role = (ctx.user as any).role;
      if (input.userId !== ctx.user.id && !["admin", "super_admin", "institute_admin", "teacher"].includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.insert(notifications).values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        urgency: input.urgency,
        relatedId: input.relatedId || null,
        relatedType: input.relatedType || null,
        actionUrl: input.actionUrl || null,
        isRead: false,
        createdAt: new Date(),
      });
      return { success: true };
    }),

  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [prefs] = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);
      return prefs || null;
    }),

  updatePreferences: protectedProcedure
    .input(z.object({
      lessonReminders: z.boolean().optional(),
      mockTestAlerts: z.boolean().optional(),
      streakAlerts: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
      parentReports: z.boolean().optional(),
      teacherMessages: z.boolean().optional(),
      achievementAlerts: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [existing] = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);
      if (existing) {
        await db.update(notificationPreferences)
          .set({ ...input })
          .where(eq(notificationPreferences.id, existing.id));
      } else {
        await db.insert(notificationPreferences).values({
          userId: ctx.user.id,
          lessonReminders: input.lessonReminders ?? true,
          mockTestAlerts: input.mockTestAlerts ?? true,
          streakAlerts: input.streakAlerts ?? true,
          weeklyDigest: input.weeklyDigest ?? true,
          parentReports: input.parentReports ?? true,
          teacherMessages: input.teacherMessages ?? true,
          achievementAlerts: input.achievementAlerts ?? true,
        });
      }
      return { success: true };
    }),
});
