/**
 * ReportCard Component
 * Renders a student report card with attendance, assignment grades, and PDF download.
 * Used in Student Dashboard and Parent Portal.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  FileText, Download, GraduationCap, BookOpen, CheckCircle2, AlertCircle,
  Calendar, BarChart3, User, Building2, Loader2
} from "lucide-react";

// ─── PDF Generation (client-side via jsPDF) ───────────────────────────────────
async function downloadReportCardPDF(data: ReportCardData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 20;
  let y = 20;

  // Header
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageW, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ExamForge AI", margin, 14);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Student Report Card", margin, 22);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString("en-IN")}`, margin, 30);

  y = 45;
  doc.setTextColor(30, 30, 30);

  // Student info section
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, pageW - 2 * margin, 30, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.student.name ?? "Student", margin + 4, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Email: ${data.student.email ?? "—"}`, margin + 4, y + 15);
  doc.text(`Institute: ${data.institute.name}`, margin + 4, y + 21);
  if (data.class) {
    doc.text(`Class: ${data.class.name}${data.class.grade ? ` (Grade ${data.class.grade})` : ""}`, margin + 4, y + 27);
  }
  doc.setFont("helvetica", "bold");
  doc.text(`Month: ${data.month}`, pageW - margin - 40, y + 8);

  y += 38;

  // Attendance section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("Attendance Summary", margin, y);
  y += 6;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);

  const attPct = data.attendance.percentage;
  const attColor = attPct >= 75 ? [22, 163, 74] : attPct >= 60 ? [234, 179, 8] : [220, 38, 38];
  doc.setTextColor(...attColor as [number, number, number]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${attPct}%`, margin, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Overall Attendance", margin + 18, y + 5);
  doc.text(`Present: ${data.attendance.present} days`, margin + 18, y + 10);
  doc.text(`Absent: ${data.attendance.absent} days`, margin + 60, y + 10);
  doc.text(`Late: ${data.attendance.late} days`, margin + 100, y + 10);
  doc.text(`Total: ${data.attendance.total} days`, margin + 140, y + 10);

  y += 20;

  // Assignments section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("Assignment Performance", margin, y);
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Total Submitted: ${data.assignments.total}`, margin, y);
  doc.text(`Graded: ${data.assignments.graded}`, margin + 60, y);
  if (data.assignments.avgGrade !== null) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text(`Average Grade: ${data.assignments.avgGrade}%`, margin + 120, y);
  }
  y += 10;

  if (data.assignments.submissions.length > 0) {
    // Table header
    doc.setFillColor(230, 235, 245);
    doc.rect(margin, y, pageW - 2 * margin, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 95);
    doc.text("Assignment Title", margin + 2, y + 5);
    doc.text("Grade", margin + 110, y + 5);
    doc.text("Max", margin + 130, y + 5);
    doc.text("Score %", margin + 148, y + 5);
    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const sub of data.assignments.submissions) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setTextColor(50, 50, 50);
      const title = sub.title && sub.title.length > 50 ? sub.title.substring(0, 47) + "..." : (sub.title ?? "—");
      doc.text(title, margin + 2, y + 4);
      if (sub.grade !== null && sub.grade !== undefined) {
        doc.text(String(sub.grade), margin + 110, y + 4);
        doc.text(String(sub.maxMarks ?? "—"), margin + 130, y + 4);
        const pct = sub.maxMarks ? Math.round((sub.grade / sub.maxMarks) * 100) : null;
        if (pct !== null) {
          const pctColor = pct >= 75 ? [22, 163, 74] : pct >= 50 ? [234, 179, 8] : [220, 38, 38];
          doc.setTextColor(...pctColor as [number, number, number]);
          doc.text(`${pct}%`, margin + 148, y + 4);
          doc.setTextColor(50, 50, 50);
        }
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Pending", margin + 110, y + 4);
        doc.setTextColor(50, 50, 50);
      }
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y + 7, pageW - margin, y + 7);
      y += 8;
    }
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`ExamForge AI — Confidential Report Card — Page ${i} of ${totalPages}`, margin, 290);
  }

  const filename = `ReportCard_${data.student.name?.replace(/\s+/g, "_") ?? "Student"}_${data.month}.pdf`;
  doc.save(filename);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportCardData {
  student: { name: string | null; email: string | null; memberId: number; role: string };
  institute: { name: string; code: string | null };
  class: { name: string; grade: string | null } | null;
  month: string;
  attendance: { present: number; absent: number; late: number; total: number; percentage: number };
  assignments: {
    total: number;
    graded: number;
    avgGrade: number | null;
    submissions: { title: string | null; grade: number | null; maxMarks: number | null; feedback: string | null; submittedAt: Date | null }[];
  };
  generatedAt: Date;
}

// ─── Month options ────────────────────────────────────────────────────────────
function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
    opts.push({ val, label });
  }
  return opts;
}

// ─── Main ReportCard component ────────────────────────────────────────────────
interface ReportCardProps {
  mode: "student" | "parent";
  childMemberId?: number; // required for parent mode
}

export default function ReportCard({ mode, childMemberId }: ReportCardProps) {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].val);
  const [downloading, setDownloading] = useState(false);

  const studentQuery = trpc.reportCard.getMyReportCard.useQuery(
    { month: selectedMonth },
    { enabled: mode === "student" }
  );

  const parentQuery = trpc.reportCard.getChildReportCard.useQuery(
    { childMemberId: childMemberId!, month: selectedMonth },
    { enabled: mode === "parent" && childMemberId !== undefined }
  );

  const query = mode === "student" ? studentQuery : parentQuery;
  const data = query.data as ReportCardData | undefined;
  const isLoading = query.isLoading;
  const error = query.error;

  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      await downloadReportCardPDF(data);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Report Card
          </h2>
          <p className="text-sm text-muted-foreground">Monthly academic performance summary</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => (
                <SelectItem key={o.val} value={o.val}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleDownload}
            disabled={!data || downloading}
            className="gap-2"
            variant="outline"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-400" />
          <p className="font-medium">
            {error.message.includes("Not enrolled") ? "Not enrolled in any institute yet" : "Report card unavailable"}
          </p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Report Card Content */}
      {data && !isLoading && (
        <div className="space-y-5">
          {/* Student Info */}
          <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {(data.student.name ?? "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{data.student.name ?? "Student"}</h3>
                    <p className="text-sm text-gray-500">{data.student.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs text-gray-600">{data.institute.name}</span>
                      {data.class && (
                        <>
                          <span className="text-gray-300">·</span>
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs text-gray-600">{data.class.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-indigo-700 border-indigo-300">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(data.month + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" })}
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1">
                    Generated: {new Date(data.generatedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${
                    data.attendance.percentage >= 75 ? "text-green-600" :
                    data.attendance.percentage >= 60 ? "text-amber-500" : "text-red-500"
                  }`}>
                    {data.attendance.percentage}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Overall</p>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-3">
                  {[
                    { label: "Present", value: data.attendance.present, color: "text-green-600 bg-green-50" },
                    { label: "Absent", value: data.attendance.absent, color: "text-red-500 bg-red-50" },
                    { label: "Late", value: data.attendance.late, color: "text-amber-500 bg-amber-50" },
                    { label: "Total Days", value: data.attendance.total, color: "text-gray-700 bg-gray-50" },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Attendance Rate</span>
                  <span className={data.attendance.percentage >= 75 ? "text-green-600" : "text-red-500"}>
                    {data.attendance.percentage >= 75 ? "Good Standing" : "Below Minimum (75%)"}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.attendance.percentage >= 75 ? "bg-green-500" :
                      data.attendance.percentage >= 60 ? "bg-amber-400" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(data.attendance.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Assignment Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{data.assignments.total}</div>
                  <div className="text-xs text-blue-600 mt-0.5">Submitted</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{data.assignments.graded}</div>
                  <div className="text-xs text-purple-600 mt-0.5">Graded</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-700">
                    {data.assignments.avgGrade !== null ? `${data.assignments.avgGrade}%` : "—"}
                  </div>
                  <div className="text-xs text-indigo-600 mt-0.5">Avg Grade</div>
                </div>
              </div>

              {data.assignments.submissions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Individual Assignments</p>
                  {data.assignments.submissions.map((sub, i) => {
                    const pct = sub.grade !== null && sub.maxMarks ? Math.round((sub.grade / sub.maxMarks) * 100) : null;
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{sub.title ?? "Assignment"}</p>
                          {sub.feedback && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Feedback: {sub.feedback}</p>
                          )}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          {sub.grade !== null ? (
                            <div>
                              <span className={`font-bold text-sm ${
                                pct !== null && pct >= 75 ? "text-green-600" :
                                pct !== null && pct >= 50 ? "text-amber-500" : "text-red-500"
                              }`}>
                                {sub.grade}/{sub.maxMarks}
                              </span>
                              {pct !== null && (
                                <span className="text-xs text-muted-foreground ml-1">({pct}%)</span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Pending</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No assignments submitted this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
