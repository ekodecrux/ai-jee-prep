/**
 * ChapterHeatmapGrid
 * 80-chapter colour-coded grid showing mastery level per chapter.
 * Green ≥ 80% · Amber 60–79% · Red < 60% · Grey = unstarted
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

type ColorBand = "green" | "amber" | "red" | "unstarted";

const BAND_STYLES: Record<ColorBand, { bg: string; text: string; border: string; label: string }> = {
  green:     { bg: "bg-emerald-500",  text: "text-white",          border: "border-emerald-600", label: "Mastered" },
  amber:     { bg: "bg-amber-400",    text: "text-amber-900",      border: "border-amber-500",   label: "Needs Work" },
  red:       { bg: "bg-red-500",      text: "text-white",          border: "border-red-600",     label: "Weak" },
  unstarted: { bg: "bg-muted",        text: "text-muted-foreground", border: "border-border",    label: "Not Started" },
};

const TREND_ICONS: Record<string, string> = {
  improving: "↑",
  declining: "↓",
  stable: "→",
  new: "",
};

const SUBJECT_FILTERS = ["All", "physics", "chemistry", "mathematics"];

export default function ChapterHeatmapGrid() {
  const { data, isLoading, refetch } = trpc.heatmap.getMyHeatmap.useQuery();
  const [filter, setFilter] = useState("All");
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded-lg animate-pulse w-48" />
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { chapters, summary } = data;
  const filtered = filter === "All" ? chapters : chapters.filter(c => c.subjectId === filter);

  // Group by subject for section headers
  type ChapterEntry = typeof chapters[number];
  const grouped: Record<string, ChapterEntry[]> = {};
  filtered.forEach((ch: ChapterEntry) => {
    if (!grouped[ch.subjectId]) grouped[ch.subjectId] = [];
    grouped[ch.subjectId].push(ch);
  });

  const hovered = hoveredChapter ? chapters.find(c => c.chapterId === hoveredChapter) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Chapter Performance Heatmap</h3>
          <p className="text-sm text-muted-foreground">
            {summary.green} mastered · {summary.amber} in progress · {summary.red} weak · {summary.unstarted} not started
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          {(["green", "amber", "red", "unstarted"] as ColorBand[]).map(band => (
            <span key={band} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-sm ${BAND_STYLES[band].bg}`} />
              <span className="text-muted-foreground">{BAND_STYLES[band].label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Mastery</span>
          <span className="font-semibold text-foreground">{summary.overallScore}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(summary.green / summary.total) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${(summary.amber / summary.total) * 100}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${(summary.red / summary.total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{summary.green}/{summary.total} chapters green</span>
          <span>Target: all green by Month 24</span>
        </div>
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 flex-wrap">
        {SUBJECT_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "All" ? "All Subjects" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Heatmap grid — grouped by subject */}
      {Object.entries(grouped).map(([subjectId, subjectChapters]) => (
        <div key={subjectId} className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {subjectId.charAt(0).toUpperCase() + subjectId.slice(1)}
            <span className="ml-2 text-xs font-normal normal-case">
              ({subjectChapters.filter((c: ChapterEntry) => c.colorBand === "green").length}/{subjectChapters.length} mastered)
            </span>
          </h4>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
            {subjectChapters.map((ch: ChapterEntry) => {
              const style = BAND_STYLES[ch.colorBand as ColorBand];
              const trend = TREND_ICONS[ch.trendDirection] || "";
              const isHovered = hoveredChapter === ch.chapterId;
              return (
                <Link key={ch.chapterId} href={`/chapter/${ch.chapterId}`}>
                  <div
                    className={`
                      relative h-10 rounded-lg border cursor-pointer transition-all duration-150
                      ${style.bg} ${style.border}
                      ${isHovered ? "scale-110 shadow-lg z-10" : "hover:scale-105 hover:shadow-md"}
                    `}
                    onMouseEnter={() => setHoveredChapter(ch.chapterId)}
                    onMouseLeave={() => setHoveredChapter(null)}
                    title={`${ch.title}\n${ch.heatmapScore}% · ${ch.attemptsCount} attempts`}
                  >
                    {/* Score label */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center ${style.text}`}>
                      <span className="text-[10px] font-bold leading-none">
                        {ch.colorBand === "unstarted" ? "—" : `${Math.round(ch.heatmapScore)}%`}
                      </span>
                      {trend && (
                        <span className="text-[8px] leading-none opacity-80">{trend}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Hover tooltip */}
      {hovered && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-popover border border-border rounded-xl shadow-xl px-4 py-3 text-sm pointer-events-none max-w-xs text-center">
          <p className="font-semibold text-foreground">{hovered.title}</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {hovered.subjectName} · {hovered.curriculumId === "ncert_11" ? "Class 11" : "Class 12"}
          </p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BAND_STYLES[hovered.colorBand as ColorBand].bg} ${BAND_STYLES[hovered.colorBand as ColorBand].text}`}>
              {BAND_STYLES[hovered.colorBand as ColorBand].label}
            </span>
            <span className="text-foreground font-bold">{Math.round(hovered.heatmapScore)}%</span>
            <span className="text-muted-foreground">{hovered.attemptsCount} attempts</span>
          </div>
        </div>
      )}
    </div>
  );
}
