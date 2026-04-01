/**
 * Nightly Low-Attendance Alert Job
 * Runs at 11 PM every night to:
 * 1. Check all students across all institutes for <75% monthly attendance
 * 2. Create lowAttendanceAlerts records for new violations
 * 3. Send email notifications to linked parents
 * 4. Send in-app notifications to Institute Admins
 */

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  institutes, instituteMembers, classes, classEnrollments,
  attendance, lowAttendanceAlerts, parentStudentLinks, users, notifications,
} from "../../drizzle/schema";
import { sendAttendanceAlertEmail } from "../email";

export interface AttendanceAlertResult {
  institutesChecked: number;
  studentsChecked: number;
  newAlerts: number;
  emailsSent: number;
  inAppNotifications: number;
}

async function createInAppNotification(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: number,
  title: string,
  message: string,
  urgency: "info" | "warning" | "critical"
) {
  if (!db) return;
  try {
    await (db as any).insert(notifications).values({
      userId,
      type: "attendance_alert",
      title,
      message,
      urgency,
      isRead: false,
    });
  } catch {
    // Silently ignore duplicate notifications
  }
}

/**
 * Calculate attendance percentage for a student in a class for a given month
 */
async function getAttendancePercent(
  db: Awaited<ReturnType<typeof getDb>>,
  studentId: number,
  classId: number,
  month: string // "YYYY-MM"
): Promise<number> {
  if (!db) return 100;
  const [year, mon] = month.split("-").map(Number);
  const startTs = new Date(year, mon - 1, 1).getTime();
  const endTs = new Date(year, mon, 0, 23, 59, 59).getTime();

  const records = await db.select({ status: attendance.status })
    .from(attendance)
    .where(and(
      eq(attendance.studentId, studentId),
      eq(attendance.classId, classId),
      sql`${attendance.date} >= ${startTs}`,
      sql`${attendance.date} <= ${endTs}`
    ));

  if (records.length === 0) return 100; // No records = not yet tracked
  const present = records.filter(r => r.status === "present" || r.status === "late").length;
  return Math.round((present / records.length) * 100);
}

/**
 * Main attendance alert check — runs for all active institutes
 */
