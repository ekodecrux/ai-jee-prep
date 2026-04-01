/**
 * ERP Router — Multi-Tenant Institute Management
 *
 * Covers: User Management, Class/Subject Management, Teacher-Class-Subject Mapping,
 * Student Enrollment, Parent-Student Mapping, Attendance, Assignments, Audit Logs
 *
 * All procedures enforce tenant isolation via instituteId scoping.
 */

import { z } from "zod";
import { and, eq, desc, asc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { protectedProcedure, router } from "../_core/trpc";
import { requireRole } from "./auth";
import { getDb } from "../db";
import {
  users, institutes, instituteMembers, classes, classEnrollments,
  parentStudentLinks, studentProfiles, teacherProfiles,
  instituteSubjects, teacherClassSubjects, attendance,
  instituteAssignments, assignmentSubmissions, auditLogs,
  inviteTokens, instituteSettings,
  onlineClasses, lessonPlans as lessonPlansTable, bridgeCourses, lowAttendanceAlerts,
} from "../../drizzle/schema";
import { sendInviteEmail } from "../email";

const superAdminProcedure = requireRole(["super_admin", "admin"]);
const instituteAdminProcedure = requireRole(["super_admin", "admin", "institute_admin"]);
const teacherProcedure = requireRole(["super_admin", "admin", "institute_admin", "teacher"]);

// ─── Audit helper ─────────────────────────────────────────────────────────────
async function logAudit(db: Awaited<ReturnType<typeof getDb>>, opts: {
  userId?: number;
  instituteId?: number;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  severity?: "info" | "warning" | "critical";
}) {
  if (!db) return;
  await db.insert(auditLogs).values({
    userId: opts.userId || null,
    instituteId: opts.instituteId || null,
    action: opts.action,
    targetType: opts.targetType || null,
    targetId: opts.targetId || null,
    details: opts.details || null,
    severity: opts.severity || "info",
    createdAt: new Date(),
  }).catch(() => {});
}

// ─── Tenant guard helper ──────────────────────────────────────────────────────
async function assertInstituteMember(db: Awaited<ReturnType<typeof getDb>>, userId: number, instituteId: number, allowedRoles?: string[]) {
  if (!db) return;
  const [membership] = await db.select()
    .from(instituteMembers)
    .where(and(
      eq(instituteMembers.userId, userId),
      eq(instituteMembers.instituteId, instituteId),
      eq(instituteMembers.isActive, true),
    ))
    .limit(1);

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this institute" });
  }
  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: `Role '${membership.role}' cannot perform this action` });
  }
  return membership;
}

