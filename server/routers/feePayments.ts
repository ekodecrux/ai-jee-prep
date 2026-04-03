/**
 * Fee Payments Router — Stripe-powered fee collection
 *
 * Parent pays fees online via Stripe Checkout.
 * Institute Admin sees payment status auto-updated via webhook.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { feeRecords, feePayments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export const feePaymentsRouter = router({
  // ── Create Stripe Checkout Session for a fee record ────────────────────────
  createCheckoutSession: protectedProcedure
    .input(z.object({
      feeRecordId: z.number(),
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Fetch the fee record
      const [record] = await db
        .select()
        .from(feeRecords)
        .where(eq(feeRecords.id, input.feeRecordId))
        .limit(1);

      if (!record) throw new Error("Fee record not found");
      if (record.status === "paid") throw new Error("This fee has already been paid");

      const amountInPaise = Math.round(record.amount * 100); // Stripe uses smallest currency unit

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: ctx.user.email || undefined,
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: `${record.feeType.replace(/_/g, " ")} Fee`,
                description: record.description || "Institute Fee",
              },
              unit_amount: amountInPaise,
            },
            quantity: 1,
          },
        ],
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          fee_record_id: input.feeRecordId.toString(),
          user_id: ctx.user.id.toString(),
          student_id: record.studentId.toString(),
          institute_id: record.instituteId.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        allow_promotion_codes: true,
        success_url: `${input.origin}/parent?tab=fees&payment=success`,
        cancel_url: `${input.origin}/parent?tab=fees&payment=cancelled`,
      });

      return { checkoutUrl: session.url };
    }),

  // ── Get payment history for a student's fee records ────────────────────────
  getPaymentHistory: protectedProcedure
    .input(z.object({
      studentId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const payments = await db
        .select()
        .from(feePayments)
        .where(eq(feePayments.studentId, input.studentId))
        .orderBy(feePayments.paymentDate);

      return payments;
    }),

  // ── Get fee records for a student (parent view) ────────────────────────────
  getMyChildFees: protectedProcedure
    .input(z.object({
      studentId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const records = await db
        .select()
        .from(feeRecords)
        .where(eq(feeRecords.studentId, input.studentId))
        .orderBy(feeRecords.dueDate);

      return records;
    }),
});
