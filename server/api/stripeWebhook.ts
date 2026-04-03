/**
 * Stripe Webhook Handler
 * Route: POST /api/stripe/webhook
 * Must be registered BEFORE express.json() middleware
 */
import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { feeRecords, feePayments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const feeRecordId = session.metadata?.fee_record_id;
      const studentId = session.metadata?.student_id;
      const instituteId = session.metadata?.institute_id;

      if (feeRecordId && session.payment_status === "paid") {
        const db = await getDb();
        if (db) {
          // Update fee record status to paid
          await db
            .update(feeRecords)
            .set({ status: "paid", updatedAt: new Date() })
            .where(eq(feeRecords.id, Number(feeRecordId)));

          // Record the payment
          const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
          await db.insert(feePayments).values({
            feeRecordId: Number(feeRecordId),
            instituteId: Number(instituteId || 0),
            studentId: Number(studentId || 0),
            amountPaid: amountTotal,
            paymentDate: new Date(),
            paymentMode: "stripe",
            transactionRef: session.payment_intent as string || session.id,
            notes: `Stripe Checkout: ${session.id}`,
          });

          console.log(`[Stripe Webhook] Fee record ${feeRecordId} marked as paid (₹${amountTotal})`);
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment failed for intent: ${intent.id}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  return res.json({ received: true });
}
