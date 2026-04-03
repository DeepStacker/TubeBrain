import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, GraduationCap, Library, Globe, Shield, Play, LayoutGrid, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuthContext } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { fetchUserData, isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-2xl h-16 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-card shadow-sm">
            <span className="text-[11px] font-black tracking-[0.18em]">TB</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">TubeBrain</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          <a href="#library" className="hover:text-foreground transition-colors">Library</a>
        </div>

        <div>
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="h-9 rounded-full bg-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-background hover:bg-foreground/90">
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <AuthDialog onSuccess={fetchUserData} />
          )}
        </div>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-28 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-1.5 mb-8"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">AI study workflow, built for focus</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl text-center text-5xl font-black tracking-tight leading-[0.96] mb-6 md:text-7xl lg:text-[5.5rem]"
        >
          Turn long videos into a calm, structured learning workflow.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-center text-base leading-7 text-muted-foreground md:text-lg mb-10"
        >
          TubeBrain converts YouTube content into summaries, notes, quizzes, and learning paths without the clutter. Keep the work organized, the interface quiet, and the next step obvious.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="lg" className="h-12 rounded-full bg-foreground px-6 text-sm font-semibold uppercase tracking-[0.22em] text-background hover:bg-foreground/90 gap-2">
                Go to dashboard <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </Link>
          ) : (
            <AuthDialog 
              trigger={
                <Button size="lg" className="h-12 rounded-full bg-foreground px-6 text-sm font-semibold uppercase tracking-[0.22em] text-background hover:bg-foreground/90 gap-2">
                  Start free <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              }
              onSuccess={fetchUserData} 
            />
          )}
          <Button variant="outline" size="lg" className="h-12 rounded-full border-border px-6 text-sm font-semibold uppercase tracking-[0.22em]">
            Watch demo
          </Button>
        </motion.div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {[
            { value: "1 click", label: "paste a source" },
            { value: "8 tools", label: "generated automatically" },
            { value: "0 clutter", label: "focused workspace" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-4 py-2">
              <span className="text-foreground">{stat.value}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Product Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 w-full max-w-5xl overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]"
        >
          <div className="grid gap-px bg-border/60 md:grid-cols-[1.35fr_0.65fr]">
            <div className="min-h-[360px] bg-background p-8 md:p-10">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <span>Source</span>
                <span>Analysis in progress</span>
              </div>
              <div className="mt-6 rounded-[28px] border border-border/70 bg-card p-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
                    <Play className="h-4.5 w-4.5 ml-0.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">A focused study flow</p>
                    <p className="text-xs text-muted-foreground">Paste a link, review the synthesis, then move the result into a space.</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { label: "Analyze", value: "Video to structured insight" },
                    { label: "Organize", value: "Save summaries and notes" },
                    { label: "Review", value: "Revisit later with context" },
                  ].map((step) => (
                    <div key={step.label} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{step.label}</p>
                        <p className="text-sm font-medium text-foreground">{step.value}</p>
                      </div>
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 bg-secondary/20 p-8 md:border-l md:border-t-0 md:p-10">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-foreground" />
                    Workflow
                  </div>
                  <div className="mt-8 space-y-6 text-left">
                    {[
                      "Capture a source",
                      "Generate study assets",
                      "Organize into a space",
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background text-[10px] font-semibold text-foreground">
                          0{index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">A short, repeatable loop that keeps the interface and the work clean.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 rounded-[28px] border border-border/70 bg-background p-5 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">What you get</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground">
                    {[
                      "Summaries",
                      "Mind maps",
                      "Flashcards",
                      "Quizzes",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-border/60 bg-secondary/30 px-3 py-2 text-center font-medium">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-t border-border/60 py-20 px-6 lg:px-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Everything stays organized.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A minimal system for turning video knowledge into reusable study material.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Fast synthesis", desc: "Turn long videos into concise, structured notes." },
              { icon: GraduationCap, title: "Study assets", desc: "Generate quizzes, flashcards, and learning paths." },
              { icon: Library, title: "Spaces", desc: "Keep related work grouped by topic or project." },
              { icon: Globe, title: "Flexible sources", desc: "Analyze links, uploads, and mixed learning materials." },
              { icon: Shield, title: "Timestamps", desc: "Keep insights tied to source moments for review." },
              { icon: ArrowRight, title: "Clean workflow", desc: "Move from capture to review with fewer distractions." },
            ].map((f, i) => (
              <div key={i} className="p-8 bg-background rounded-[28px] border border-border/70 hover:border-border transition-all group shadow-sm">
                <div className="w-11 h-11 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-6">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="px-6 lg:px-12 py-20">
        <div className="max-w-7xl mx-auto rounded-[32px] border border-border/70 bg-card p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: "1. Capture", copy: "Paste a video URL or upload a file." },
              { title: "2. Synthesize", copy: "Let the AI generate a concise knowledge layer." },
              { title: "3. Reuse", copy: "Save the result in a space and review later." },
            ].map((step) => (
              <div key={step.title} className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{step.title}</p>
                <p className="text-base leading-7 text-foreground font-medium">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-12 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-70">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border/70 bg-card">
              <span className="text-[9px] font-black tracking-[0.18em]">TB</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">TubeBrain</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            © 2026 TubeBrain AI
          </div>
          <div className="flex gap-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
