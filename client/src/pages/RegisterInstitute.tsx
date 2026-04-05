import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Building2, ArrowLeft, CheckCircle, GraduationCap,
  Mail, Phone, MapPin, Globe, Hash, Sparkles, ArrowRight,
  Shield, Clock, Users, BookOpen,
} from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  name: z.string().min(2, "Institute name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(20, "Code must be at most 20 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  board: z.string().optional(),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const BOARDS = [
  "CBSE", "ICSE", "State Board", "IB", "Cambridge IGCSE", "Other",
];

const STATES = [
  "Andhra Pradesh", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra",
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other",
];

const PERKS = [
  { icon: Users, text: "Onboard up to 100 students on the free trial" },
  { icon: BookOpen, text: "Access all 80 AI-narrated chapters" },
  { icon: Shield, text: "Manage teachers, parents, and fee records" },
  { icon: Clock, text: "14-day trial — no credit card required" },
];

export default function RegisterInstitute() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const registerMutation = trpc.erp.selfRegisterInstitute.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Institute registered! Redirecting to your portal...");
      setTimeout(() => navigate("/institute-admin"), 2500);
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data);
  };

  // Not authenticated — show sign-in prompt
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-900 border-white/10 text-white">
          <CardHeader className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl text-white">Sign in to register your institute</CardTitle>
            <CardDescription className="text-gray-400">
              You need a Manus account to create and manage your institute.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 h-11"
            >
              <GraduationCap className="w-4 h-4" />
              Sign in with Manus OAuth
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-900 border-white/10 text-white text-center">
          <CardContent className="p-10">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Institute Registered!</h2>
            <p className="text-gray-400 text-sm mb-4">
              Your institute has been created and you've been assigned as Institute Admin.
              Redirecting to your portal...
            </p>
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-400 hover:text-white h-8">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Register Your Institute</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Free 14-day trial
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-5 gap-10">
        {/* Left: form */}
        <div className="md:col-span-3">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2">Create your institute</h1>
            <p className="text-gray-400 text-sm">
              Fill in the details below to register your coaching centre or school on ExamForge AI.
              You'll be automatically assigned as the Institute Admin.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic info */}
            <div className="rounded-xl bg-gray-900 border border-white/8 p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Basic Information</h3>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-gray-300 text-sm">Institute Name <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g. Brilliant Academy, Apex Coaching"
                    className="pl-9 bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-gray-300 text-sm">
                  Short Code <span className="text-red-400">*</span>
                  <span className="text-gray-500 font-normal ml-1">(used as institute identifier)</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="code"
                    {...register("code")}
                    placeholder="e.g. BRILLIANT, APEX2024"
                    className="pl-9 bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500 uppercase"
                  />
                </div>
                {errors.code && <p className="text-red-400 text-xs">{errors.code.message}</p>}
                {watch("code") && (
                  <p className="text-gray-600 text-xs">
                    Your institute ID will be: <span className="text-amber-400 font-mono">INST_{watch("code")?.toUpperCase()}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-xl bg-gray-900 border border-white/8 p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Contact Details</h3>

              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-gray-300 text-sm">Contact Email <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="contactEmail"
                    type="email"
                    {...register("contactEmail")}
                    placeholder="admin@yourinstitutte.com"
                    className="pl-9 bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500"
                  />
                </div>
                {errors.contactEmail && <p className="text-red-400 text-xs">{errors.contactEmail.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone" className="text-gray-300 text-sm">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="contactPhone"
                      {...register("contactPhone")}
                      placeholder="+91 98765 43210"
                      className="pl-9 bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-gray-300 text-sm">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="website"
                      {...register("website")}
                      placeholder="https://yourinstitutte.com"
                      className="pl-9 bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl bg-gray-900 border border-white/8 p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Location & Board</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-gray-300 text-sm">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Mumbai, Delhi..."
                      className="pl-9 bg-gray-800 border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-gray-300 text-sm">State</Label>
                  <select
                    id="state"
                    {...register("state")}
                    className="w-full h-10 px-3 rounded-md bg-gray-800 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="board" className="text-gray-300 text-sm">Curriculum / Board</Label>
                <select
                  id="board"
                  {...register("board")}
                  className="w-full h-10 px-3 rounded-md bg-gray-800 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select board</option>
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0 h-12 text-base font-semibold"
            >
              {registerMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Institute...
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  Create Institute & Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-center text-gray-600 text-xs">
              By registering, you agree to our Terms of Service. Your institute starts on a free trial
              (100 students, 10 teachers) and requires verification by a Super Admin before going live.
            </p>
          </form>
        </div>

        {/* Right: benefits */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
            <Building2 className="w-8 h-8 mb-4 opacity-80" />
            <h3 className="text-lg font-bold mb-2">What you get on the free trial</h3>
            <div className="space-y-3 mt-4">
              {PERKS.map(p => (
                <div key={p.text} className="flex items-start gap-2.5">
                  <p.icon className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" />
                  <span className="text-sm text-white/90">{p.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gray-900 border border-white/8 p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-300">How it works</h4>
            {[
              { step: "1", text: "Fill the form and submit — takes 2 minutes." },
              { step: "2", text: "You're instantly assigned as Institute Admin." },
              { step: "3", text: "Invite teachers, students, and parents via email." },
              { step: "4", text: "Super Admin verifies your institute within 24 hours." },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <p className="text-gray-400 text-sm">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-gray-900 border border-white/8 p-5">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Already have an invite?</h4>
            <p className="text-gray-500 text-xs mb-3">
              If your institute admin sent you an invite link, use that instead of registering a new institute.
            </p>
            <Link href="/onboard">
              <Button variant="outline" size="sm" className="w-full gap-2 border-white/10 text-gray-400 hover:text-white hover:bg-gray-800">
                Join via Invite Code
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
