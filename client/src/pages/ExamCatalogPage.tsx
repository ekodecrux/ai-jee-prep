import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Search, Filter, Star, Layers,
  BookOpen, Clock, Users, TrendingUp, CheckCircle,
  Sparkles, Building2
} from "lucide-react";
import Layout from "@/components/Layout";

// ─── Exam Registry ─────────────────────────────────────────────────────────────
const ALL_EXAMS = [
  {
    id: "jee",
    name: "JEE",
    fullName: "Joint Entrance Examination",
    category: "Engineering",
    categoryClass: "exam-engineering",
    icon: "⚡",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    chapters: 80,
    questions: "2400+",
    duration: "20 months",
    status: "active",
    featured: true,
    badge: "Live Now",
    badgeColor: "bg-primary text-white",
    desc: "India's premier engineering entrance exam. Covers JEE Main (NTA) and JEE Advanced (IIT) with 10 years of past papers, AI narration, and adaptive study plans.",
    highlights: ["80 chapters across 3 subjects", "10-year past papers (2014–2024)", "JEE Main + Advanced patterns", "AI avatar Priya for doubt solving", "20-month adaptive study plan", "Proctored mock tests"],
    institutes: "150+ institutes",
    students: "50,000+ students",
    color: "border-primary/30 bg-primary/3",
  },
  {
    id: "neet",
    name: "NEET UG",
    fullName: "National Eligibility cum Entrance Test",
    category: "Medical",
    categoryClass: "exam-medical",
    icon: "🧬",
    subjects: ["Physics", "Chemistry", "Biology (Botany + Zoology)"],
    chapters: 97,
    questions: "3000+",
    duration: "24 months",
    status: "coming_soon",
    featured: false,
    badge: "Coming Soon",
    badgeColor: "bg-emerald-100 text-emerald-700",
    desc: "The single national medical entrance for MBBS and BDS admissions. NCERT-aligned Biology, Physics & Chemistry with NMC pattern questions.",
    highlights: ["97 chapters across 4 subjects", "NCERT-aligned content", "NMC exam pattern", "Biology deep-dive modules", "Previous 10-year papers"],
    institutes: "—",
    students: "—",
    color: "border-emerald-200/50",
  },
  {
    id: "gate",
    name: "GATE",
    fullName: "Graduate Aptitude Test in Engineering",
    category: "Post-Graduate",
    categoryClass: "exam-gate",
    icon: "🔬",
    subjects: ["Core Engineering Streams", "Engineering Mathematics", "General Aptitude"],
    chapters: 60,
    questions: "1500+",
    duration: "12 months",
    status: "coming_soon",
    featured: false,
    badge: "Coming Soon",
    badgeColor: "bg-violet-100 text-violet-700",
    desc: "Post-graduate engineering entrance for IITs, NITs, and PSU recruitment. Covers CS, ECE, ME, CE, EE, and 27 other disciplines.",
    highlights: ["30+ engineering disciplines", "PSU recruitment aligned", "Numerical answer type focus", "IIT-pattern mock tests"],
    institutes: "—",
    students: "—",
    color: "border-violet-200/50",
  },
  {
    id: "upsc",
    name: "UPSC CSE",
    fullName: "Civil Services Examination",
    category: "Civil Services",
    categoryClass: "exam-civil",
    icon: "🏛️",
    subjects: ["General Studies I–IV", "CSAT", "Optional Subject"],
    chapters: 120,
    questions: "5000+",
    duration: "18 months",
    status: "coming_soon",
    featured: false,
    badge: "Coming Soon",
    badgeColor: "bg-orange-100 text-orange-700",
    desc: "India's most prestigious civil services exam — IAS, IPS, IFS, and allied services. Covers Prelims, Mains, and Interview preparation.",
    highlights: ["Prelims + Mains + Interview", "Current affairs integration", "Answer writing practice", "Previous 15-year papers"],
    institutes: "—",
    students: "—",
    color: "border-orange-200/50",
  },
  {
    id: "cat",
    name: "CAT",
    fullName: "Common Admission Test",
    category: "Management",
    categoryClass: "exam-management",
    icon: "📊",
    subjects: ["Verbal Ability & RC", "Data Interpretation & LR", "Quantitative Aptitude"],
    chapters: 45,
    questions: "1200+",
    duration: "10 months",
    status: "coming_soon",
    featured: false,
    badge: "Coming Soon",
    badgeColor: "bg-amber-100 text-amber-700",
    desc: "IIM entrance test for MBA admissions. Covers VARC, DILR, and Quantitative Aptitude with IIM-pattern mock tests and sectional analysis.",
    highlights: ["IIM-pattern mock tests", "Sectional time management", "Previous 10-year papers", "Percentile predictor"],
    institutes: "—",
    students: "—",
    color: "border-amber-200/50",
  },
  {
    id: "cbse-12",
    name: "CBSE Class 12",
    fullName: "CBSE Board Examination — Class XII",
    category: "Board Exams",
    categoryClass: "exam-board",
    icon: "📚",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "Commerce", "Humanities"],
    chapters: 200,
    questions: "8000+",
    duration: "12 months",
    status: "coming_soon",
    featured: false,
    badge: "Coming Soon",
    badgeColor: "bg-sky-100 text-sky-700",
    desc: "Comprehensive CBSE Class 12 preparation across all streams — Science, Commerce, and Humanities — with NCERT-aligned content and board pattern questions.",
    highlights: ["All streams: Science, Commerce, Humanities", "NCERT chapter-wise coverage", "Sample papers & marking schemes", "Board exam pattern"],
    institutes: "—",
    students: "—",
    color: "border-sky-200/50",
  },
  {
    id: "neet-pg",
    name: "NEET PG",
    fullName: "National Eligibility cum Entrance Test — Post Graduate",
    category: "Medical",
    categoryClass: "exam-medical",
    icon: "🏥",
    subjects: ["Pre-clinical", "Para-clinical", "Clinical Subjects"],
    chapters: 150,
    questions: "6000+",
    duration: "12 months",
    status: "coming_soon",
    featured: false,
    badge: "Coming Soon",
    badgeColor: "bg-emerald-100 text-emerald-700",
    desc: "Post-graduate medical entrance for MD/MS/Diploma admissions. Covers all 19 subjects with NBE-pattern questions and clinical case studies.",
    highlights: ["19 clinical subjects", "NBE exam pattern", "Clinical case scenarios", "Previous 8-year papers"],
    institutes: "—",
    students: "—",
    color: "border-emerald-200/50",
  },
  {
    id: "ssc-cgl",
    name: "SSC CGL",
    fullName: "Staff Selection Commission — Combined Graduate Level",
    category: "Government Jobs",
    categoryClass: "exam-civil",
    icon: "🏢",
    subjects: ["Quantitative Aptitude", "English Language", "General Intelligence", "General Awareness"],
    chapters: 40,
    questions: "2000+",
    duration: "6 months",
    status: "coming_soon",
    featured: false,
    badge: "Coming Soon",
    badgeColor: "bg-orange-100 text-orange-700",
    desc: "Central government recruitment exam for Group B and C posts. Covers Tier I, II, and III with SSC-pattern practice tests.",
    highlights: ["Tier I + II + III coverage", "SSC exam pattern", "Speed & accuracy training", "Previous 10-year papers"],
    institutes: "—",
    students: "—",
    color: "border-orange-200/50",
  },
];

