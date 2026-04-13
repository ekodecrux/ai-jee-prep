/**
 * GamificationStats
 * Compact stats bar shown at the top of the student/teacher dashboard.
 * Displays: streak flame, XP progress bar, level badge, recent badges.
 */
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, Trophy, Star, Award } from "lucide-react";

const BADGE_LABELS: Record<string, string> = {
  first_login: "First Login",
  streak_3: "3-Day Streak",
  streak_7: "Week Warrior",
  streak_30: "Month Master",
  level_5: "Level 5 Scholar",
  level_10: "Level 10 Expert",
  xp_500: "XP Pioneer",
  xp_1000: "XP Champion",
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_login: <Star className="w-3 h-3" />,
  streak_3: <Flame className="w-3 h-3" />,
  streak_7: <Flame className="w-3 h-3" />,
  streak_30: <Flame className="w-3 h-3" />,
  level_5: <Trophy className="w-3 h-3" />,
  level_10: <Trophy className="w-3 h-3" />,
  xp_500: <Zap className="w-3 h-3" />,
  xp_1000: <Zap className="w-3 h-3" />,
};

function xpToNextLevel(totalXp: number): { current: number; needed: number; percent: number } {
  const level = Math.floor(totalXp / 500) + 1;
  const xpInLevel = totalXp % 500;
  return { current: xpInLevel, needed: 500, percent: Math.round((xpInLevel / 500) * 100) };
}

export default function GamificationStats() {
  const { data: stats } = trpc.gamification.getMyStats.useQuery();

  if (!stats) return null;

  const { streak, xp } = stats;
  const progress = xpToNextLevel(xp.totalXp);
  const badges: string[] = xp.badges ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 px-4 bg-gradient-to-r from-primary/5 to-violet-500/5 rounded-xl border border-primary/10 mb-6">
      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${streak.currentStreak > 0 ? "bg-orange-100" : "bg-muted"}`}>
          <Flame className={`w-4 h-4 ${streak.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground leading-none">Streak</p>
          <p className="text-sm font-bold text-foreground leading-tight">
            {streak.currentStreak} <span className="font-normal text-muted-foreground text-xs">days</span>
          </p>
        </div>
      </div>

      <div className="w-px h-8 bg-border" />

      {/* Level + XP */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground leading-none">Level {xp.level}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress.current}/{progress.needed} XP</span>
          </div>
        </div>
      </div>

      <div className="w-px h-8 bg-border" />

      {/* Total XP */}
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground leading-none">Total XP</p>
          <p className="text-sm font-bold text-foreground leading-tight">{xp.totalXp.toLocaleString()}</p>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <>
          <div className="w-px h-8 bg-border hidden md:block" />
          <div className="hidden md:flex items-center gap-1.5 flex-wrap">
            <Award className="w-4 h-4 text-muted-foreground" />
            {badges.slice(0, 4).map(slug => (
              <Badge
                key={slug}
                variant="secondary"
                className="text-xs gap-1 py-0.5"
                title={BADGE_LABELS[slug] ?? slug}
              >
                {BADGE_ICONS[slug]}
                {BADGE_LABELS[slug] ?? slug}
              </Badge>
            ))}
            {badges.length > 4 && (
              <Badge variant="outline" className="text-xs">+{badges.length - 4} more</Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
}
