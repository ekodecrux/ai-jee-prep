import { useState } from "react";
import Layout from "@/components/Layout";
import { Code2, Globe, Key, BookOpen, Zap, ChevronDown, ChevronRight, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = window.location.origin;

const ENDPOINTS = [
  {
    category: "Exams & Subjects",
    color: "text-blue-400",
    endpoints: [
      {
        method: "GET", path: "/api/v1/exams",
        description: "List all available exams (JEE Main, JEE Advanced, NEET, etc.)",
        response: `[{ "examId": "jee_main", "name": "JEE Main", "description": "...", "totalChapters": 80 }]`
      },
      {
        method: "GET", path: "/api/v1/subjects",
        description: "List all subjects with chapter counts",
        query: "?examId=jee_main",
        response: `[{ "subjectId": "physics", "name": "Physics", "chapterCount": 25 }]`
      },
    ]
  },
  {
    category: "Chapters",
    color: "text-physics",
    endpoints: [
      {
        method: "GET", path: "/api/v1/chapters",
        description: "List all chapters with filtering by subject, class level, and weightage",
        query: "?subjectId=physics&classLevel=11&limit=10&offset=0",
        response: `[{ "chapterId": "PHY_C11_01", "title": "Units & Measurements", "subjectId": "physics", "classLevel": 11, "sortOrder": 1, "importanceLevel": "very_high", "keyTopics": [...] }]`
      },
      {
        method: "GET", path: "/api/v1/chapters/:chapterId",
        description: "Get a single chapter with full details including narration availability",
        response: `{ "chapterId": "PHY_C11_01", "title": "...", "hasNarration": true, "questionCount": 45, "weightageMain": "high", "weightageAdvanced": "very_high" }`
      },
      {
        method: "GET", path: "/api/v1/chapters/:chapterId/narration",
        description: "Get the full teacher narration script for a chapter",
        response: `{ "chapterId": "PHY_C11_01", "title": "...", "wordCount": 3200, "sections": [{ "heading": "Introduction", "content": "..." }] }`
      },
    ]
  },
  {
    category: "Questions & Past Papers",
    color: "text-chemistry",
    endpoints: [
      {
        method: "GET", path: "/api/v1/questions",
        description: "Get past year questions with filtering by chapter, difficulty, type, source, and year",
        query: "?chapterId=PHY_C11_01&difficulty=hard&questionType=mcq&source=jee_advanced&year=2023&limit=20",
        response: `[{ "id": 1, "chapterId": "PHY_C11_01", "questionText": "...", "questionType": "mcq", "options": {...}, "correctAnswer": "A", "solution": "...", "difficulty": "hard", "source": "jee_advanced", "year": 2023 }]`
      },
      {
        method: "GET", path: "/api/v1/questions/stats",
        description: "Get question statistics by chapter and year range",
        query: "?chapterId=PHY_C11_01&fromYear=2014&toYear=2024",
        response: `{ "total": 45, "byDifficulty": { "easy": 10, "medium": 20, "hard": 15 }, "byType": { "mcq": 30, "nat": 10, "integer": 5 }, "bySource": { "jee_main": 25, "jee_advanced": 20 } }`
      },
    ]
  },
  {
    category: "Assessments",
    color: "text-mathematics",
    endpoints: [
      {
        method: "GET", path: "/api/v1/assessments",
        description: "List assessments for a chapter (practice mode and chapter test)",
        query: "?chapterId=PHY_C11_01",
        response: `[{ "assessmentId": "...", "title": "Units & Measurements Practice", "assessmentType": "practice", "questionCount": 20, "passingScore": 60 }]`
      },
      {
        method: "GET", path: "/api/v1/assessments/:assessmentId",
        description: "Get full assessment with questions (answers hidden for active tests)",
        response: `{ "assessmentId": "...", "questions": [{ "id": 1, "questionText": "...", "options": {...}, "marks": 4, "negativeMarks": 1 }] }`
      },
    ]
  },
  {
    category: "Search",
    color: "text-yellow-400",
    endpoints: [
      {
        method: "GET", path: "/api/v1/search",
        description: "Full-text search across chapters, topics, and concepts",
        query: "?q=kinematics&subjectId=physics&limit=10",
        response: `[{ "chapterId": "PHY_C11_02", "title": "Kinematics", "relevanceScore": 0.95, "matchedTopics": ["velocity", "acceleration"] }]`
      },
    ]
  },
];

const CODE_EXAMPLES = {
  curl: `# Get all Physics chapters for JEE Main
curl -X GET "${BASE_URL}/api/v1/chapters?subjectId=physics&examId=jee_main" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Accept: application/json"`,
  javascript: `// Fetch chapter narration script
const response = await fetch(
  '${BASE_URL}/api/v1/chapters/PHY_C11_01/narration',
  {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);
const narration = await response.json();
console.log(narration.sections[0].content);`,
  python: `import requests

# Get past year questions for a chapter
response = requests.get(
    '${BASE_URL}/api/v1/questions',
    params={
        'chapterId': 'PHY_C11_01',
        'difficulty': 'hard',
        'source': 'jee_advanced',
        'limit': 20
    },
    headers={'X-API-Key': 'YOUR_API_KEY'}
)
questions = response.json()
for q in questions:
    print(f"[{q['year']}] {q['questionText'][:80]}...")`,
};

export default function ApiDocsPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Chapters");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [codeLang, setCodeLang] = useState<"curl" | "javascript" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="hero-gradient rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">REST API v1 Documentation</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The Universal Knowledge Platform exposes a fully RESTful API for integration with any ERP, LMS, or
                third-party system. All endpoints return JSON and support filtering, pagination, and versioning.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="flex items-center gap-1.5 text-xs bg-card/60 rounded-lg px-3 py-1.5">
                  <Globe className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-muted-foreground">Base URL: <strong className="text-foreground font-mono text-xs">{BASE_URL}/api/v1</strong></span>
                </span>
                <span className="flex items-center gap-1.5 text-xs bg-card/60 rounded-lg px-3 py-1.5">
                  <Key className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-muted-foreground">Auth: <strong className="text-foreground">X-API-Key header</strong></span>
                </span>
                <span className="flex items-center gap-1.5 text-xs bg-card/60 rounded-lg px-3 py-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-muted-foreground">Rate limit: <strong className="text-foreground">1000 req/hour</strong></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Endpoints */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">API Endpoints</h2>

            {ENDPOINTS.map(cat => (
              <div key={cat.category} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-background/50 transition-colors"
                  onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className={`w-4 h-4 ${cat.color}`} />
                    <span className="font-semibold text-foreground text-sm">{cat.category}</span>
                    <span className="text-xs text-muted-foreground">({cat.endpoints.length} endpoints)</span>
                  </div>
                  {expandedCategory === cat.category ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {expandedCategory === cat.category && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {cat.endpoints.map(ep => {
                      const key = `${ep.method}${ep.path}`;
                      const isOpen = expandedEndpoint === key;
                      return (
                        <div key={key}>
                          <button
                            className="w-full p-4 flex items-start gap-3 text-left hover:bg-background/30 transition-colors"
                            onClick={() => setExpandedEndpoint(isOpen ? null : key)}
                          >
                            <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono flex-shrink-0 mt-0.5 ${ep.method === "GET" ? "bg-green-900/30 text-green-400 border border-green-700/50" : ep.method === "POST" ? "bg-blue-900/30 text-blue-400 border border-blue-700/50" : "bg-yellow-900/30 text-yellow-400 border border-yellow-700/50"}`}>
                              {ep.method}
                            </span>
                            <div className="flex-1">
                              <code className="text-sm text-foreground font-mono">{ep.path}{ep.query ? <span className="text-muted-foreground">{ep.query}</span> : null}</code>
                              <p className="text-xs text-muted-foreground mt-1">{ep.description}</p>
                            </div>
                            {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4 bg-background/30">
                              <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Example Response</div>
                              <div className="relative">
                                <pre className="bg-background border border-border rounded-lg p-3 text-xs text-green-300 overflow-x-auto font-mono leading-relaxed">
                                  {ep.response}
                                </pre>
                                <button
                                  onClick={() => copyCode(ep.response)}
                                  className="absolute top-2 right-2 p-1.5 rounded bg-card border border-border hover:border-primary/50 transition-colors"
                                >
                                  {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Code examples */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide mb-3">Code Examples</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-4">
              {/* Language tabs */}
              <div className="flex border-b border-border">
                {(["curl", "javascript", "python"] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${codeLang === lang ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {lang === "javascript" ? "JS" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>

              {/* Code */}
              <div className="relative">
                <pre className="p-4 text-xs text-green-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                  {CODE_EXAMPLES[codeLang]}
                </pre>
                <button
                  onClick={() => copyCode(CODE_EXAMPLES[codeLang])}
                  className="absolute top-3 right-3 p-1.5 rounded bg-card border border-border hover:border-primary/50 transition-colors"
                >
                  {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Authentication note */}
            <div className="mt-4 bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                Authentication
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Include your API key in every request using the <code className="text-primary">X-API-Key</code> header.
                Contact the platform administrator to obtain an API key for your ERP or LMS integration.
              </p>
              <div className="mt-3 p-2 bg-background border border-border rounded-lg">
                <code className="text-xs text-green-300 font-mono">X-API-Key: your_api_key_here</code>
              </div>
            </div>

            {/* Rate limits */}
            <div className="mt-4 bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                Rate Limits & Versioning
              </h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Free tier</span><span className="text-foreground">100 req/hour</span></div>
                <div className="flex justify-between"><span>Standard tier</span><span className="text-foreground">1,000 req/hour</span></div>
                <div className="flex justify-between"><span>Enterprise tier</span><span className="text-foreground">Unlimited</span></div>
                <div className="border-t border-border pt-2 mt-2">
                  <span className="text-foreground">API versioning:</span> All endpoints are prefixed with <code className="text-primary">/api/v1/</code>. Future versions will be backward compatible.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
