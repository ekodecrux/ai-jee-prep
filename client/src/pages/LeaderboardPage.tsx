/**
 * Leaderboard Page
 * Shows platform-wide XP rankings with weekly and all-time views.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Zap, Flame, Crown, Medal, Award, Star } from "lucide-react";
import GamificationStats from "@/components/GamificationStats";

const RANK_ICONS = [
  <Crown className="w-5 h-5 text-yellow-500" />,
  <Medal className="w-5 h-5 text-slate-400" />,
  <Award className="w-5 h-5 text-amber-600" />,
];

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getLevelColor(level: number): string {
  if (level >= 10) return "text-purple-600 bg-purple-100";
  if (level >= 7) return "text-blue-600 bg-blue-100";
  if (level >= 5) return "text-green-600 bg-green-100";
  if (level >= 3) return "text-amber-600 bg-amber-100";
  return "text-slate-600 bg-slate-100";
}

export default function LeaderboardPage() {
  const [view, setView] = useState<"all_time" | "weekly">("all_time");

  const { data: leaderboard, isLoading } = trpc.gamification.getLeaderboard.useQuery({ limit: 50 });

  const entries = leaderboard?.entries ?? [];
  const myRank = leaderboard?.myRank;

  const sortedEntries = view === "weekly"
    ? [...entries].sort((a, b) => b.weeklyXp - a.weeklyXp).map((e, i) => ({ ...e, rank: i + 1 }))
    : entries;

  return (
    <div className="container py-8 max-w-3xl">
      {/* Gamification stats bar */}
      <GamificationStats />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top performers on ExamForge AI</p>
          </div>
        </div>
        {myRank && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Your Rank</p>
            <p className="text-2xl font-bold text-primary">#{myRank}</p>
          </div>
        )}
      </div>

      {/* View toggle */}
      <Tabs value={view} onValueChange={v => setView(v as "all_time" | "weekly")} className="mb-6">
        <TabsList>
          <TabsTrigger value="all_time" className="gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            All Time
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            This Week
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && entries.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No Rankings Yet</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to earn XP and claim the top spot!
          </p>
        </div>
      )}

      {/* Leaderboard entries */}
      {!isLoading && sortedEntries.length > 0 && (
        <div className="space-y-2">
          {sortedEntries.map((entry) => {
            const isMe = entry.isCurrentUser;
            const xpDisplay = view === "weekly" ? entry.weeklyXp : entry.totalXp;
            const badges: string[] = entry.badges ?? [];

            return (
              <Card
                key={entry.userId}
                className={`transition-all ${isMe ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted/30"}`}
              >
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    {entry.rank <= 3 ? (
                      RANK_ICONS[entry.rank - 1]
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {getInitials(entry.name)}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${isMe ? "text-primary" : "text-foreground"}`}>
                        {entry.name}
                        {isMe && <span className="ml-1 text-xs text-primary/70">(You)</span>}
                      </span>
                      {badges.slice(0, 2).map(slug => (
                        <Badge key={slug} variant="secondary" className="text-xs py-0 px-1.5">
                          {slug === "streak_7" ? "🔥" : slug === "level_10" ? "⚡" : "⭐"} {slug.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getLevelColor(entry.level)}`}>
                        Lv.{entry.level}
                      </span>
                      {view === "weekly" && entry.totalXp > 0 && (
                        <span className="text-xs text-muted-foreground">{entry.totalXp.toLocaleString()} total XP</span>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-foreground">{xpDisplay.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{view === "weekly" ? "this week" : "total XP"}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* XP Guide */}
      <Card className="mt-8 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            How to Earn XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { action: "Daily Login", xp: "+5 XP", icon: "🔑" },
              { action: "Complete Chapter", xp: "+20 XP", icon: "📖" },
              { action: "Pass Assessment", xp: "+30 XP", icon: "✅" },
              { action: "Perfect Score", xp: "+40 XP", icon: "💯" },
              { action: "3-Day Streak", xp: "+25 XP", icon: "🔥" },
              { action: "7-Day Streak", xp: "+50 XP", icon: "⚡" },
            ].map(item => (
              <div key={item.action} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-foreground font-medium text-xs">{item.action}</p>
                  <p className="text-primary font-bold text-xs">{item.xp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