export const erpRouter = router({

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPER ADMIN — Institute Management
  // ═══════════════════════════════════════════════════════════════════════════

  // List all institutes with stats
  listInstitutes: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select({
      id: institutes.id,
      instituteId: institutes.instituteId,
      name: institutes.name,
      code: institutes.code,
      contactEmail: institutes.contactEmail,
      city: institutes.city,
      state: institutes.state,
      isActive: institutes.isActive,
      isVerified: institutes.isVerified,
      subscriptionPlan: institutes.subscriptionPlan,
      createdAt: institutes.createdAt,
    }).from(institutes).orderBy(desc(institutes.createdAt)).limit(200);
    return rows;
  }),

  // Get institute detail with member counts
  getInstituteDetail: superAdminProcedure
    .input(z.object({ instituteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [inst] = await db.select().from(institutes).where(eq(institutes.id, input.instituteId)).limit(1);
      if (!inst) throw new TRPCError({ code: "NOT_FOUND", message: "Institute not found" });

      const [settings] = await db.select().from(instituteSettings).where(eq(instituteSettings.instituteId, input.instituteId)).limit(1);

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
        ...inst,
        settings: settings || null,
        stats: {
          students: Number(studentCount?.count || 0),
          teachers: Number(teacherCount?.count || 0),
          classes: Number(classCount?.count || 0),
        },
      };
    }),

  // Create institute (super admin)
  createInstitute: superAdminProcedure
    .input(z.object({
      name: z.string().min(2),
      code: z.string().min(2).max(20),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      website: z.string().optional(),
      subscriptionPlan: z.enum(["trial", "basic", "standard", "premium", "enterprise"]).default("trial"),
      maxStudents: z.number().default(100),
      maxTeachers: z.number().default(10),
      adminEmail: z.string().email(),
      adminName: z.string().min(2),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const instituteCode = `INST_${input.code.toUpperCase()}_${Date.now()}`;
      const [result] = await db.insert(institutes).values({
        instituteId: instituteCode,
        name: input.name,
        code: input.code.toUpperCase(),
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        city: input.city || null,
        state: input.state || null,
        website: input.website || null,
        subscriptionPlan: input.subscriptionPlan,
        maxStudents: input.maxStudents,
        maxTeachers: input.maxTeachers,
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
        subscriptionPlan: input.subscriptionPlan === "enterprise" ? "enterprise" : input.subscriptionPlan === "premium" ? "pro" : "basic",
        maxStudents: input.maxStudents,
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
        metadata: { adminName: input.adminName },
        createdAt: new Date(),
      });

      await logAudit(db, { userId: ctx.user.id, action: "institute.create", targetType: "institute", targetId: String(newInstituteId), details: { name: input.name } });

      const inviteUrl = `/onboarding?token=${token}`;
      return { success: true, instituteId: newInstituteId, inviteUrl, token };
    }),

  // Update institute (super admin)
  updateInstitute: superAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      name: z.string().min(2).optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      isActive: z.boolean().optional(),
      subscriptionPlan: z.enum(["trial", "basic", "standard", "premium", "enterprise"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { instituteId, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length > 0) {
        await db.update(institutes).set({ ...filtered, updatedAt: new Date() }).where(eq(institutes.id, instituteId));
      }
      await logAudit(db, { userId: ctx.user.id, action: "institute.update", targetType: "institute", targetId: String(instituteId), details: filtered });
      return { success: true };
    }),

  // Toggle institute active status
  toggleInstituteStatus: superAdminProcedure
    .input(z.object({ instituteId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(institutes).set({ isActive: input.isActive, updatedAt: new Date() }).where(eq(institutes.id, input.instituteId));
      await logAudit(db, { userId: ctx.user.id, action: input.isActive ? "institute.activate" : "institute.suspend", targetType: "institute", targetId: String(input.instituteId), severity: "warning" });
      return { success: true };
    }),

  // Global analytics for super admin
  getGlobalAnalytics: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const [totalInstitutes] = await db.select({ count: sql<number>`count(*)` }).from(institutes);
    const [activeInstitutes] = await db.select({ count: sql<number>`count(*)` }).from(institutes).where(eq(institutes.isActive, true));
    const [totalMembers] = await db.select({ count: sql<number>`count(*)` }).from(instituteMembers);
    const [totalStudents] = await db.select({ count: sql<number>`count(*)` }).from(instituteMembers).where(eq(instituteMembers.role, "student"));
    const [totalTeachers] = await db.select({ count: sql<number>`count(*)` }).from(instituteMembers).where(eq(instituteMembers.role, "teacher"));
    const [totalClasses] = await db.select({ count: sql<number>`count(*)` }).from(classes);

    return {
      totalInstitutes: Number(totalInstitutes?.count || 0),
      activeInstitutes: Number(activeInstitutes?.count || 0),
      totalMembers: Number(totalMembers?.count || 0),
      totalStudents: Number(totalStudents?.count || 0),
      totalTeachers: Number(totalTeachers?.count || 0),
      totalClasses: Number(totalClasses?.count || 0),
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTE ADMIN — User Management
  // ═══════════════════════════════════════════════════════════════════════════

  // List all members of an institute by role
  listInstituteMembers: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      role: z.enum(["teacher", "student", "parent", "institute_admin"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userRole = (ctx.user as any).role as string;
      // Non-super-admins must be members of the institute
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }

      const conditions = [eq(instituteMembers.instituteId, input.instituteId)];
      if (input.role) conditions.push(eq(instituteMembers.role, input.role));

      const rows = await db.select({
        memberId: instituteMembers.id,
        userId: instituteMembers.userId,
        role: instituteMembers.role,
        isActive: instituteMembers.isActive,
        joinedAt: instituteMembers.joinedAt,
        name: users.name,
        email: users.email,
      })
        .from(instituteMembers)
        .innerJoin(users, eq(users.id, instituteMembers.userId))
        .where(and(...conditions))
        .orderBy(desc(instituteMembers.joinedAt))
        .limit(500);

      return rows;
    }),

  // Invite a user to the institute
  inviteMember: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      email: z.string().email(),
      name: z.string().min(2),
      role: z.enum(["teacher", "student", "parent"]),
      classId: z.number().optional(),
      linkedStudentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }

      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(inviteTokens).values({
        token,
        email: input.email,
        role: input.role,
        instituteId: input.instituteId,
        classId: input.classId || null,
        linkedStudentId: input.linkedStudentId || null,
        invitedBy: ctx.user.id,
        expiresAt,
        isUsed: false,
        metadata: { name: input.name },
        createdAt: new Date(),
      });

      const [inst] = await db.select({ name: institutes.name }).from(institutes).where(eq(institutes.id, input.instituteId)).limit(1);
      const inviteUrl = `${process.env.VITE_OAUTH_PORTAL_URL || ""}/onboarding?token=${token}`;

      sendInviteEmail({
        to: input.email,
        role: input.role,
        instituteName: inst?.name || null,
        inviteUrl,
        inviterName: ctx.user.name || "Institute Admin",
      }).catch(() => {});

      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "member.invite", targetType: "user", details: { email: input.email, role: input.role } });

      return { success: true, token, inviteUrl };
    }),

  // Bulk invite students
  bulkInviteMembers: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      role: z.enum(["teacher", "student", "parent"]),
      classId: z.number().optional(),
      members: z.array(z.object({ email: z.string().email(), name: z.string() })).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }

      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const results: Array<{ email: string; token: string; inviteUrl: string }> = [];

      for (const member of input.members) {
        const token = nanoid(48);
        await db.insert(inviteTokens).values({
          token,
          email: member.email,
          role: input.role,
          instituteId: input.instituteId,
          classId: input.classId || null,
          invitedBy: ctx.user.id,
          expiresAt,
          isUsed: false,
          metadata: { name: member.name },
          createdAt: new Date(),
        });
        const inviteUrl = `/onboarding?token=${token}`;
        results.push({ email: member.email, token, inviteUrl });
      }

      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "member.bulk_invite", details: { count: input.members.length, role: input.role } });
      return { success: true, count: results.length, results };
    }),

  // Deactivate a member
  deactivateMember: instituteAdminProcedure
    .input(z.object({ memberId: z.number(), instituteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }
      await db.update(instituteMembers)
        .set({ isActive: false })
        .where(and(eq(instituteMembers.id, input.memberId), eq(instituteMembers.instituteId, input.instituteId)));
      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "member.deactivate", targetType: "member", targetId: String(input.memberId), severity: "warning" });
      return { success: true };
    }),

  // Reactivate a member
  reactivateMember: instituteAdminProcedure
    .input(z.object({ memberId: z.number(), instituteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }
      await db.update(instituteMembers)
        .set({ isActive: true })
        .where(and(eq(instituteMembers.id, input.memberId), eq(instituteMembers.instituteId, input.instituteId)));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTE ADMIN — Subject Management
  // ═══════════════════════════════════════════════════════════════════════════

  listSubjects: protectedProcedure
    .input(z.object({ instituteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(instituteSubjects)
        .where(and(eq(instituteSubjects.instituteId, input.instituteId), eq(instituteSubjects.isActive, true)))
        .orderBy(instituteSubjects.name);
    }),

  createSubject: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      name: z.string().min(2),
      code: z.string().optional(),
      description: z.string().optional(),
      colorHex: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }
      const [result] = await db.insert(instituteSubjects).values({
        instituteId: input.instituteId,
        name: input.name,
        code: input.code || null,
        description: input.description || null,
        colorHex: input.colorHex || "#6366f1",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "subject.create", details: { name: input.name } });
      return { success: true, subjectId: (result as any).insertId };
    }),

  updateSubject: instituteAdminProcedure
    .input(z.object({
      subjectId: z.number(),
      instituteId: z.number(),
      name: z.string().min(2).optional(),
      code: z.string().optional(),
      description: z.string().optional(),
      colorHex: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { subjectId, instituteId, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      await db.update(instituteSubjects)
        .set({ ...filtered, updatedAt: new Date() })
        .where(and(eq(instituteSubjects.id, subjectId), eq(instituteSubjects.instituteId, instituteId)));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTE ADMIN — Class Management
  // ═══════════════════════════════════════════════════════════════════════════

  listClasses: protectedProcedure
    .input(z.object({ instituteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({
        id: classes.id,
        classId: classes.classId,
        name: classes.name,
        grade: classes.grade,
        academicYear: classes.academicYear,
        examFocus: classes.examFocus,
        maxStudents: classes.maxStudents,
        isActive: classes.isActive,
        teacherId: classes.teacherId,
        teacherName: users.name,
      })
        .from(classes)
        .leftJoin(users, eq(users.id, classes.teacherId))
        .where(and(eq(classes.instituteId, input.instituteId), eq(classes.isActive, true)))
        .orderBy(classes.grade, classes.name);
      return rows;
    }),

  createClass: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number(),
      name: z.string().min(2),
      grade: z.enum(["11", "12", "dropper", "integrated"]),
      teacherId: z.number().optional(),
      academicYear: z.string().default("2025-26"),
      examFocus: z.string().default("jee_main"),
      maxStudents: z.number().default(60),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }
      const classId = `CLS_${input.instituteId}_${Date.now()}`;
      const [result] = await db.insert(classes).values({
        classId,
        instituteId: input.instituteId,
        name: input.name,
        grade: input.grade,
        teacherId: input.teacherId || null,
        academicYear: input.academicYear,
        examFocus: input.examFocus,
        maxStudents: input.maxStudents,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "class.create", details: { name: input.name } });
      return { success: true, classId: (result as any).insertId };
    }),

  updateClass: instituteAdminProcedure
    .input(z.object({
      classId: z.number(),
      instituteId: z.number(),
      name: z.string().optional(),
      teacherId: z.number().optional(),
      maxStudents: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { classId, instituteId, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      await db.update(classes)
        .set({ ...filtered, updatedAt: new Date() })
        .where(and(eq(classes.id, classId), eq(classes.instituteId, instituteId)));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTE ADMIN — Teacher-Class-Subject Mapping
  // ═══════════════════════════════════════════════════════════════════════════

  assignTeacherToClassSubject: instituteAdminProcedure
    .input(z.object({
      teacherId: z.number(),
      classId: z.number(),
      subjectId: z.number(),
      instituteId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }
      await db.insert(teacherClassSubjects).values({
        teacherId: input.teacherId,
        classId: input.classId,
        subjectId: input.subjectId,
        instituteId: input.instituteId,
        isActive: true,
        assignedAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { isActive: true } });
      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "teacher.assign_class_subject", details: { teacherId: input.teacherId, classId: input.classId, subjectId: input.subjectId } });
      return { success: true };
    }),

  removeTeacherFromClassSubject: instituteAdminProcedure
    .input(z.object({ mappingId: z.number(), instituteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(teacherClassSubjects)
        .set({ isActive: false })
        .where(and(eq(teacherClassSubjects.id, input.mappingId), eq(teacherClassSubjects.instituteId, input.instituteId)));
      return { success: true };
    }),

  listTeacherMappings: protectedProcedure
    .input(z.object({ instituteId: z.number(), classId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(teacherClassSubjects.instituteId, input.instituteId), eq(teacherClassSubjects.isActive, true)];
      if (input.classId) conditions.push(eq(teacherClassSubjects.classId, input.classId));
      return await db.select({
        id: teacherClassSubjects.id,
        teacherId: teacherClassSubjects.teacherId,
        classId: teacherClassSubjects.classId,
        subjectId: teacherClassSubjects.subjectId,
        teacherName: users.name,
        subjectName: instituteSubjects.name,
        className: classes.name,
      })
        .from(teacherClassSubjects)
        .leftJoin(users, eq(users.id, teacherClassSubjects.teacherId))
        .leftJoin(instituteSubjects, eq(instituteSubjects.id, teacherClassSubjects.subjectId))
        .leftJoin(classes, eq(classes.id, teacherClassSubjects.classId))
        .where(and(...conditions));
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTE ADMIN — Student Enrollment
  // ═══════════════════════════════════════════════════════════════════════════

  enrollStudentInClass: instituteAdminProcedure
    .input(z.object({
      studentId: z.number(),
      classId: z.number(),
      instituteId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const userRole = (ctx.user as any).role as string;
      if (!["super_admin", "admin"].includes(userRole)) {
        await assertInstituteMember(db, ctx.user.id, input.instituteId, ["institute_admin"]);
      }
      await db.insert(classEnrollments).values({
        classId: input.classId,
        studentId: input.studentId,
        enrolledAt: new Date(),
        isActive: true,
      }).onDuplicateKeyUpdate({ set: { isActive: true } });
      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "student.enroll", details: { studentId: input.studentId, classId: input.classId } });
      return { success: true };
    }),

  unenrollStudentFromClass: instituteAdminProcedure
    .input(z.object({ enrollmentId: z.number(), instituteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(classEnrollments)
        .set({ isActive: false })
        .where(eq(classEnrollments.id, input.enrollmentId));
      return { success: true };
    }),

  listClassStudents: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select({
        enrollmentId: classEnrollments.id,
        studentId: classEnrollments.studentId,
        enrolledAt: classEnrollments.enrolledAt,
        isActive: classEnrollments.isActive,
        name: users.name,
        email: users.email,
      })
        .from(classEnrollments)
        .innerJoin(users, eq(users.id, classEnrollments.studentId))
        .where(and(eq(classEnrollments.classId, input.classId), eq(classEnrollments.isActive, true)));
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTE ADMIN — Parent-Student Mapping
  // ═══════════════════════════════════════════════════════════════════════════

  linkParentToStudent: instituteAdminProcedure
    .input(z.object({
      parentId: z.number(),
      studentId: z.number(),
      instituteId: z.number(),
      relationship: z.enum(["father", "mother", "guardian", "other"]).default("guardian"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.insert(parentStudentLinks).values({
        parentId: input.parentId,
        studentId: input.studentId,
        relationship: input.relationship,
        isVerified: true,
        verifiedAt: new Date(),
        createdAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { relationship: input.relationship, isVerified: true } });
      await logAudit(db, { userId: ctx.user.id, instituteId: input.instituteId, action: "parent.link_student", details: { parentId: input.parentId, studentId: input.studentId } });
      return { success: true };
    }),

  listParentChildren: protectedProcedure
    .input(z.object({ parentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select({
        linkId: parentStudentLinks.id,
        studentId: parentStudentLinks.studentId,
        relationship: parentStudentLinks.relationship,
        isVerified: parentStudentLinks.isVerified,
        studentName: users.name,
        studentEmail: users.email,
      })
        .from(parentStudentLinks)
        .innerJoin(users, eq(users.id, parentStudentLinks.studentId))
        .where(eq(parentStudentLinks.parentId, input.parentId));
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHER — Attendance Management
  // ═══════════════════════════════════════════════════════════════════════════

  markAttendance: teacherProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      subjectId: z.number().optional(),
      records: z.array(z.object({
        studentId: z.number(),
        status: z.enum(["present", "absent", "late", "excused"]),
        remarks: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      for (const record of input.records) {
        await db.insert(attendance).values({
          instituteId: input.instituteId,
          classId: input.classId,
          studentId: record.studentId,
          subjectId: input.subjectId || null,
          date: input.date,
          status: record.status,
          markedBy: ctx.user.id,
          remarks: record.remarks || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { status: record.status, remarks: record.remarks || null, updatedAt: new Date() } });
      }
      return { success: true, count: input.records.length };
    }),

  getAttendance: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number(),
      date: z.string().optional(),
      studentId: z.number().optional(),
      month: z.string().optional(), // YYYY-MM
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [
        eq(attendance.instituteId, input.instituteId),
        eq(attendance.classId, input.classId),
      ];
      if (input.date) conditions.push(eq(attendance.date, input.date));
      if (input.studentId) conditions.push(eq(attendance.studentId, input.studentId));
      if (input.month) {
        // Filter by month prefix YYYY-MM
        conditions.push(sql`${attendance.date} LIKE ${input.month + '%'}`);
      }
      return await db.select({
        id: attendance.id,
        studentId: attendance.studentId,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        studentName: users.name,
      })
        .from(attendance)
        .leftJoin(users, eq(users.id, attendance.studentId))
        .where(and(...conditions))
        .orderBy(attendance.date, users.name);
    }),

  getAttendanceSummary: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number(),
      studentId: z.number().optional(),
      month: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [
        eq(attendance.instituteId, input.instituteId),
        eq(attendance.classId, input.classId),
      ];
      if (input.studentId) conditions.push(eq(attendance.studentId, input.studentId));
      if (input.month) conditions.push(sql`${attendance.date} LIKE ${input.month + '%'}`);

      const rows = await db.select({
        studentId: attendance.studentId,
        studentName: users.name,
        total: sql<number>`count(*)`,
        present: sql<number>`sum(case when ${attendance.status} = 'present' then 1 else 0 end)`,
        absent: sql<number>`sum(case when ${attendance.status} = 'absent' then 1 else 0 end)`,
        late: sql<number>`sum(case when ${attendance.status} = 'late' then 1 else 0 end)`,
      })
        .from(attendance)
        .leftJoin(users, eq(users.id, attendance.studentId))
        .where(and(...conditions))
        .groupBy(attendance.studentId, users.name);

      return rows.map(r => ({
        ...r,
        attendancePercent: r.total > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100) : 0,
      }));
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHER — Assignment Management
  // ═══════════════════════════════════════════════════════════════════════════

  createAssignment: teacherProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number(),
      subjectId: z.number(),
      title: z.string().min(3),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      maxMarks: z.number().default(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(instituteAssignments).values({
        instituteId: input.instituteId,
        classId: input.classId,
        subjectId: input.subjectId,
        teacherId: ctx.user.id,
        title: input.title,
        description: input.description || null,
        dueDate: input.dueDate || null,
        maxMarks: input.maxMarks,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, assignmentId: (result as any).insertId };
    }),

  listAssignments: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number().optional(),
      subjectId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(instituteAssignments.instituteId, input.instituteId), eq(instituteAssignments.isActive, true)];
      if (input.classId) conditions.push(eq(instituteAssignments.classId, input.classId));
      if (input.subjectId) conditions.push(eq(instituteAssignments.subjectId, input.subjectId));
      return await db.select({
        id: instituteAssignments.id,
        title: instituteAssignments.title,
        description: instituteAssignments.description,
        dueDate: instituteAssignments.dueDate,
        maxMarks: instituteAssignments.maxMarks,
        createdAt: instituteAssignments.createdAt,
        teacherName: users.name,
        subjectName: instituteSubjects.name,
        className: classes.name,
      })
        .from(instituteAssignments)
        .leftJoin(users, eq(users.id, instituteAssignments.teacherId))
        .leftJoin(instituteSubjects, eq(instituteSubjects.id, instituteAssignments.subjectId))
        .leftJoin(classes, eq(classes.id, instituteAssignments.classId))
        .where(and(...conditions))
        .orderBy(desc(instituteAssignments.createdAt));
    }),

  submitAssignment: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      instituteId: z.number(),
      textContent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.insert(assignmentSubmissions).values({
        assignmentId: input.assignmentId,
        studentId: ctx.user.id,
        instituteId: input.instituteId,
        textContent: input.textContent || null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { textContent: input.textContent || null, updatedAt: new Date() } });
      return { success: true };
    }),

  gradeSubmission: teacherProcedure
    .input(z.object({
      submissionId: z.number(),
      grade: z.number().min(0).max(100),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(assignmentSubmissions)
        .set({ grade: input.grade, feedback: input.feedback || null, gradedBy: ctx.user.id, gradedAt: new Date(), updatedAt: new Date() })
        .where(eq(assignmentSubmissions.id, input.submissionId));
      return { success: true };
    }),

  listSubmissions: teacherProcedure
    .input(z.object({ assignmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select({
        id: assignmentSubmissions.id,
        studentId: assignmentSubmissions.studentId,
        textContent: assignmentSubmissions.textContent,
        grade: assignmentSubmissions.grade,
        feedback: assignmentSubmissions.feedback,
        submittedAt: assignmentSubmissions.submittedAt,
        gradedAt: assignmentSubmissions.gradedAt,
        studentName: users.name,
      })
        .from(assignmentSubmissions)
        .leftJoin(users, eq(users.id, assignmentSubmissions.studentId))
        .where(eq(assignmentSubmissions.assignmentId, input.assignmentId))
        .orderBy(assignmentSubmissions.submittedAt);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHER — My Dashboard
  // ═══════════════════════════════════════════════════════════════════════════

  getTeacherDashboard: teacherProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [membership] = await db.select()
      .from(instituteMembers)
      .where(and(eq(instituteMembers.userId, ctx.user.id), eq(instituteMembers.isActive, true)))
      .limit(1);

    if (!membership) return { classes: [], subjects: [], assignments: [] };

    const myMappings = await db.select({
      classId: teacherClassSubjects.classId,
      subjectId: teacherClassSubjects.subjectId,
      className: classes.name,
      subjectName: instituteSubjects.name,
      grade: classes.grade,
    })
      .from(teacherClassSubjects)
      .leftJoin(classes, eq(classes.id, teacherClassSubjects.classId))
      .leftJoin(instituteSubjects, eq(instituteSubjects.id, teacherClassSubjects.subjectId))
      .where(and(eq(teacherClassSubjects.teacherId, ctx.user.id), eq(teacherClassSubjects.isActive, true)));

    const myAssignments = await db.select()
      .from(instituteAssignments)
      .where(and(eq(instituteAssignments.teacherId, ctx.user.id), eq(instituteAssignments.isActive, true)))
      .orderBy(desc(instituteAssignments.createdAt))
      .limit(10);

    return { membership, classes: myMappings, assignments: myAssignments };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT — My Dashboard
  // ═══════════════════════════════════════════════════════════════════════════

  getStudentDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [membership] = await db.select()
      .from(instituteMembers)
      .where(and(eq(instituteMembers.userId, ctx.user.id), eq(instituteMembers.isActive, true)))
      .limit(1);

    if (!membership) return { enrollments: [], assignments: [], attendance: [] };

    const enrollments = await db.select({
      classId: classEnrollments.classId,
      className: classes.name,
      grade: classes.grade,
      academicYear: classes.academicYear,
    })
      .from(classEnrollments)
      .leftJoin(classes, eq(classes.id, classEnrollments.classId))
      .where(and(eq(classEnrollments.studentId, ctx.user.id), eq(classEnrollments.isActive, true)));

    const classIds = enrollments.map(e => e.classId).filter(Boolean) as number[];

    let assignments: typeof instituteAssignments.$inferSelect[] = [];
    if (classIds.length > 0) {
      assignments = await db.select()
        .from(instituteAssignments)
        .where(and(inArray(instituteAssignments.classId, classIds), eq(instituteAssignments.isActive, true)))
        .orderBy(desc(instituteAssignments.createdAt))
        .limit(20);
    }

    return { membership, enrollments, assignments };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PARENT — My Dashboard
  // ═══════════════════════════════════════════════════════════════════════════

  getParentDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const children = await db.select({
      studentId: parentStudentLinks.studentId,
      relationship: parentStudentLinks.relationship,
      studentName: users.name,
      studentEmail: users.email,
    })
      .from(parentStudentLinks)
      .innerJoin(users, eq(users.id, parentStudentLinks.studentId))
      .where(eq(parentStudentLinks.parentId, ctx.user.id));

    const childData = await Promise.all(children.map(async (child) => {
      const enrollments = await db.select({
        className: classes.name,
        grade: classes.grade,
      })
        .from(classEnrollments)
        .leftJoin(classes, eq(classes.id, classEnrollments.classId))
        .where(and(eq(classEnrollments.studentId, child.studentId), eq(classEnrollments.isActive, true)));

      const classIds = (await db.select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .where(and(eq(classEnrollments.studentId, child.studentId), eq(classEnrollments.isActive, true))))
        .map(e => e.classId);

      let attendanceSummary = null;
      if (classIds.length > 0) {
        const [summary] = await db.select({
          total: sql<number>`count(*)`,
          present: sql<number>`sum(case when ${attendance.status} = 'present' then 1 else 0 end)`,
        })
          .from(attendance)
          .where(eq(attendance.studentId, child.studentId));
        attendanceSummary = {
          total: Number(summary?.total || 0),
          present: Number(summary?.present || 0),
          percent: summary?.total ? Math.round((Number(summary.present) / Number(summary.total)) * 100) : 0,
        };
      }

      return { ...child, enrollments, attendanceSummary };
    }));

    return { children: childData };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════════════════

  getAuditLogs: instituteAdminProcedure
    .input(z.object({
      instituteId: z.number().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userRole = (ctx.user as any).role as string;
      const conditions = [];
      if (input.instituteId) {
        conditions.push(eq(auditLogs.instituteId, input.instituteId));
      } else if (!["super_admin", "admin"].includes(userRole)) {
        // Non-super-admins can only see their own institute's logs
        const [membership] = await db.select()
          .from(instituteMembers)
          .where(and(eq(instituteMembers.userId, ctx.user.id), eq(instituteMembers.isActive, true)))
          .limit(1);
        if (membership) conditions.push(eq(auditLogs.instituteId, membership.instituteId));
      }
      return await db.select().from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);
    }),
});

// ─── ONLINE CLASSES ROUTER ────────────────────────────────────────────────────
export const onlineClassesRouter = router({
  create: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number(),
      subjectId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      scheduledAt: z.number(),
      durationMinutes: z.number().default(60),
      meetingUrl: z.string().optional(),
      webcamRequired: z.boolean().default(false),
      type: z.enum(["live_class", "test", "doubt_session"]).default("live_class"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(onlineClasses).values({
        instituteId: input.instituteId,
        classId: input.classId,
        subjectId: input.subjectId ?? null,
        teacherId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        meetingUrl: input.meetingUrl ?? null,
        webcamRequired: input.webcamRequired,
        status: "scheduled",
      });
      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number().optional(),
      upcoming: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [eq(onlineClasses.instituteId, input.instituteId)];
      if (input.classId) conditions.push(eq(onlineClasses.classId, input.classId));
      if (input.upcoming) conditions.push(sql`${onlineClasses.scheduledAt} >= ${Date.now() - 3600000}`);
      return await db.select().from(onlineClasses)
        .where(and(...conditions))
        .orderBy(asc(onlineClasses.scheduledAt))
        .limit(50);
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["scheduled", "live", "ended", "cancelled"]),
      meetingUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(onlineClasses)
        .set({ status: input.status, ...(input.meetingUrl ? { meetingUrl: input.meetingUrl } : {}) })
        .where(eq(onlineClasses.id, input.id));
      return { success: true };
    }),
});

// ─── LESSON PLANS ERP ROUTER ─────────────────────────────────────────────────
export const lessonPlansErpRouter = router({
  create: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number(),
      subjectId: z.number().optional(),
      title: z.string().min(1),
      date: z.string(),
      objectives: z.string().optional(),
      content: z.string().optional(),
      resources: z.string().optional(),
      homework: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(lessonPlansTable).values({
        instituteId: input.instituteId,
        classId: input.classId,
        subjectId: input.subjectId ?? null,
        teacherId: ctx.user.id,
        title: input.title,
        date: input.date,
        objectives: input.objectives ?? null,
        activities: input.content ?? null,
        resources: input.resources ?? null,
        homework: input.homework ?? null,
        status: "published",
        isAiGenerated: false,
      });
      return { success: true };
    }),

  aiGenerate: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number(),
      subjectId: z.number().optional(),
      topic: z.string().min(1),
      date: z.string(),
      grade: z.string().optional(),
      durationMinutes: z.number().default(45),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { invokeLLM } = await import("../_core/llm.js");
      let aiResult = { title: input.topic, objectives: "", content: "", resources: "", homework: "" };
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system" as const, content: "You are an expert JEE/competitive exam teacher. Create a detailed lesson plan. Always respond with valid JSON." },
            { role: "user" as const, content: `Create a lesson plan for: ${input.topic}\nGrade: ${input.grade || "11/12"}\nDuration: ${input.durationMinutes} min\nDate: ${input.date}\nReturn JSON: {title, objectives, content, resources, homework}` },
          ],
          response_format: { type: "json_schema", json_schema: {
            name: "lesson_plan", strict: true,
            schema: { type: "object", properties: { title: { type: "string" }, objectives: { type: "string" }, content: { type: "string" }, resources: { type: "string" }, homework: { type: "string" } }, required: ["title","objectives","content","resources","homework"], additionalProperties: false },
          }},
        });
        const raw = response?.choices?.[0]?.message?.content;
        if (raw) aiResult = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      } catch {
        aiResult.objectives = `1. Understand core concepts of ${input.topic}\n2. Apply formulas to solve problems\n3. Practice JEE-level questions`;
        aiResult.content = `Introduction to ${input.topic}\n\nKey Concepts:\n- Concept 1\n- Concept 2\n\nSolved Examples:\nExample 1: ...\n\nPractice Problems:\n1. ...`;
        aiResult.resources = "NCERT Textbook, HC Verma, Previous Year JEE Papers";
        aiResult.homework = `Complete 10 practice problems on ${input.topic}.`;
      }
      await db.insert(lessonPlansTable).values({
        instituteId: input.instituteId,
        classId: input.classId,
        subjectId: input.subjectId ?? null,
        teacherId: ctx.user.id,
        title: aiResult.title,
        date: input.date,
        objectives: aiResult.objectives,
        activities: aiResult.content,
        resources: aiResult.resources,
        homework: aiResult.homework,
        status: "published",
        isAiGenerated: true,
      });
      return { success: true, plan: aiResult };
    }),

  list: protectedProcedure
    .input(z.object({
      instituteId: z.number(),
      classId: z.number().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [eq(lessonPlansTable.instituteId, input.instituteId)];
      if (input.classId) conditions.push(eq(lessonPlansTable.classId, input.classId));
      if (input.fromDate) conditions.push(sql`${lessonPlansTable.date} >= ${input.fromDate}`);
      if (input.toDate) conditions.push(sql`${lessonPlansTable.date} <= ${input.toDate}`);
      return await db.select().from(lessonPlansTable)
        .where(and(...conditions))
        .orderBy(desc(lessonPlansTable.date))
        .limit(100);
    }),
});