export async function runAttendanceAlertJob(
  threshold = 75
): Promise<AttendanceAlertResult> {
  const db = await getDb();
  if (!db) {
    console.warn("[AttendanceAlertJob] Database unavailable, skipping");
    return { institutesChecked: 0, studentsChecked: 0, newAlerts: 0, emailsSent: 0, inAppNotifications: 0 };
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  console.log(`[AttendanceAlertJob] Running for month: ${month}, threshold: ${threshold}%`);

  let institutesChecked = 0;
  let studentsChecked = 0;
  let newAlerts = 0;
  let emailsSent = 0;
  let inAppNotifications = 0;

  // Get all active institutes
  const activeInstitutes = await db.select({ id: institutes.id, name: institutes.name })
    .from(institutes)
    .where(eq(institutes.isActive, true));

  for (const institute of activeInstitutes) {
    institutesChecked++;

    // Get all classes in this institute
    const instituteClasses = await db.select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.instituteId, institute.id));

    // Get institute admins for in-app notification
    const admins = await db.select({ userId: instituteMembers.userId })
      .from(instituteMembers)
      .where(and(
        eq(instituteMembers.instituteId, institute.id),
        eq(instituteMembers.role, "institute_admin"),
        eq(instituteMembers.isActive, true)
      ));

    for (const cls of instituteClasses) {
      // Get all enrolled students in this class
      const enrollments = await db.select({ studentId: classEnrollments.studentId })
        .from(classEnrollments)
        .where(eq(classEnrollments.classId, cls.id));

      for (const enrollment of enrollments) {
        studentsChecked++;
        const pct = await getAttendancePercent(db, enrollment.studentId, cls.id, month);

        if (pct < threshold) {
          // Check if alert already exists for this student/class/month
          const existing = await db.select({ id: lowAttendanceAlerts.id, notifiedParent: lowAttendanceAlerts.notifiedParent })
            .from(lowAttendanceAlerts)
            .where(and(
              eq(lowAttendanceAlerts.studentId, enrollment.studentId),
              eq(lowAttendanceAlerts.classId, cls.id),
              eq(lowAttendanceAlerts.month, month)
            ))
            .limit(1);

          let alertId: number;

          if (existing.length === 0) {
            // Create new alert
            const [inserted] = await db.insert(lowAttendanceAlerts).values({
              studentId: enrollment.studentId,
              classId: cls.id,
              instituteId: institute.id,
              month,
              attendancePercent: pct,
              notifiedAdmin: false,
              notifiedParent: false,
            }).$returningId();
            alertId = inserted.id;
            newAlerts++;
          } else {
            alertId = existing[0].id;
            if (existing[0].notifiedParent) continue; // Already notified
          }

          // Get student info
          const [student] = await db.select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, enrollment.studentId))
            .limit(1);

          const studentName = student?.name ?? "A student";
          const urgency: "info" | "warning" | "critical" = pct < 50 ? "critical" : pct < 65 ? "warning" : "info";

          // Send in-app notification to all institute admins
          for (const admin of admins) {
            await createInAppNotification(
              db,
              admin.userId,
              `Low Attendance Alert: ${studentName}`,
              `${studentName} has only ${pct}% attendance in ${cls.name} for ${month}. This is below the ${threshold}% threshold. Please follow up.`,
              urgency
            );
            inAppNotifications++;
          }

          // Send email to linked parents
          const parentLinks = await db.select({ parentId: parentStudentLinks.parentId })
            .from(parentStudentLinks)
            .where(eq(parentStudentLinks.studentId, enrollment.studentId));

          for (const link of parentLinks) {
            const [parent] = await db.select({ name: users.name, email: users.email })
              .from(users)
              .where(eq(users.id, link.parentId))
              .limit(1);

            if (parent?.email) {
              try {
                await sendAttendanceAlertEmail({
                  to: parent.email,
                  parentName: parent.name ?? "Parent",
                  studentName,
                  attendancePercent: pct,
                  month,
                });
                emailsSent++;
              } catch (err) {
                console.error(`[AttendanceAlertJob] Email failed for parent ${parent.email}:`, err);
              }
            }
          }

          // Mark alert as notified
          await db.update(lowAttendanceAlerts)
            .set({
              notifiedAdmin: true,
              notifiedParent: true,
              adminAlertSentAt: new Date(),
              parentAlertSentAt: new Date(),
            })
            .where(eq(lowAttendanceAlerts.id, alertId));
        }
      }
    }
  }

  console.log(
    `[AttendanceAlertJob] Done — institutes:${institutesChecked} students:${studentsChecked} ` +
    `newAlerts:${newAlerts} emails:${emailsSent} inApp:${inAppNotifications}`
  );

  return { institutesChecked, studentsChecked, newAlerts, emailsSent, inAppNotifications };
}

/**
 * Schedule the job to run nightly at 11 PM server time
 * Call this once from server startup
 */
export function scheduleAttendanceAlertJob() {
  // Run once at startup (with delay to avoid blocking startup)
  setTimeout(() => {
    runAttendanceAlertJob().catch(err =>
      console.error("[AttendanceAlertJob] Startup run failed:", err)
    );
  }, 30_000); // 30s after startup

  // Then schedule nightly at 11 PM (23:00)
  function scheduleNextRun() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(23, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1); // Tomorrow at 11 PM
    }
    const msUntilNext = next.getTime() - now.getTime();
    console.log(`[AttendanceAlertJob] Next run scheduled in ${Math.round(msUntilNext / 60000)} minutes`);
    setTimeout(() => {
      runAttendanceAlertJob().catch(err =>
        console.error("[AttendanceAlertJob] Nightly run failed:", err)
      );
      scheduleNextRun(); // Schedule next day
    }, msUntilNext);
  }

  scheduleNextRun();
}
