import { z } from "zod";
import { and, eq, gt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { sendInviteEmail, sendWelcomeEmail } from "../email";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users, inviteTokens, onboardingProgress, roleSessions,
  institutes, instituteMembers, instituteSettings,
  parentStudentLinks, studentProfiles, teacherProfiles,
  classes, classEnrollments,
} from "../../drizzle/schema";

// ─── Role-guard helpers ───────────────────────────────────────────────────────
export function requireRole(allowedRoles: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    const role = (ctx.user as any).role as string;
    if (!allowedRoles.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Role '${role}' is not allowed. Required: ${allowedRoles.join(", ")}` });
    }
    return next({ ctx });
  });
}

export const superAdminProcedure = requireRole(["super_admin", "admin"]);
export const instituteAdminProcedure = requireRole(["super_admin", "admin", "institute_admin"]);
export const teacherProcedure = requireRole(["super_admin", "admin", "institute_admin", "teacher"]);

// ─── Auth Router ──────────────────────────────────────────────────────────────
export const authExtRouter = router({

  // Get current user with full role context
  getMyContext: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { user: ctx.user, role: (ctx.user as any).role, instituteId: null, onboarding: null };
    const role = (ctx.user as any).role as string;

    // Get institute membership
    const [membership] = await db.select()
      .from(instituteMembers)
      .where(and(eq(instituteMembers.userId, ctx.user.id), eq(instituteMembers.isActive, true)))
      .limit(1);

    // Get onboarding progress
    const [onboarding] = await db.select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, ctx.user.id))
      .limit(1);

    // Record session activity
    await db.insert(roleSessions).values({
      userId: ctx.user.id,
      role,
      instituteId: membership?.instituteId || null,
      lastActiveAt: new Date(),
      loginAt: new Date(),
    }).catch(() => {});

    return {
      user: ctx.user,
      role,
      instituteId: membership?.instituteId || null,
      membership: membership || null,
      onboarding: onboarding || null,
      needsOnboarding: !onboarding || onboarding.step !== "ready",
    };
  }),

  // ─── Invite Management ─────────────────────────────────────────────────────
  createInvite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["institute_admin", "teacher", "student", "parent"]),
      instituteId: z.number().optional(),
      classId: z.number().optional(),
      linkedStudentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const senderRole = (ctx.user as any).role as string;

      // Permission check: only super_admin can invite institute_admin; institute_admin can invite others
      if (input.role === "institute_admin" && !["super_admin", "admin"].includes(senderRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Super Admin can invite Institute Admins" });
      }
      if (["teacher", "student", "parent"].includes(input.role) && !["super_admin", "admin", "institute_admin"].includes(senderRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Institute Admin or Super Admin can send this invite" });
      }

      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(inviteTokens).values({
        token,
        email: input.email,
        role: input.role,
        instituteId: input.instituteId || null,
        classId: input.classId || null,
        linkedStudentId: input.linkedStudentId || null,
        invitedBy: ctx.user.id,
        expiresAt,
        isUsed: false,
        createdAt: new Date(),
      });

      const inviteUrl = `${process.env.VITE_OAUTH_PORTAL_URL || ""}/invite/${token}`;

      // Send invite email asynchronously (don't block response)
      sendInviteEmail({
        to: input.email,
        role: input.role,
        instituteName: null, // resolved below if needed
        inviteUrl,
        inviterName: ctx.user.name || ctx.user.email || "AITutor Admin",
      }).catch(err => console.error("[Email] Failed to send invite:", err));

      return { token, inviteUrl, expiresAt };
    }),

  validateInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [invite] = await db.select()
        .from(inviteTokens)
        .where(and(
          eq(inviteTokens.token, input.token),
          eq(inviteTokens.isUsed, false),
          gt(inviteTokens.expiresAt, new Date()),
        ))
        .limit(1);

      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite token is invalid or has expired" });

      // Get institute info if applicable
      let instituteName: string | null = null;
      if (invite.instituteId) {
        const [inst] = await db.select({ name: institutes.name })
          .from(institutes)
          .where(eq(institutes.id, invite.instituteId))
          .limit(1);
        instituteName = inst?.name || null;
      }

      return { valid: true, email: invite.email, role: invite.role, instituteName, instituteId: invite.instituteId };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({
      token: z.string(),
      name: z.string().min(2),
      phone: z.string().optional(),
      grade: z.enum(["11", "12", "dropper"]).optional(),
      targetYear: z.number().optional(),
      schoolName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [invite] = await db.select()
        .from(inviteTokens)
        .where(and(
          eq(inviteTokens.token, input.token),
          eq(inviteTokens.isUsed, false),
          gt(inviteTokens.expiresAt, new Date()),
        ))
        .limit(1);

      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite token is invalid or expired" });

      // Update user role
      await db.update(users)
        .set({ role: invite.role as any, name: input.name })
        .where(eq(users.id, ctx.user.id));

      // Add to institute members
      if (invite.instituteId) {
        await db.insert(instituteMembers).values({
          userId: ctx.user.id,
          instituteId: invite.instituteId,
          role: invite.role as any,
          isActive: true,
          joinedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { isActive: true, role: invite.role as any } });
      }

      // Create role-specific profile
      if (invite.role === "student" && invite.instituteId) {
        await db.insert(studentProfiles).values({
          userId: ctx.user.id,
          instituteId: invite.instituteId,
          enrollmentModel: "institute",
          currentGrade: input.grade || "11",
          targetYear: input.targetYear || new Date().getFullYear() + 2,
          schoolName: input.schoolName || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { instituteId: invite.instituteId } });

        // Enroll in class if classId provided
        if (invite.classId) {
          await db.insert(classEnrollments).values({
            classId: invite.classId,
            studentId: ctx.user.id,
            enrolledAt: new Date(),
            isActive: true,
          }).onDuplicateKeyUpdate({ set: { isActive: true } });
        }
      }

      if (invite.role === "teacher" && invite.instituteId) {
        await db.insert(teacherProfiles).values({
          userId: ctx.user.id,
          instituteId: invite.instituteId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { isActive: true } });
      }

      if (invite.role === "parent" && invite.linkedStudentId) {
        await db.insert(parentStudentLinks).values({
          parentId: ctx.user.id,
          studentId: invite.linkedStudentId,
          relationship: "guardian",
          isVerified: true,
          createdAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { isVerified: true } });
      }

      // Mark invite as used
      await db.update(inviteTokens)
        .set({ isUsed: true, usedAt: new Date() })
        .where(eq(inviteTokens.id, invite.id));

      // Create onboarding progress as ready
      await db.insert(onboardingProgress).values({
        userId: ctx.user.id,
        role: invite.role,
        step: "ready",
        completedSteps: ["role_selected", "profile_complete", "institute_linked", "ready"],
        instituteId: invite.instituteId || null,
        inviteTokenId: invite.id,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { step: "ready", completedAt: new Date() } });

      // Send welcome email
      const dashboardUrl = `https://jeemasterprep-f58cx8ks.manus.space/dashboard`;
      sendWelcomeEmail({
        to: ctx.user.email || invite.email,
        name: input.name || ctx.user.name || "Student",
        role: invite.role,
        dashboardUrl,
      }).catch(err => console.error("[Email] Failed to send welcome email:", err));

      return { success: true, role: invite.role, instituteId: invite.instituteId };
    }),

  listPendingInvites: protectedProcedure
    .input(z.object({ instituteId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(inviteTokens.invitedBy, ctx.user.id), eq(inviteTokens.isUsed, false)];
      if (input.instituteId) conditions.push(eq(inviteTokens.instituteId, input.instituteId));
      return await db.select().from(inviteTokens).where(and(...conditions)).limit(50);
    }),

  revokeInvite: protectedProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(inviteTokens)
        .set({ isUsed: true, usedAt: new Date() })
        .where(and(eq(inviteTokens.id, input.inviteId), eq(inviteTokens.invitedBy, ctx.user.id)));
      return { success: true };
    }),

  // ─── Onboarding ────────────────────────────────────────────────────────────
  startOnboarding: protectedProcedure
    .input(z.object({
      role: z.enum(["student", "parent"]),
      name: z.string().min(2),
      grade: z.enum(["11", "12", "dropper"]).optional(),
      targetYear: z.number().optional(),
      schoolName: z.string().optional(),
      city: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Update user role and name
      await db.update(users)
        .set({ role: input.role as any, name: input.name })
        .where(eq(users.id, ctx.user.id));

      // Create student profile for standalone enrollment
      if (input.role === "student") {
        await db.insert(studentProfiles).values({
          userId: ctx.user.id,
          instituteId: null,
          enrollmentModel: "standalone",
          currentGrade: input.grade || "11",
          targetYear: input.targetYear || new Date().getFullYear() + 2,
          schoolName: input.schoolName || null,
          city: input.city || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { enrollmentModel: "standalone" } });
      }

      // Create onboarding record
      await db.insert(onboardingProgress).values({
        userId: ctx.user.id,
        role: input.role,
        step: "ready",
        completedSteps: ["role_selected", "profile_complete", "ready"],
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { step: "ready", completedAt: new Date() } });

      return { success: true, role: input.role };
    }),

  // ─── Institute Management (Super Admin) ────────────────────────────────────
  createInstitute: superAdminProcedure
    .input(z.object({
      name: z.string().min(2),
      code: z.string().min(2).max(20),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      subscriptionPlan: z.enum(["free", "basic", "pro", "enterprise"]).default("free"),
      adminEmail: z.string().email(),
      adminName: z.string().min(2),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Create institute
      const instituteCode = `INST_${input.code.toUpperCase()}_${Date.now()}`;
      const [result] = await db.insert(institutes).values({
        instituteId: instituteCode,
        name: input.name,
        code: input.code,
        contactEmail: input.contactEmail,
        onboardedBy: ctx.user.id,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const newInstituteId = (result as any).insertId as number;

      // Create institute settings
      await db.insert(instituteSettings).values({
        instituteId: newInstituteId,
        subscriptionPlan: input.subscriptionPlan,
        maxStudents: input.subscriptionPlan === "enterprise" ? 5000 : input.subscriptionPlan === "pro" ? 1000 : 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create invite for the institute admin
      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(inviteTokens).values({
        token,
        email: input.adminEmail,
        role: "institute_admin",
        instituteId: newInstituteId,
        invitedBy: ctx.user.id,
        expiresAt,
        isUsed: false,
        createdAt: new Date(),
      });

      const inviteUrl = `/invite/${token}`;
      return { success: true, instituteId: newInstituteId, inviteUrl, token };
    }),

  listInstitutes: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(institutes).limit(100);
  }),

  getInstituteStats: protectedProcedure
    .input(z.object({ instituteId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [studentCount] = await db.select({ count: sql<number>`count(*)` })
        .from(instituteMembers)
        .where(and(eq(instituteMembers.instituteId, input.instituteId), eq(instituteMembers.role, "student")));
      const [teacherCount] = await db.select({ count: sql<number>`count(*)` })
        .from(instituteMembers)
        .where(and(eq(instituteMembers.instituteId, input.instituteId), eq(instituteMembers.role, "teacher")));
      const [classCount] = await db.select({ count: sql<number>`count(*)` })
        .from(classes)
        .where(eq(classes.instituteId, input.instituteId));
      return {
        studentCount: Number(studentCount?.count || 0),
        teacherCount: Number(teacherCount?.count || 0),
        classCount: Number(classCount?.count || 0),
      };
    }),

  // ─── Class Management ──────────────────────────────────────────────────────
  createClass: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      name: z.string().min(2),
      grade: z.enum(["11", "12"]),
      teacherId: z.number().optional(),
      academicYear: z.string().default("2025-26"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const classId = `CLS_${input.instituteId}_${Date.now()}`;
      const [result] = await db.insert(classes).values({
        classId,
        instituteId: input.instituteId,
        name: input.name,
        grade: input.grade,
        teacherId: input.teacherId || null,
        academicYear: input.academicYear,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, classId: (result as any).insertId };
    }),

  listClasses: protectedProcedure
    .input(z.object({ instituteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(classes)
        .where(and(eq(classes.instituteId, input.instituteId), eq(classes.isActive, true)));
    }),

  // ─── Bulk CSV Student Import ────────────────────────────────────────────────
  bulkInviteStudents: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number().optional(),
      students: z.array(z.object({ email: z.string().email(), name: z.string() })).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      const tokens: string[] = [];
      for (const student of input.students) {
        const token = nanoid(48);
        await db.insert(inviteTokens).values({
          token, email: student.email, role: "student",
          instituteId: input.instituteId, classId: input.classId || null,
          invitedBy: ctx.user.id, expiresAt, isUsed: false,
          metadata: { name: student.name },
          createdAt: new Date(),
        });
        tokens.push(token);
      }
      return { success: true, count: tokens.length, tokens };
    }),

  // ─── Parent-Student Link ───────────────────────────────────────────────────
  linkParentToStudent: protectedProcedure
    .input(z.object({
      studentEmail: z.string().email(),
      relationship: z.enum(["father", "mother", "guardian"]).default("guardian"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [student] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.studentEmail))
        .limit(1);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Student not found with that email" });
      await db.insert(parentStudentLinks).values({
        parentId: ctx.user.id,
        studentId: student.id,
        relationship: input.relationship,
        isVerified: false,
        createdAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { relationship: input.relationship } });
      return { success: true, studentId: student.id };
    }),

  getMyChildren: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const links = await db.select({
      studentId: parentStudentLinks.studentId,
      relationship: parentStudentLinks.relationship,
      isVerified: parentStudentLinks.isVerified,
      studentName: users.name,
      studentEmail: users.email,
    })
      .from(parentStudentLinks)
      .innerJoin(users, eq(users.id, parentStudentLinks.studentId))
      .where(eq(parentStudentLinks.parentId, ctx.user.id));
    return links;
  }),
});