// ─── BRIDGE COURSES ROUTER ────────────────────────────────────────────────────
export const bridgeCoursesRouter = router({
  suggest: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      studentUserId: z.number(),
      instituteId: z.number(),
      weakTopics: z.array(z.string()),
      subjectName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { invokeLLM } = await import("../_core/llm.js");
      let suggestion = { title: `${input.subjectName} Bridge Course`, description: `Targeted remediation for ${input.subjectName}`, topics: input.weakTopics, estimatedHours: 12, priority: "high" };
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system" as const, content: "You are a JEE expert counselor. Suggest a focused bridge course. Return JSON." },
            { role: "user" as const, content: `Student is weak in ${input.subjectName}: ${input.weakTopics.join(", ")}. Return JSON: {title, description, topics (array), estimatedHours (number), priority (low/medium/high)}` },
          ],
          response_format: { type: "json_schema", json_schema: {
            name: "bridge_course", strict: true,
            schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, topics: { type: "array", items: { type: "string" } }, estimatedHours: { type: "number" }, priority: { type: "string" } }, required: ["title","description","topics","estimatedHours","priority"], additionalProperties: false },
          }},
        });
        const raw = response?.choices?.[0]?.message?.content;
        if (raw) suggestion = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      } catch { /* use defaults */ }
      await db.insert(bridgeCourses).values({
        studentId: input.studentId,
        teacherId: ctx.user.id,
        instituteId: input.instituteId,
        reason: `Weak in ${input.subjectName}: ${input.weakTopics.join(", ")}`,
        aiSuggestion: `${suggestion.title}\n\n${suggestion.description}\n\nTopics: ${suggestion.topics.join(", ")}\n\nEstimated: ${suggestion.estimatedHours}h`,
        weakTopics: suggestion.topics,
        status: "pending",
      });
      return { success: true };
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number(), action: z.enum(["approve", "reject"]), teacherNote: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(bridgeCourses)
        .set({ status: input.action === "approve" ? "approved" : "rejected", teacherNote: input.teacherNote ?? null })
        .where(eq(bridgeCourses.id, input.id));
      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({ instituteId: z.number(), studentUserId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [eq(bridgeCourses.instituteId, input.instituteId)];
      if (input.studentUserId) conditions.push(eq(bridgeCourses.studentId, input.studentUserId));
      if (input.status) conditions.push(sql`${bridgeCourses.status} = ${input.status}`);
      return await db.select().from(bridgeCourses).where(and(...conditions)).orderBy(desc(bridgeCourses.createdAt)).limit(50);
    }),
});