const CATEGORIES = ["All", "Engineering", "Medical", "Post-Graduate", "Civil Services", "Management", "Board Exams", "Government Jobs"];

export default function ExamCatalogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = ALL_EXAMS.filter(exam => {
    const matchesCategory = activeCategory === "All" || exam.category === activeCategory;
    const matchesSearch = !searchQuery ||
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeCount = ALL_EXAMS.filter(e => e.status === "active").length;
  const comingSoonCount = ALL_EXAMS.filter(e => e.status === "coming_soon").length;

  return (
    <Layout>
      <div className="min-h-screen bg-background">

        {/* ─── Header ───────────────────────────────────────────────────────── */}
        <div className="border-b border-border bg-card">
          <div className="container py-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Exam Catalog</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-medium mb-3">
                  <Layers className="w-3 h-3" />
                  Universal Knowledge Platform
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground">Exam Catalog</h1>
                <p className="text-muted-foreground mt-1">
                  <span className="text-primary font-semibold">{activeCount} exam{activeCount !== 1 ? "s" : ""} live</span>
                  {" · "}
                  <span>{comingSoonCount} coming soon</span>
                  {" · "}
                  AI-powered preparation for every competitive exam
                </p>
              </div>
              <Link href="/institute-config">
                <Button className="gap-2 shrink-0">
                  <Building2 className="w-4 h-4" /> Onboard Your Institute
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container py-8">

          {/* ─── Search & Filters ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exams, subjects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`md3-chip ${activeCategory === cat ? "active" : ""}`}
              >
                {cat}
                {cat !== "All" && (
                  <span className="ml-1 text-[10px] opacity-60">
                    ({ALL_EXAMS.filter(e => e.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ─── Exam Grid ────────────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No exams found for "{searchQuery}"</p>
              <p className="text-sm mt-1">Try a different search term or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filtered.map(exam => (
                <div
                  key={exam.id}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${exam.status === "active" ? "hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer" : ""} ${exam.featured ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  {/* Featured banner */}
                  {exam.featured && (
                    <div className="bg-primary px-4 py-1.5 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-white fill-white" />
                      <span className="text-xs font-semibold text-white">Featured Module — Fully Live</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{exam.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-bold text-foreground text-xl">{exam.name}</h2>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${exam.badgeColor}`}>
                              {exam.badge}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{exam.fullName}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${exam.categoryClass}`}>
                        {exam.category}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{exam.desc}</p>

                    {/* Subjects */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {exam.subjects.map(s => (
                        <span key={s} className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { icon: BookOpen, label: "Chapters", value: exam.chapters.toString() },
                        { icon: TrendingUp, label: "Questions", value: exam.questions },
                        { icon: Clock, label: "Study Plan", value: exam.duration },
                      ].map(stat => (
                        <div key={stat.label} className="bg-muted/50 rounded-lg p-2.5 text-center">
                          <stat.icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                          <div className="text-sm font-bold text-foreground">{stat.value}</div>
                          <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Highlights */}
                    <div className="grid grid-cols-2 gap-1.5 mb-4">
                      {exam.highlights.slice(0, 4).map(h => (
                        <div key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle className={`w-3 h-3 flex-shrink-0 ${exam.status === "active" ? "text-primary" : "text-muted-foreground/50"}`} />
                          {h}
                        </div>
                      ))}
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        {exam.status === "active" ? (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {exam.students}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Notify me when available →</span>
                        )}
                      </div>
                      {exam.status === "active" ? (
                        <Link href={`/exams/${exam.id}`}>
                          <Button size="sm" className="gap-1.5">
                            Start Learning <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="outline" disabled className="gap-1.5 opacity-60">
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Institute CTA ────────────────────────────────────────────── */}
          <div className="mt-12 bg-primary/4 border border-primary/15 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Don't see your exam? We'll build it.
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              ExamForge AI is exam-agnostic. Onboard your institute, configure your exam syllabus, and we'll generate AI-powered content for any exam in your catalog.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/institute-config">
                <Button className="gap-2">
                  <Building2 className="w-4 h-4" /> Onboard Your Institute
                </Button>
              </Link>
              <Link href="/api-docs">
                <Button variant="outline" className="gap-2">
                  View API Docs
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
