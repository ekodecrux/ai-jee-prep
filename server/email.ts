import nodemailer from "nodemailer";

// ─── Transporter ─────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // TLS via STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = `"${process.env.SMTP_FROM_NAME || "AITutor"}" <${process.env.SMTP_FROM_EMAIL || "ekodecrux@gmail.com"}>`;

// ─── Email Templates ──────────────────────────────────────────────────────────
function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', Arial, sans-serif; color: #e2e8f0; }
    .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: #c4b5fd; font-size: 14px; }
    .body { padding: 40px; }
    .body p { line-height: 1.7; color: #94a3b8; margin: 0 0 16px; }
    .body strong { color: #e2e8f0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0; }
    .info-box { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-box p { margin: 6px 0; font-size: 14px; }
    .badge { display: inline-block; background: #4f46e5; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background: #0f172a; padding: 24px 40px; text-align: center; border-top: 1px solid #1e293b; }
    .footer p { margin: 0; font-size: 12px; color: #475569; }
    .footer a { color: #6366f1; text-decoration: none; }
    .divider { height: 1px; background: #334155; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 AITutor</h1>
      <p>Universal Knowledge Platform — JEE Master Prep</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>© 2025 AITutor — Universal Knowledge Platform &nbsp;|&nbsp; <a href="#">Unsubscribe</a></p>
      <p style="margin-top:6px;">This email was sent by AITutor on behalf of your institute.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send Functions ───────────────────────────────────────────────────────────

export async function sendInviteEmail(opts: {
  to: string;
  role: string;
  instituteName: string | null;
  inviteUrl: string;
  inviterName: string;
}) {
  const roleLabel = opts.role.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
  const body = `
    <p>Hello,</p>
    <p>You have been invited to join <strong>AITutor — JEE Master Prep</strong>${opts.instituteName ? ` as part of <strong>${opts.instituteName}</strong>` : ""} as a <span class="badge">${roleLabel}</span>.</p>
    <p>Invited by: <strong>${opts.inviterName}</strong></p>
    <div class="info-box">
      <p>✅ Access all 80 JEE chapters across Physics, Chemistry & Mathematics</p>
      <p>🤖 Learn with <strong>Priya</strong>, your AI avatar tutor</p>
      <p>📊 Track your progress with real-time heatmaps & score predictions</p>
      <p>🎯 Practice with 10 years of JEE Main & Advanced past questions</p>
    </div>
    <p>Click the button below to accept your invitation and set up your account:</p>
    <p style="text-align:center;"><a href="${opts.inviteUrl}" class="btn">Accept Invitation →</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#64748b;">This invitation link expires in 7 days. If you did not expect this email, you can safely ignore it.</p>
  `;
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `You're invited to AITutor as ${roleLabel}${opts.instituteName ? ` — ${opts.instituteName}` : ""}`,
    html: baseTemplate("Invitation to AITutor", body),
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  role: string;
  dashboardUrl: string;
}) {
  const roleLabel = opts.role.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
  const body = `
    <p>Welcome, <strong>${opts.name}</strong>! 🎉</p>
    <p>Your <span class="badge">${roleLabel}</span> account on <strong>AITutor</strong> is now active and ready to use.</p>
    <div class="info-box">
      <p>🗺️ <strong>Your 20-month JEE roadmap</strong> is ready — follow it from Class 11 to JEE day</p>
      <p>🤖 <strong>Priya, your AI tutor</strong>, will narrate every chapter and answer your doubts</p>
      <p>📈 <strong>Performance heatmap</strong> tracks all 80 chapters in real-time</p>
      <p>🔒 <strong>Proctored mock tests</strong> unlock as you progress — just like the real JEE</p>
    </div>
    <p style="text-align:center;"><a href="${opts.dashboardUrl}" class="btn">Go to My Dashboard →</a></p>
  `;
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Welcome to AITutor, ${opts.name}! Your JEE journey starts now 🚀`,
    html: baseTemplate("Welcome to AITutor", body),
  });
}

export async function sendOverdueNotification(opts: {
  to: string;
  name: string;
  overdueItems: Array<{ type: string; title: string; dueDate: string }>;
  dashboardUrl: string;
}) {
  const itemsHtml = opts.overdueItems.map(item =>
    `<p>⚠️ <strong>${item.type}:</strong> ${item.title} — was due on ${item.dueDate}</p>`
  ).join("");
  const body = `
    <p>Hi <strong>${opts.name}</strong>,</p>
    <p>You have <strong>${opts.overdueItems.length} overdue item${opts.overdueItems.length > 1 ? "s" : ""}</strong> on your JEE study plan. Staying on track is critical to reaching your target score!</p>
    <div class="info-box">
      ${itemsHtml}
    </div>
    <p>Your AI tutor <strong>Priya</strong> is ready to help you catch up. Even 30 minutes today will keep you on track.</p>
    <p style="text-align:center;"><a href="${opts.dashboardUrl}" class="btn">Resume My Study Plan →</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#64748b;">Remember: Students who complete 80% of their study plan score 80%+ in JEE mock tests.</p>
  `;
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `⚠️ ${opts.overdueItems.length} overdue item${opts.overdueItems.length > 1 ? "s" : ""} on your JEE plan — AITutor`,
    html: baseTemplate("Overdue Study Plan Alert", body),
  });
}

export async function sendMockTestUnlockEmail(opts: {
  to: string;
  name: string;
  testName: string;
  testDate: string;
  testUrl: string;
}) {
  const body = `
    <p>Great news, <strong>${opts.name}</strong>! 🎯</p>
    <p>You've unlocked a new mock test:</p>
    <div class="info-box">
      <p>📝 <strong>${opts.testName}</strong></p>
      <p>📅 Scheduled for: <strong>${opts.testDate}</strong></p>
      <p>⏱️ Duration: 3 hours (JEE pattern)</p>
      <p>🔒 Proctored with webcam monitoring</p>
    </div>
    <p>This is your chance to simulate the real JEE experience. Make sure you're in a quiet room with stable internet and your webcam ready.</p>
    <p style="text-align:center;"><a href="${opts.testUrl}" class="btn">Take Mock Test Now →</a></p>
  `;
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `🎯 Mock Test Unlocked: ${opts.testName} — AITutor`,
    html: baseTemplate("Mock Test Unlocked!", body),
  });
}

export async function sendWeeklyReport(opts: {
  to: string;
  name: string;
  weekNumber: number;
  lessonsCompleted: number;
  avgScore: number;
  greenChapters: number;
  predictedScore: number;
  dashboardUrl: string;
}) {
  const scoreColor = opts.avgScore >= 80 ? "#10b981" : opts.avgScore >= 60 ? "#f59e0b" : "#ef4444";
  const body = `
    <p>Hi <strong>${opts.name}</strong>, here's your weekly JEE progress report 📊</p>
    <div class="info-box">
      <p>📅 <strong>Week ${opts.weekNumber}</strong> Summary</p>
      <p>✅ Lessons completed: <strong>${opts.lessonsCompleted}</strong></p>
      <p>📊 Average assessment score: <strong style="color:${scoreColor}">${opts.avgScore}%</strong></p>
      <p>🟢 Green chapters (≥80%): <strong>${opts.greenChapters} / 80</strong></p>
      <p>🎯 Predicted JEE Main score: <strong>${opts.predictedScore} / 300</strong></p>
    </div>
    <p>${opts.avgScore >= 80
      ? "Excellent work! You're on track to be a JEE topper. Keep this momentum going! 🚀"
      : opts.avgScore >= 60
        ? "Good progress! Focus on your amber chapters this week to push them to green."
        : "You need to pick up the pace. Your AI tutor Priya is ready to help — start with your weakest chapter today."
    }</p>
    <p style="text-align:center;"><a href="${opts.dashboardUrl}" class="btn">View Full Dashboard →</a></p>
  `;
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `📊 Week ${opts.weekNumber} JEE Progress Report — AITutor`,
    html: baseTemplate("Weekly Progress Report", body),
  });
}

// ─── SMTP Connection Test ─────────────────────────────────────────────────────
export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "SMTP connection failed" };
  }
}

// ─── Attendance Alert Email ───────────────────────────────────────────────────
export async function sendAttendanceAlertEmail(opts: {
  to: string;
  parentName: string;
  studentName: string;
  attendancePercent: number;
  month: string;
}) {
  const [year, month] = opts.month.split("-");
  const monthLabel = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const urgency = opts.attendancePercent < 50 ? "🔴 Critical" : opts.attendancePercent < 65 ? "🟠 Warning" : "🟡 Low";
  const body = `
    <p>Dear <strong>${opts.parentName}</strong>,</p>
    <p>This is an automated attendance alert from your child's institute regarding <strong>${opts.studentName}</strong>.</p>
    <div class="info-box">
      <p>${urgency} Attendance Alert — ${monthLabel}</p>
      <p>📊 Current Attendance: <strong>${opts.attendancePercent}%</strong></p>
      <p>⚠️ Minimum Required: <strong>75%</strong></p>
      <p>📉 Shortfall: <strong>${Math.max(0, 75 - opts.attendancePercent).toFixed(1)}%</strong> below threshold</p>
    </div>
    <p>Low attendance can significantly impact your child's academic performance and eligibility for exams. We strongly recommend:</p>
    <div class="info-box">
      <p>✅ Ensure regular attendance going forward</p>
      <p>📞 Contact the institute admin if there are medical or personal reasons</p>
      <p>📚 Review missed lesson plans and assignments on the parent portal</p>
    </div>
    <p>Please log in to the parent portal to view your child's full attendance record and lesson plans.</p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#64748b;">This is an automated alert. Please contact your institute admin for any queries.</p>
  `;
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `⚠️ Attendance Alert: ${opts.studentName} — ${monthLabel} (${opts.attendancePercent}%)`,
    html: baseTemplate("Attendance Alert", body),
  });
}

export async function sendInstituteWelcomeWithInvitesEmail(opts: {
  to: string;
  adminName: string;
  instituteName: string;
  dashboardUrl: string;
  inviteLinks: Array<{ role: string; url: string; token: string }>;
}) {
  const inviteRows = opts.inviteLinks.map(link => {
    const roleLabel = link.role.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
    return `
      <tr>
        <td style="padding:10px 0;color:#e2e8f0;font-weight:600;">${roleLabel}</td>
        <td style="padding:10px 0;">
          <a href="${link.url}" style="color:#818cf8;word-break:break-all;font-size:13px;">${link.url}</a>
        </td>
      </tr>`;
  }).join("");

  const body = `
    <p>Congratulations, <strong>${opts.adminName}</strong>! 🎉</p>
    <p>Your institute <strong>${opts.instituteName}</strong> has been successfully registered on <strong>ExamForge AI</strong>. You are now the Institute Administrator.</p>
    <div class="info-box">
      <p>🏫 <strong>Institute:</strong> ${opts.instituteName}</p>
      <p>👤 <strong>Your role:</strong> Institute Administrator</p>
      <p>📋 <strong>Status:</strong> Trial plan (up to 100 students, 10 teachers)</p>
    </div>
    <p><strong>Invite your team</strong> using the links below — share each link with the appropriate group:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="border-bottom:1px solid #334155;">
          <th style="text-align:left;padding:8px 0;color:#94a3b8;font-size:13px;">Role</th>
          <th style="text-align:left;padding:8px 0;color:#94a3b8;font-size:13px;">Invite Link (expires in 30 days)</th>
        </tr>
      </thead>
      <tbody>${inviteRows}</tbody>
    </table>
    <p style="font-size:13px;color:#64748b;">Each link can be used multiple times until it expires. Share the Teacher link with your faculty, the Student link with your students, and the Parent link with parents.</p>
    <div class="divider"></div>
    <p style="text-align:center;"><a href="${opts.dashboardUrl}" class="btn">Go to Institute Dashboard →</a></p>
  `;
  const transporter = createTransporter();
  return await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `🎓 ${opts.instituteName} is live on ExamForge AI — Your invite links are ready`,
    html: baseTemplate(`Welcome, ${opts.instituteName}!`, body),
  });
}
