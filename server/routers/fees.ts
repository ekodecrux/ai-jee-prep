/**
 * Fees Router
 * - Institute Admin: create fee records, record payments, send reminders, generate reports
 * - Student/Parent: view own fee records
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import {
  users,
  instituteMembers,
  feeRecords,
  feePayments,
  classes,
  parentStudentLinks,
} from "../../drizzle/schema";
import nodemailer from "nodemailer";

// Email transport (same config as attendance alerts)
function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host, port,
    auth: { user, pass },
    secure: port === 465,
  });
}

export const feesRouter = router({
  // ─── Admin: Create fee record for a student ───────────────────────────────
  create: protectedProcedure
    .input(z.object({
      studentMemberId: z.number(),
      classId: z.number().optional(),
      feeType: z.string().min(1).max(64),
      description: z.string().max(256).optional(),
      amount: z.number().positive(),
      dueDate: z.string(), // ISO date string
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "institute_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only institute admins can create fee records" });
      }

      const [result] = await db.insert(feeRecords).values({
        instituteId: member[0].instituteId,
        studentId: input.studentMemberId,
        classId: input.classId ?? null,
        feeType: input.feeType,
        description: input.description ?? null,
        amount: input.amount,
        dueDate: new Date(input.dueDate),
        status: "pending",
        notes: input.notes ?? null,
      });

      return { id: Number(result.insertId), success: true };
    }),

  // ─── Admin: List all fee records for institute ────────────────────────────
  listAll: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "paid", "overdue", "waived", "all"]).default("all"),
      month: z.string().optional(), // YYYY-MM
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "institute_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const conditions: ReturnType<typeof eq>[] = [
        eq(feeRecords.instituteId, member[0].instituteId),
      ];
      if (input.status !== "all") {
        conditions.push(eq(feeRecords.status, input.status));
      }
      if (input.month) {
        const start = new Date(input.month + "-01");
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
        conditions.push(gte(feeRecords.dueDate, start));
        conditions.push(lte(feeRecords.dueDate, end));
      }

      const rows = await db.select({
        id: feeRecords.id,
        studentId: feeRecords.studentId,
        classId: feeRecords.classId,
        feeType: feeRecords.feeType,
        description: feeRecords.description,
        amount: feeRecords.amount,
        dueDate: feeRecords.dueDate,
        status: feeRecords.status,
        reminderSentAt: feeRecords.reminderSentAt,
        notes: feeRecords.notes,
        createdAt: feeRecords.createdAt,
        studentName: users.name,
        studentEmail: users.email,
        className: classes.name,
      })
        .from(feeRecords)
        .leftJoin(instituteMembers, eq(instituteMembers.id, feeRecords.studentId))
        .leftJoin(users, eq(users.id, instituteMembers.userId))
        .leftJoin(classes, eq(classes.id, feeRecords.classId))
        .where(and(...conditions))
        .orderBy(desc(feeRecords.dueDate));

      return rows;
    }),

  // ─── Admin: Record payment ────────────────────────────────────────────────
  recordPayment: protectedProcedure
    .input(z.object({
      feeRecordId: z.number(),
      amountPaid: z.number().positive(),
      paymentMode: z.string().max(64).optional(),
      transactionRef: z.string().max(128).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "institute_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const fee = await db.select().from(feeRecords)
        .where(and(
          eq(feeRecords.id, input.feeRecordId),
          eq(feeRecords.instituteId, member[0].instituteId),
        ))
        .limit(1);
      if (!fee[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const [result] = await db.insert(feePayments).values({
        feeRecordId: input.feeRecordId,
        instituteId: member[0].instituteId,
        studentId: fee[0].studentId,
        amountPaid: input.amountPaid,
        paymentDate: new Date(),
        paymentMode: input.paymentMode ?? null,
        transactionRef: input.transactionRef ?? null,
        recordedBy: member[0].id,
        notes: input.notes ?? null,
      });

      // Mark fee as paid
      await db.update(feeRecords)
        .set({ status: "paid" })
        .where(eq(feeRecords.id, input.feeRecordId));

      return { id: Number(result.insertId), success: true };
    }),

  // ─── Admin: Mark fee as overdue ───────────────────────────────────────────
  markOverdue: protectedProcedure
    .input(z.object({ feeRecordId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "institute_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.update(feeRecords)
        .set({ status: "overdue" })
        .where(and(
          eq(feeRecords.id, input.feeRecordId),
          eq(feeRecords.instituteId, member[0].instituteId),
        ));
      return { success: true };
    }),

  // ─── Admin: Send payment reminder to parent/student ──────────────────────
  sendReminder: protectedProcedure
    .input(z.object({ feeRecordId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "institute_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const fee = await db.select({
        id: feeRecords.id,
        amount: feeRecords.amount,
        dueDate: feeRecords.dueDate,
        feeType: feeRecords.feeType,
        description: feeRecords.description,
        studentId: feeRecords.studentId,
        studentName: users.name,
        studentEmail: users.email,
      })
        .from(feeRecords)
        .leftJoin(instituteMembers, eq(instituteMembers.id, feeRecords.studentId))
        .leftJoin(users, eq(users.id, instituteMembers.userId))
        .where(and(
          eq(feeRecords.id, input.feeRecordId),
          eq(feeRecords.instituteId, member[0].instituteId),
        ))
        .limit(1);
      if (!fee[0]) throw new TRPCError({ code: "NOT_FOUND" });

      // Find parent email
      const parentLinks = await db.select({
        parentEmail: users.email,
        parentName: users.name,
      })
        .from(parentStudentLinks)
        .leftJoin(instituteMembers, eq(instituteMembers.id, parentStudentLinks.parentId))
        .leftJoin(users, eq(users.id, instituteMembers.userId))
        .where(eq(parentStudentLinks.studentId, fee[0].studentId));

      const recipients: string[] = [];
      if (fee[0].studentEmail) recipients.push(fee[0].studentEmail);
      parentLinks.forEach(p => { if (p.parentEmail) recipients.push(p.parentEmail); });

      const transport = getTransport();
      if (transport && recipients.length > 0) {
        const dueStr = fee[0].dueDate ? new Date(fee[0].dueDate).toLocaleDateString("en-IN") : "N/A";
        await transport.sendMail({
          from: `"${process.env.SMTP_FROM_NAME ?? "ExamForge AI"}" <${process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER}>`,
          to: recipients.join(", "),
          subject: `Fee Payment Reminder — ₹${fee[0].amount} due by ${dueStr}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e3a5f;">Fee Payment Reminder</h2>
              <p>Dear ${fee[0].studentName ?? "Student"},</p>
              <p>This is a reminder that the following fee is due:</p>
              <table style="border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Fee Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${fee[0].feeType}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Description</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${fee[0].description ?? "-"}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${fee[0].amount}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${dueStr}</td></tr>
              </table>
              <p style="margin-top: 16px;">Please contact your institute admin to complete the payment.</p>
              <p style="color: #666; font-size: 12px;">— ExamForge AI Platform</p>
            </div>
          `,
        });
      }

      // Update reminder sent timestamp
      await db.update(feeRecords)
        .set({ reminderSentAt: new Date() })
        .where(eq(feeRecords.id, input.feeRecordId));

      return { success: true, emailsSent: recipients.length };
    }),

  // ─── Admin: Monthly collection report ────────────────────────────────────
  monthlyReport: protectedProcedure
    .input(z.object({ month: z.string() })) // YYYY-MM
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "institute_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const start = new Date(input.month + "-01");
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

      const records = await db.select({
        status: feeRecords.status,
        amount: feeRecords.amount,
        feeType: feeRecords.feeType,
      })
        .from(feeRecords)
        .where(and(
          eq(feeRecords.instituteId, member[0].instituteId),
          gte(feeRecords.dueDate, start),
          lte(feeRecords.dueDate, end),
        ));

      const totalDue = records.reduce((sum, r) => sum + r.amount, 0);
      const totalPaid = records.filter(r => r.status === "paid").reduce((sum, r) => sum + r.amount, 0);
      const totalPending = records.filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0);
      const totalOverdue = records.filter(r => r.status === "overdue").reduce((sum, r) => sum + r.amount, 0);

      const byType: Record<string, { count: number; amount: number }> = {};
      records.forEach(r => {
        if (!byType[r.feeType]) byType[r.feeType] = { count: 0, amount: 0 };
        byType[r.feeType].count++;
        byType[r.feeType].amount += r.amount;
      });

      return {
        month: input.month,
        totalRecords: records.length,
        totalDue,
        totalPaid,
        totalPending,
        totalOverdue,
        collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0,
        byType,
        breakdown: {
          paid: records.filter(r => r.status === "paid").length,
          pending: records.filter(r => r.status === "pending").length,
          overdue: records.filter(r => r.status === "overdue").length,
          waived: records.filter(r => r.status === "waived").length,
        },
      };
    }),

  // ─── Student/Parent: View own fee records ────────────────────────────────
  getMyFees: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0]) throw new TRPCError({ code: "UNAUTHORIZED" });

      let studentMemberId = member[0].id;

      // If parent, get child's member id
      if (member[0].role === "parent") {
        const link = await db.select().from(parentStudentLinks)
          .where(eq(parentStudentLinks.parentId, member[0].id))
          .limit(1);
        if (!link[0]) return [];
        studentMemberId = link[0].studentId;
      }

      const rows = await db.select({
        id: feeRecords.id,
        feeType: feeRecords.feeType,
        description: feeRecords.description,
        amount: feeRecords.amount,
        dueDate: feeRecords.dueDate,
        status: feeRecords.status,
        createdAt: feeRecords.createdAt,
      })
        .from(feeRecords)
        .where(eq(feeRecords.studentId, studentMemberId))
        .orderBy(desc(feeRecords.dueDate));

      return rows;
    }),

  // ─── Admin: Get payments for a fee record ────────────────────────────────
  getPayments: protectedProcedure
    .input(z.object({ feeRecordId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const member = await db.select().from(instituteMembers)
        .where(eq(instituteMembers.userId, ctx.user.id))
        .limit(1);
      if (!member[0] || member[0].role !== "institute_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const payments = await db.select({
        id: feePayments.id,
        amountPaid: feePayments.amountPaid,
        paymentDate: feePayments.paymentDate,
        paymentMode: feePayments.paymentMode,
        transactionRef: feePayments.transactionRef,
        notes: feePayments.notes,
        recordedByName: users.name,
      })
        .from(feePayments)
        .leftJoin(instituteMembers, eq(instituteMembers.id, feePayments.recordedBy))
        .leftJoin(users, eq(users.id, instituteMembers.userId))
        .where(and(
          eq(feePayments.feeRecordId, input.feeRecordId),
          eq(feePayments.instituteId, member[0].instituteId),
        ))
        .orderBy(desc(feePayments.paymentDate));

      return payments;
    }),
});
