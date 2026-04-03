import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { authExtRouter } from "./routers/auth";
import { publicProcedure, router } from "./_core/trpc";
import { chaptersRouter } from "./routers/chapters";
import { contentRouter } from "./routers/content";
import { assessmentsRouter } from "./routers/assessments";
import { adminRouter } from "./routers/admin";
import { proctoringRouter } from "./routers/proctoring";
import { analyticsRouter } from "./routers/analytics";
import { lessonPlanRouter } from "./routers/lessonPlan";
import { notificationsRouter } from "./routers/notifications";
import { erpRouter, onlineClassesRouter, lessonPlansErpRouter, bridgeCoursesRouter, attendanceAlertsRouter, attendanceAlertsAdminRouter, bridgeCourseApprovalRouter } from "./routers/erp";
import { reportCardRouter } from "./routers/reportCard";
import { assignmentsRouter } from "./routers/assignments";
import { feesRouter } from "./routers/fees";
import { feePaymentsRouter } from "./routers/feePayments";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  chapters: chaptersRouter,
  content: contentRouter,
  assessments: assessmentsRouter,
  admin: adminRouter,
  proctoring: proctoringRouter,
  analytics: analyticsRouter,
  lessonPlan: lessonPlanRouter,
  notifications: notificationsRouter,
  authExt: authExtRouter,
  erp: erpRouter,
  onlineClasses: onlineClassesRouter,
  lessonPlansErp: lessonPlansErpRouter,
  bridgeCourses: bridgeCoursesRouter,
  attendanceAlerts: attendanceAlertsRouter,
  attendanceAlertsAdmin: attendanceAlertsAdminRouter,
  bridgeCourseApproval: bridgeCourseApprovalRouter,
  reportCard: reportCardRouter,
  assignments: assignmentsRouter,
  fees: feesRouter,
  feePayments: feePaymentsRouter,
});

export type AppRouter = typeof appRouter;
