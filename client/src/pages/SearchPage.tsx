import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Atom, FlaskConical, Calculator, Search, BookOpen, ChevronRight, Loader2 } from "lucide-react";

const SUBJECT_META = {
  physics: { label: "Physics", icon: Atom, color: "text-physics" },
  chemistry: { label: "Chemistry", icon: FlaskConical, color: "text-chemistry" },
  mathematics: { label: "Mathematics", icon: Calculator, color: "text-mathematics" },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  const { data: results, isLoading } = trpc.chapters.search.useQuery(
    { query, subjectId: subjectFilter || undefined },
    { enabled: query.length >= 2 }
  );

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Search Knowledge Repository</h1>
            <p className="text-muted-foreground text-sm">Search across all 80 chapters, topics, and concepts</p>
          </div>

          {/* Search input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chapters, topics, concepts... (e.g. 'kinematics', 'organic chemistry', 'integration')"
              className="pl-10 h-12 text-base bg-card border-border"
              autoFocus
            />
          </div>

          {/* Subject filters */}
          <div className="flex gap-2 mb-6">
            {["", "physics", "chemistry", "mathematics"].map(s => (
              <button key={s} onClick={() => setSubjectFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${subjectFilter === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                {s ? SUBJECT_META[s as keyof typeof SUBJECT_META].label : "All Subjects"}
              </button>
            ))}
          </div>

          {/* Results */}
          {query.length >= 2 ? (
            isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-2">{results.length} results for "{query}"</div>
                {results.map((row: any) => {
                  const ch = row.chapter;
                  const meta = SUBJECT_META[ch.subjectId as keyof typeof SUBJECT_META];
                  const Icon = meta?.icon || BookOpen;
                  return (
                    <Link key={ch.chapterId} href={`/chapter/${ch.chapterId}`}>
                      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className={`w-4 h-4 ${meta?.color || "text-primary"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground">{ch.title}</div>
                            <div className={`text-xs ${meta?.color || "text-primary"} mt-0.5 capitalize`}>
                              {ch.subjectId} · {ch.curriculumId === "ncert_class11" ? "Class 11" : "Class 12"} · Chapter {ch.sortOrder}
                            </div>
                            {(ch.keyTopics as string[] || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(ch.keyTopics as string[]).slice(0, 4).map((t: string) => (
                                  <span key={t} className="text-xs bg-background border border-border/50 rounded-full px-2 py-0.5 text-muted-foreground">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <div className="text-foreground font-semibold">No results found</div>
                <div className="text-muted-foreground text-sm mt-1">Try a different keyword or remove the subject filter</div>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="text-sm">Type at least 2 characters to search</div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {["kinematics", "organic chemistry", "integration", "electrostatics", "probability", "thermodynamics"].map(term => (
                  <button key={term} onClick={() => setQuery(term)}
                    className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
