/**
 * ERP Router — Multi-Tenant Institute Management
 *
 * Covers: User Management, Class/Subject Management, Teacher-Class-Subject Mapping,
 * Student Enrollment, Parent-Student Mapping, Attendance, Assignments, Audit Logs
 *
 * All procedures enforce tenant isolation via instituteId scoping.
 */

import { z } from "zod";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
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