// ─── LOW ATTENDANCE ALERTS ROUTER ─────────────────────────────────────────────
export const attendanceAlertsRouter = router({
  checkAndAlert: protectedProcedure
    .input(z.object({ instituteId: z.number(), month: z.string(), threshold: z.number().default(75) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const instituteClasses = await db.select().from(classes).where(eq(classes.instituteId, input.instituteId));
      let alertCount = 0;
      for (const cls of instituteClasses) {
        const [year, month] = input.month.split("-").map(Number);
        const startTs = new Date(year, month - 1, 1).getTime();
        const endTs = new Date(year, month, 0, 23, 59, 59).getTime();
        const attRecords = await db.select({ studentId: attendance.studentId, status: attendance.status })
          .from(attendance)
          .where(and(eq(attendance.classId, cls.id), sql`${attendance.date} >= ${startTs}`, sql`${attendance.date} <= ${endTs}`));
        const byStudent: Record<number, { present: number; total: number }> = {};
        for (const rec of attRecords) {
          if (!byStudent[rec.studentId]) byStudent[rec.studentId] = { present: 0, total: 0 };
          byStudent[rec.studentId].total++;
          if (rec.status === "present" || rec.status === "late") byStudent[rec.studentId].present++;
        }
        for (const [studentId, counts] of Object.entries(byStudent)) {
          const pct = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 100;
          if (pct < input.threshold) {
            const existing = await db.select().from(lowAttendanceAlerts)
              .where(and(eq(lowAttendanceAlerts.studentId, Number(studentId)), eq(lowAttendanceAlerts.classId, cls.id), eq(lowAttendanceAlerts.month, input.month))).limit(1);
            if (existing.length === 0) {
              await db.insert(lowAttendanceAlerts).values({
                studentId: Number(studentId), classId: cls.id, instituteId: input.instituteId,
                month: input.month, attendancePercent: pct,
              });
              alertCount++;
            }
          }
        }
      }
      return { alertsGenerated: alertCount };
    }),

  list: protectedProcedure
    .input(z.object({ instituteId: z.number(), month: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [eq(lowAttendanceAlerts.instituteId, input.instituteId)];
      if (input.month) conditions.push(eq(lowAttendanceAlerts.month, input.month));
      return await db.select().from(lowAttendanceAlerts).where(and(...conditions)).orderBy(desc(lowAttendanceAlerts.createdAt)).limit(100);
    }),
});
