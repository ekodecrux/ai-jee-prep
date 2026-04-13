/**
 * ScorePredictionCard
 * Displays the AI-calculated JEE Main & Advanced predicted scores,
 * confidence band, rank estimate, and "improve X chapter → +Y marks" insight cards.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { RefreshCw, TrendingUp, Target, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  physics:     { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  chemistry:   { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  mathematics: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

function ScoreGauge({ score, max, label }: { score: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color =
    pct >= 70 ? "text-emerald-600" :
    pct >= 50 ? "text-amber-600" :
    "text-red-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-3xl font-black ${color}`}>{score}</div>
      <div className="text-xs text-muted-foreground">/ {max}</div>
      <div className="text-xs font-medium text-foreground">{label}</div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ScorePredictionCard() {
  const { data: prediction, isLoading, refetch } = trpc.scorePrediction.getMyPrediction.useQuery();
  const recalculate = trpc.scorePrediction.recalculate.useMutation({
    onSuccess: () => {
      toast.success("Score prediction updated!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-48" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-3">
        <Target className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="font-semibold text-foreground">Score Prediction Not Available</p>
        <p className="text-sm text-muted-foreground">Complete at least one chapter assessment to generate your predicted JEE score.</p>
        <Link href="/subject/physics">
          <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            Start First Assessment
          </button>
        </Link>
      </div>
    );
  }

  const mainScore = prediction.predictedScore ?? 0;
  const advancedScore = Math.round((mainScore / 300) * 360 * 0.85);
  const confidence = prediction.confidencePercent ?? 0;
  const rank = prediction.predictedRank;
  const subjectScores = (prediction.subjectScores as Record<string, { predicted: number; max: number; confidence: number }> | null) ?? {};
  const weakChapters = (prediction.weakChapters as Array<{ chapterId: string; title: string; subjectId: string; currentScore: number; potentialGain: number }> | null) ?? [];
  const recommendations = (prediction.recommendations as string[] | null) ?? [];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            JEE Score Prediction
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on {prediction.dataPointsUsed ?? 0} assessment data points · {confidence}% confidence
          </p>
        </div>
        <button
          onClick={() => recalculate.mutate()}
          disabled={recalculate.isPending}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="Recalculate"
        >
          <RefreshCw className={`w-4 h-4 ${recalculate.isPending ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main scores */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-xl">
        <ScoreGauge score={mainScore} max={300} label="JEE Main" />
        <ScoreGauge score={advancedScore} max={360} label="JEE Advanced" />
      </div>

      {/* Confidence band */}
      <div className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
        <span className="text-muted-foreground">Conservative</span>
        <span className="font-bold text-foreground">{prediction.conservativeScore ?? Math.round(mainScore * 0.85)}</span>
        <div className="flex-1 mx-3 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500 rounded-full" />
        </div>
        <span className="font-bold text-foreground">{prediction.optimisticScore ?? Math.round(mainScore * 1.15)}</span>
        <span className="text-muted-foreground">Optimistic</span>
      </div>

      {/* Rank estimate */}
      {rank && (
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Estimated rank:</span>
          <span className="font-bold text-foreground">~{rank.toLocaleString()}</span>
          {prediction.predictedRankRange && (
            <span className="text-xs text-muted-foreground">
              ({(prediction.predictedRankRange as { min: number; max: number }).min.toLocaleString()} – {(prediction.predictedRankRange as { min: number; max: number }).max.toLocaleString()})
            </span>
          )}
        </div>
      )}

      {/* Subject breakdown */}
      {Object.keys(subjectScores).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(subjectScores).map(([subjectId, scores]) => {
            const style = SUBJECT_COLORS[subjectId] ?? { bg: "bg-muted", text: "text-foreground", border: "border-border" };
            return (
              <div key={subjectId} className={`${style.bg} ${style.border} border rounded-lg p-2 text-center`}>
                <div className={`text-lg font-black ${style.text}`}>{scores.predicted}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{subjectId.slice(0, 4)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weak chapter insight cards */}
      {weakChapters.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Top Improvement Opportunities
          </p>
          {weakChapters.slice(0, 3).map((ch) => (
            <Link key={ch.chapterId} href={`/chapter/${ch.chapterId}`}>
              <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-900 truncate">{ch.title}</p>
                  <p className="text-[10px] text-amber-700 capitalize">{ch.subjectId} · {ch.currentScore}% now</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    +{ch.potentialGain}
                  </span>
                  <ChevronRight className="w-3 h-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* AI recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          {recommendations.slice(0, 2).map((rec, i) => (
            <p key={i} className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-primary font-medium">💡 </span>{rec}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
