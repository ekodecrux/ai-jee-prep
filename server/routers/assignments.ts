/**
 * Assignments Router
 * - Teachers: create assignments, list submissions, grade submissions
 * - Students: list assignments, submit work
 * - Institute Admin: view all assignments
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  users,
  instituteMembers,
  instituteAssignments,
  assignmentSubmissions,
  classes,
  classEnrollments,
  teacherClassSubjects,
  instituteSubjects,
} from "../../drizzle/schema";

export const assignmentsRouter = router({
  // ─── Teacher: Create Assignment ───────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      classId: z.number(),
      subjectId: z.number(),
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      dueDate: z.string(), // YYYY-MM-DD
      maxMarks: z.number().min(1).max(1000).default(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || !["teacher", "institute_admin"].includes(member[0].role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only teachers can create assignments" });
      }

      const [result] = await db.insert(instituteAssignments).values({
        instituteId: member[0].instituteId,
        classId: input.classId,
        subjectId: input.subjectId,
        teacherId: member[0].id,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate,
        maxMarks: input.maxMarks,
        isActive: true,
      });

      return { id: Number(result.insertId), success: true };
    }),

  // ─── Teacher: List Assignments for my classes ─────────────────────────────
  listForTeacher: protectedProcedure
    .input(z.object({ classId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0]) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conditions: ReturnType<typeof eq>[] = [eq(instituteAssignments.teacherId, member[0].id)];
      if (input.classId) conditions.push(eq(instituteAssignments.classId, input.classId));

      const rows = await db.select({
        id: instituteAssignments.id,
        title: instituteAssignments.title,
        description: instituteAssignments.description,
        dueDate: instituteAssignments.dueDate,
        maxMarks: instituteAssignments.maxMarks,
        isActive: instituteAssignments.isActive,
        classId: instituteAssignments.classId,
        subjectId: instituteAssignments.subjectId,
        createdAt: instituteAssignments.createdAt,
        className: classes.name,
        subjectName: instituteSubjects.name,
      })
        .from(instituteAssignments)
        .leftJoin(classes, eq(classes.id, instituteAssignments.classId))
        .leftJoin(instituteSubjects, eq(instituteSubjects.id, instituteAssignments.subjectId))
        .where(and(...conditions))
        .orderBy(desc(instituteAssignments.createdAt));

      return rows;
    }),

  // ─── Teacher: List submissions for an assignment ──────────────────────────
  listSubmissions: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0]) throw new TRPCError({ code: "UNAUTHORIZED" });

      const assignment = await db.select().from(instituteAssignments)
        .where(and(
          eq(instituteAssignments.id, input.assignmentId),
          eq(instituteAssignments.instituteId, member[0].instituteId),
        ))
        .limit(1);
      if (!assignment[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const subs = await db.select({
        id: assignmentSubmissions.id,
        studentId: assignmentSubmissions.studentId,
        submittedAt: assignmentSubmissions.submittedAt,
        textContent: assignmentSubmissions.textContent,
        fileUrl: assignmentSubmissions.fileUrl,
        grade: assignmentSubmissions.grade,
        feedback: assignmentSubmissions.feedback,
        gradedAt: assignmentSubmissions.gradedAt,
        studentName: users.name,
        studentEmail: users.email,
      })
        .from(assignmentSubmissions)
        .leftJoin(instituteMembers, eq(instituteMembers.id, assignmentSubmissions.studentId))
        .leftJoin(users, eq(users.id, instituteMembers.userId))
        .where(eq(assignmentSubmissions.assignmentId, input.assignmentId))
        .orderBy(desc(assignmentSubmissions.submittedAt));

      return { assignment: assignment[0], submissions: subs };
    }),

  // ─── Teacher: Grade a submission ─────────────────────────────────────────
  grade: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
      grade: z.number().min(0).max(1000),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || !["teacher", "institute_admin"].includes(member[0].role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.update(assignmentSubmissions)
        .set({
          grade: input.grade,
          feedback: input.feedback ?? null,
          gradedAt: new Date(),
          gradedBy: member[0].id,
        })
        .where(eq(assignmentSubmissions.id, input.submissionId));

      return { success: true };
    }),

  // ─── Student: List assignments for my enrolled classes ───────────────────
  listForStudent: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0]) throw new TRPCError({ code: "UNAUTHORIZED" });

      const enrollments = await db.select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .where(eq(classEnrollments.studentId, member[0].id));

      if (enrollments.length === 0) return [];

      const classIds = enrollments.map(e => e.classId);

      const rows = await db.select({
        id: instituteAssignments.id,
        title: instituteAssignments.title,
        description: instituteAssignments.description,
        dueDate: instituteAssignments.dueDate,
        maxMarks: instituteAssignments.maxMarks,
        isActive: instituteAssignments.isActive,
        classId: instituteAssignments.classId,
        subjectId: instituteAssignments.subjectId,
        createdAt: instituteAssignments.createdAt,
        className: classes.name,
        subjectName: instituteSubjects.name,
      })
        .from(instituteAssignments)
        .leftJoin(classes, eq(classes.id, instituteAssignments.classId))
        .leftJoin(instituteSubjects, eq(instituteSubjects.id, instituteAssignments.subjectId))
        .where(and(
          inArray(instituteAssignments.classId, classIds),
          eq(instituteAssignments.isActive, true),
        ))
        .orderBy(desc(instituteAssignments.dueDate));

      const assignmentIds = rows.map(r => r.id);
      let mySubmissions: { assignmentId: number; grade: number | null; submittedAt: Date; }[] = [];
      if (assignmentIds.length > 0) {
        mySubmissions = await db.select({
          assignmentId: assignmentSubmissions.assignmentId,
          grade: assignmentSubmissions.grade,
          submittedAt: assignmentSubmissions.submittedAt,
        })
          .from(assignmentSubmissions)
          .where(and(
            eq(assignmentSubmissions.studentId, member[0].id),
            inArray(assignmentSubmissions.assignmentId, assignmentIds),
          ));
      }

      const submissionMap = new Map(mySubmissions.map(s => [s.assignmentId, s]));

      return rows.map(r => ({
        ...r,
        mySubmission: submissionMap.get(r.id) ?? null,
      }));
    }),

  // ─── Student: Submit assignment ───────────────────────────────────────────
  submit: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      textContent: z.string().optional(),
      fileUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "student") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only students can submit assignments" });
      }

      const assignment = await db.select().from(instituteAssignments)
        .where(eq(instituteAssignments.id, input.assignmentId))
        .limit(1);
      if (!assignment[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await db.select().from(assignmentSubmissions)
        .where(and(
          eq(assignmentSubmissions.assignmentId, input.assignmentId),
          eq(assignmentSubmissions.studentId, member[0].id),
        ))
        .limit(1);

      if (existing[0]) {
        await db.update(assignmentSubmissions)
          .set({
            textContent: input.textContent ?? null,
            fileUrl: input.fileUrl ?? null,
            submittedAt: new Date(),
          })
          .where(eq(assignmentSubmissions.id, existing[0].id));
        return { id: existing[0].id, updated: true };
      }

      const [result] = await db.insert(assignmentSubmissions).values({
        assignmentId: input.assignmentId,
        studentId: member[0].id,
        instituteId: member[0].instituteId,
        textContent: input.textContent ?? null,
        fileUrl: input.fileUrl ?? null,
        submittedAt: new Date(),
      });

      return { id: Number(result.insertId), updated: false };
    }),

  // ─── Teacher: Get classes I teach ─────────────────────────────────────────
  getMyClasses: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0]) throw new TRPCError({ code: "UNAUTHORIZED" });

      const rows = await db.select({
        classId: teacherClassSubjects.classId,
        subjectId: teacherClassSubjects.subjectId,
        className: classes.name,
        subjectName: instituteSubjects.name,
      })
        .from(teacherClassSubjects)
        .leftJoin(classes, eq(classes.id, teacherClassSubjects.classId))
        .leftJoin(instituteSubjects, eq(instituteSubjects.id, teacherClassSubjects.subjectId))
        .where(eq(teacherClassSubjects.teacherId, member[0].id));

      return rows;
    }),
});
