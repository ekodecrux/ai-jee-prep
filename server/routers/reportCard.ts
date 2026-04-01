import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";
import {
  instituteMembers, classes, classEnrollments, attendance,
  assignmentSubmissions, instituteAssignments, institutes, parentStudentLinks,
} from "../../drizzle/schema";

export const reportCardRouter = router({
  // Get report card data for the currently logged-in student
  getMyReportCard: protectedProcedure
    .input(z.object({
      month: z.string().optional(), // "2026-04" format; defaults to current month
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Find the student's institute membership
      const [member] = await db.select()
        .from(instituteMembers)
        .where(and(eq(instituteMembers.userId, ctx.user.id), eq(instituteMembers.role, "student")))
        .limit(1);

      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Not enrolled in any institute" });

      // Get institute info
      const [institute] = await db.select().from(institutes).where(eq(institutes.id, member.instituteId)).limit(1);

      // Get enrolled class
      const [enrollment] = await db.select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .where(eq(classEnrollments.studentId, member.id))
        .limit(1);

      let classInfo = null;
      if (enrollment) {
        const [cls] = await db.select({ id: classes.id, name: classes.name, grade: classes.grade }).from(classes).where(eq(classes.id, enrollment.classId)).limit(1);
        classInfo = cls;
      }

      // Determine date range
      const now = new Date();
      const monthStr = input.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const [year, mon] = monthStr.split("-").map(Number);
      const startDate = new Date(year, mon - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(year, mon, 0).toISOString().split("T")[0];

      // Attendance stats for this month
      let attendanceStats = { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
      if (enrollment) {
        const rows = await db.select({
          status: attendance.status,
          cnt: count(),
        })
          .from(attendance)
          .where(and(
            eq(attendance.studentId, member.id),
            eq(attendance.classId, enrollment.classId),
            gte(attendance.date, startDate),
            lte(attendance.date, endDate),
          ))
          .groupBy(attendance.status);

        for (const r of rows) {
          const n = Number(r.cnt);
          attendanceStats.total += n;
          if (r.status === "present") attendanceStats.present += n;
          else if (r.status === "absent") attendanceStats.absent += n;
          else if (r.status === "late") attendanceStats.late += n;
        }
        if (attendanceStats.total > 0) {
          attendanceStats.percentage = Math.round(
            ((attendanceStats.present + attendanceStats.late * 0.5) / attendanceStats.total) * 100
          );
        }
      }

      // Assignment grades
      const submissionRows = await db.select({
        assignmentId: assignmentSubmissions.assignmentId,
        grade: assignmentSubmissions.grade,
        feedback: assignmentSubmissions.feedback,
        submittedAt: assignmentSubmissions.submittedAt,
        title: instituteAssignments.title,
        maxMarks: instituteAssignments.maxMarks,
        subjectId: instituteAssignments.subjectId,
      })
        .from(assignmentSubmissions)
        .innerJoin(instituteAssignments, eq(instituteAssignments.id, assignmentSubmissions.assignmentId))
        .where(and(
          eq(assignmentSubmissions.studentId, member.id),
          gte(assignmentSubmissions.submittedAt, new Date(startDate)),
          lte(assignmentSubmissions.submittedAt, new Date(endDate + "T23:59:59")),
        ))
        .orderBy(assignmentSubmissions.submittedAt);

      const gradedSubmissions = submissionRows.filter(s => s.grade !== null);
      const avgGrade = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubmissions.length)
        : null;

      return {
        student: {
          name: ctx.user.name,
          email: ctx.user.email,
          memberId: member.id,
          role: member.role,
        },
        institute: {
          name: institute?.name ?? "Unknown Institute",
          code: institute?.code ?? "",
        },
        class: classInfo ? {
          name: classInfo.name,
          grade: classInfo.grade,
        } : null,
        month: monthStr,
        attendance: attendanceStats,
        assignments: {
          total: submissionRows.length,
          graded: gradedSubmissions.length,
          avgGrade,
          submissions: submissionRows.map(s => ({
            title: s.title,
            grade: s.grade,
            maxMarks: s.maxMarks,
            feedback: s.feedback,
            submittedAt: s.submittedAt,
          })),
        },
        generatedAt: new Date(),
      };
    }),

  // Get report card for a specific student (for Institute Admin or Teacher)
  getStudentReportCard: protectedProcedure
    .input(z.object({
      studentMemberId: z.number(),
      month: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify caller is admin or teacher in the same institute
      const [callerMember] = await db.select()
        .from(instituteMembers)
        .where(and(
          eq(instituteMembers.userId, ctx.user.id),
          sql`${instituteMembers.role} IN ('admin', 'teacher')`,
        ))
        .limit(1);

      if (!callerMember) throw new TRPCError({ code: "FORBIDDEN" });

      const [studentMember] = await db.select()
        .from(instituteMembers)
        .where(and(
          eq(instituteMembers.id, input.studentMemberId),
          eq(instituteMembers.instituteId, callerMember.instituteId),
        ))
        .limit(1);

      if (!studentMember) throw new TRPCError({ code: "NOT_FOUND" });

      // Get user info for name/email
      const { users } = await import("../../drizzle/schema");
      const [studentUser] = await db.select({ name: users.name, email: users.email })
        .from(users).where(eq(users.id, studentMember.userId)).limit(1);

      const [institute] = await db.select().from(institutes).where(eq(institutes.id, callerMember.instituteId)).limit(1);

      const [enrollment] = await db.select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .where(eq(classEnrollments.studentId, studentMember.id))
        .limit(1);

      let classInfo = null;
      if (enrollment) {
        const [cls] = await db.select({ id: classes.id, name: classes.name, grade: classes.grade }).from(classes).where(eq(classes.id, enrollment.classId)).limit(1);
        classInfo = cls;
      }

      const now = new Date();
      const monthStr = input.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const [year, mon] = monthStr.split("-").map(Number);
      const startDate = new Date(year, mon - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(year, mon, 0).toISOString().split("T")[0];

      let attendanceStats = { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
      if (enrollment) {
        const rows = await db.select({ status: attendance.status, cnt: count() })
          .from(attendance)
          .where(and(
            eq(attendance.studentId, studentMember.id),
            eq(attendance.classId, enrollment.classId),
            gte(attendance.date, startDate),
            lte(attendance.date, endDate),
          ))
          .groupBy(attendance.status);

        for (const r of rows) {
          const n = Number(r.cnt);
          attendanceStats.total += n;
          if (r.status === "present") attendanceStats.present += n;
          else if (r.status === "absent") attendanceStats.absent += n;
          else if (r.status === "late") attendanceStats.late += n;
        }
        if (attendanceStats.total > 0) {
          attendanceStats.percentage = Math.round(
            ((attendanceStats.present + attendanceStats.late * 0.5) / attendanceStats.total) * 100
          );
        }
      }

      const submissionRows = await db.select({
        assignmentId: assignmentSubmissions.assignmentId,
        grade: assignmentSubmissions.grade,
        feedback: assignmentSubmissions.feedback,
        submittedAt: assignmentSubmissions.submittedAt,
        title: instituteAssignments.title,
        maxMarks: instituteAssignments.maxMarks,
        subjectId: instituteAssignments.subjectId,
      })
        .from(assignmentSubmissions)
        .innerJoin(instituteAssignments, eq(instituteAssignments.id, assignmentSubmissions.assignmentId))
        .where(and(
          eq(assignmentSubmissions.studentId, studentMember.id),
          gte(assignmentSubmissions.submittedAt, new Date(startDate)),
          lte(assignmentSubmissions.submittedAt, new Date(endDate + "T23:59:59")),
        ));

      const gradedSubmissions = submissionRows.filter(s => s.grade !== null);
      const avgGrade = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubmissions.length)
        : null;

      return {
        student: {
          name: studentUser?.name ?? "Unknown",
          email: studentUser?.email ?? "",
          memberId: studentMember.id,
          role: studentMember.role,
        },
        institute: {
          name: institute?.name ?? "Unknown Institute",
          code: institute?.code ?? "",
        },
        class: classInfo ? { name: classInfo.name, grade: classInfo.grade } : null,
        month: monthStr,
        attendance: attendanceStats,
        assignments: {
          total: submissionRows.length,
          graded: gradedSubmissions.length,
          avgGrade,
          submissions: submissionRows.map(s => ({
            title: s.title,
            grade: s.grade,
            maxMarks: s.maxMarks,
            feedback: s.feedback,
            submittedAt: s.submittedAt,
          })),
        },
        generatedAt: new Date(),
      };
    }),

  // Parent can get their child's report card
  getChildReportCard: protectedProcedure
    .input(z.object({
      childMemberId: z.number(),
      month: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify the caller is a linked parent
      const [parentMember] = await db.select()
        .from(instituteMembers)
        .where(and(eq(instituteMembers.userId, ctx.user.id), eq(instituteMembers.role, "parent")))
        .limit(1);

      if (!parentMember) throw new TRPCError({ code: "FORBIDDEN" });

      const [link] = await db.select()
        .from(parentStudentLinks)
        .where(and(
          eq(parentStudentLinks.parentId, parentMember.id),
          eq(parentStudentLinks.studentId, input.childMemberId),
        ))
        .limit(1);

      if (!link) throw new TRPCError({ code: "FORBIDDEN", message: "Not linked to this student" });

      const [studentMember] = await db.select()
        .from(instituteMembers)
        .where(eq(instituteMembers.id, input.childMemberId))
        .limit(1);

      if (!studentMember) throw new TRPCError({ code: "NOT_FOUND" });

      // Get user info for name/email
      const { users } = await import("../../drizzle/schema");
      const [childUser] = await db.select({ name: users.name, email: users.email })
        .from(users).where(eq(users.id, studentMember.userId)).limit(1);

      const [institute] = await db.select().from(institutes).where(eq(institutes.id, studentMember.instituteId)).limit(1);

      const [enrollment] = await db.select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .where(eq(classEnrollments.studentId, studentMember.id))
        .limit(1);

      let classInfo = null;
      if (enrollment) {
        const [cls] = await db.select({ id: classes.id, name: classes.name, grade: classes.grade }).from(classes).where(eq(classes.id, enrollment.classId)).limit(1);
        classInfo = cls;
      }

      const now = new Date();
      const monthStr = input.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const [year, mon] = monthStr.split("-").map(Number);
      const startDate = new Date(year, mon - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(year, mon, 0).toISOString().split("T")[0];

      let attendanceStats = { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
      if (enrollment) {
        const rows = await db.select({ status: attendance.status, cnt: count() })
          .from(attendance)
          .where(and(
            eq(attendance.studentId, studentMember.id),
            eq(attendance.classId, enrollment.classId),
            gte(attendance.date, startDate),
            lte(attendance.date, endDate),
          ))
          .groupBy(attendance.status);

        for (const r of rows) {
          const n = Number(r.cnt);
          attendanceStats.total += n;
          if (r.status === "present") attendanceStats.present += n;
          else if (r.status === "absent") attendanceStats.absent += n;
          else if (r.status === "late") attendanceStats.late += n;
        }
        if (attendanceStats.total > 0) {
          attendanceStats.percentage = Math.round(
            ((attendanceStats.present + attendanceStats.late * 0.5) / attendanceStats.total) * 100
          );
        }
      }

      const submissionRows = await db.select({
        assignmentId: assignmentSubmissions.assignmentId,
        grade: assignmentSubmissions.grade,
        feedback: assignmentSubmissions.feedback,
        submittedAt: assignmentSubmissions.submittedAt,
        title: instituteAssignments.title,
        maxMarks: instituteAssignments.maxMarks,
        subjectId: instituteAssignments.subjectId,
      })
        .from(assignmentSubmissions)
        .innerJoin(instituteAssignments, eq(instituteAssignments.id, assignmentSubmissions.assignmentId))
        .where(and(
          eq(assignmentSubmissions.studentId, studentMember.id),
          gte(assignmentSubmissions.submittedAt, new Date(startDate)),
          lte(assignmentSubmissions.submittedAt, new Date(endDate + "T23:59:59")),
        ));

      const gradedSubmissions = submissionRows.filter(s => s.grade !== null);
      const avgGrade = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubmissions.length)
        : null;

      return {
        student: {
          name: childUser?.name ?? "Unknown",
          email: childUser?.email ?? "",
          memberId: studentMember.id,
          role: studentMember.role,
        },
        institute: {
          name: institute?.name ?? "Unknown Institute",
          code: institute?.code ?? "",
        },
        class: classInfo ? { name: classInfo.name, grade: classInfo.grade } : null,
        month: monthStr,
        attendance: attendanceStats,
        assignments: {
          total: submissionRows.length,
          graded: gradedSubmissions.length,
          avgGrade,
          submissions: submissionRows.map(s => ({
            title: s.title,
            grade: s.grade,
            maxMarks: s.maxMarks,
            feedback: s.feedback,
            submittedAt: s.submittedAt,
          })),
        },
        generatedAt: new Date(),
      };
    }),
});
