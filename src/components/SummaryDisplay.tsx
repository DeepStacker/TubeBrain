import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, Check, BookOpen, Lightbulb, ListChecks, 
  Clock, Hash, Map, MessageSquare, FileText, 
  ChevronRight, Brain, Target, Compass, Download,
  GraduationCap, Rocket, ArrowRight, Star, HelpCircle
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizTab from "./QuizTab";
import MindMapTab from "./MindMapTab";

interface Timestamp {
  time: string;
  label: string;
}

interface RoadmapStep {
  step: number;
  task: string;
  description: string;
}

interface LearningContext {
  why: string;
  whatToHowTo: string;
  bestWay: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface MindMapData {
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string; label?: string }[];
}

interface SummaryDisplayProps {
  overview: string;
  keyPoints: string[];
  takeaways: string[];
  timestamps: Timestamp[];
  tags: string[];
  transcript?: string;
  roadmap?: { title: string; steps: RoadmapStep[] };
  learningContext?: LearningContext;
  quiz?: QuizQuestion[];
  mindMap?: MindMapData;
  onTimestampClick?: (seconds: number) => void;
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

const SummaryDisplay = ({ 
  overview, keyPoints, takeaways, timestamps, tags,
  transcript, roadmap, learningContext, quiz, mindMap, onTimestampClick
}: SummaryDisplayProps) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAll = () => {
    let full = `## Overview\n${overview}\n\n## Key Points\n${keyPoints.map(p => `• ${p}`).join("\n")}\n\n## Takeaways\n${takeaways.map(t => `• ${t}`).join("\n")}\n\n## Timestamps\n${timestamps.map(t => `${t.time} - ${t.label}`).join("\n")}`;
    if (transcript) full += `\n\n## Transcript\n${transcript}`;
    if (roadmap) full += `\n\n## ${roadmap.title}\n${roadmap.steps.map(s => `${s.step}. ${s.task}: ${s.description}`).join("\n")}`;
    if (learningContext) full += `\n\n## Learning Context\nWhy: ${learningContext.why}\nHow: ${learningContext.whatToHowTo}\nBest Way: ${learningContext.bestWay}`;
    copyToClipboard(full, "all");
  };

  const downloadReport = () => {
    let content = `# Video Analysis Report\n\n## Overview\n${overview}\n\n## Key Points\n${keyPoints.map((p, i) => `${i+1}. ${p}`).join("\n")}\n\n## Takeaways\n${takeaways.map((t, i) => `${i+1}. ${t}`).join("\n")}\n\n## Timestamps\n${timestamps.map(t => `- ${t.time} — ${t.label}`).join("\n")}\n\n`;
    if (transcript) content += `## Full Transcript\n${transcript}\n\n`;
    if (roadmap) content += `## ${roadmap.title}\n${roadmap.steps.map(s => `### Step ${s.step}: ${s.task}\n${s.description}`).join("\n\n")}\n\n`;
    if (learningContext) content += `## Learning Guide\n### Why?\n${learningContext.why}\n\n### How?\n${learningContext.whatToHowTo}\n\n### Best Way\n${learningContext.bestWay}\n`;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-analysis.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" /> AI Analysis Report
          </h2>
          <p className="text-muted-foreground text-xs mt-1">Powered by advanced AI · Comprehensive breakdown</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadReport} className="gap-2 rounded-xl">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button variant="glass" size="sm" onClick={copyAll} className="gap-2 rounded-xl">
            {copiedSection === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedSection === "all" ? "Copied!" : "Copy All"}
          </Button>
        </div>
      </div>

      {/* Tags */}
      {tags?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border border-primary/20">
              <Hash className="h-3 w-3" />{tag}
            </span>
          ))}
        </motion.div>
      )}

      {/* Tabs — 6 total */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-muted/30 backdrop-blur-sm p-1.5 rounded-2xl h-auto">
          <TabsTrigger value="summary" className="gap-1.5 rounded-xl py-2.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <BookOpen className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="transcript" className="gap-1.5 rounded-xl py-2.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Transcript</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-1.5 rounded-xl py-2.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Map className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="learn" className="gap-1.5 rounded-xl py-2.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Brain className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Learn</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5 rounded-xl py-2.5 text-xs data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            <HelpCircle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="mindmap" className="gap-1.5 rounded-xl py-2.5 text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <GraduationCap className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Mind Map</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── SUMMARY TAB ─── */}
        <TabsContent value="summary" className="mt-6 space-y-6 outline-none">
          {/* Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-display font-bold text-lg text-foreground">Comprehensive Overview</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(overview, "overview")} className="h-8 w-8 p-0">
                {copiedSection === "overview" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="text-secondary-foreground leading-[1.8] text-sm whitespace-pre-wrap">{overview}</div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Points */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h3 className="font-display font-bold text-lg text-foreground">Deep Insights</h3>
                <span className="ml-auto text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold">{keyPoints?.length || 0}</span>
              </div>
              <ul className="space-y-4">
                {keyPoints?.map((point, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.03 }} className="flex items-start gap-3 text-sm text-secondary-foreground">
                    <div className="mt-0.5 h-6 w-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="text-[10px] font-black text-primary">{i + 1}</span>
                    </div>
                    <span className="leading-relaxed">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Timestamps — now clickable */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="font-display font-bold text-lg text-foreground">Key Moments</h3>
                {onTimestampClick && <span className="ml-auto text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">Click to jump</span>}
              </div>
              <div className="space-y-2">
                {timestamps?.map((ts, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.03 }}
                    onClick={() => onTimestampClick && onTimestampClick(parseTimeToSeconds(ts.time))}
                    className={`flex items-center gap-3 text-sm p-2.5 rounded-xl transition-all group ${onTimestampClick ? "cursor-pointer hover:bg-primary/5 hover:border-primary/20 border border-transparent" : ""}`}
                  >
                    <span className="font-mono text-primary font-black min-w-[3.5rem] bg-primary/10 px-2.5 py-1 rounded-lg text-center text-[11px] group-hover:bg-primary/20 transition-colors">{ts.time}</span>
                    <span className="text-secondary-foreground group-hover:text-foreground transition-colors leading-relaxed">{ts.label}</span>
                    {onTimestampClick && <ChevronRight className="h-3.5 w-3.5 text-primary/0 group-hover:text-primary/60 transition-colors ml-auto shrink-0" />}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Takeaways */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <ListChecks className="h-5 w-5 text-green-500" />
              <h3 className="font-display font-bold text-lg text-foreground">Actionable Takeaways</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {takeaways?.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 + i * 0.04 }} className="flex items-start gap-3 text-sm text-secondary-foreground bg-green-500/5 rounded-xl p-4 border border-green-500/10">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="leading-relaxed">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* ─── TRANSCRIPT TAB ─── */}
        <TabsContent value="transcript" className="mt-6 outline-none">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">Full Video Transcript</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">Word-by-word with timestamps — click timestamp to jump</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => transcript && copyToClipboard(transcript, "transcript")} className="gap-2 rounded-xl">
                {copiedSection === "transcript" ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </Button>
            </div>

            {transcript ? (
              <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-0.5" style={{ scrollbarWidth: "thin" }}>
                {transcript.split("\n").map((line, i) => {
                  const match = line.match(/^\[(\d+:\d+)\]\s*(.*)$/);
                  if (match) {
                    return (
                      <div
                        key={i}
                        onClick={() => onTimestampClick && onTimestampClick(parseTimeToSeconds(match[1]))}
                        className={`flex items-start gap-3 py-1.5 px-2 rounded-lg transition-colors group ${onTimestampClick ? "cursor-pointer hover:bg-white/5" : ""}`}
                      >
                        <span className="font-mono text-[11px] text-primary/80 font-bold min-w-[3rem] mt-0.5 shrink-0 group-hover:text-primary transition-colors">{match[1]}</span>
                        <span className="text-secondary-foreground text-sm leading-relaxed group-hover:text-foreground transition-colors">{match[2]}</span>
                      </div>
                    );
                  }
                  return <div key={i} className="text-secondary-foreground text-sm leading-relaxed py-1 px-2">{line}</div>;
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No transcript available</p>
                <p className="text-xs mt-1">This video may not have captions enabled.</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ─── ROADMAP TAB ─── */}
        <TabsContent value="roadmap" className="mt-6 outline-none">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">{roadmap?.title || "Learning Roadmap"}</h3>
                <p className="text-muted-foreground text-xs">Step-by-step mastery path based on this video</p>
              </div>
            </div>
            {roadmap?.steps?.length ? (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                <div className="space-y-8">
                  {roadmap.steps.map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative pl-16">
                      <div className="absolute left-0 top-0 w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 z-10">
                        <span className="text-primary font-black text-xl">{step.step}</span>
                      </div>
                      <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                        <h4 className="font-display font-bold text-base text-foreground mb-2 flex items-center gap-2">
                          {step.task} <ArrowRight className="h-4 w-4 text-primary/50" />
                        </h4>
                        <p className="text-secondary-foreground text-sm leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Map className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">Roadmap not available</p>
                <p className="text-xs mt-1">Try "Educational Deep-Dive" mode.</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ─── LEARN TAB ─── */}
        <TabsContent value="learn" className="mt-6 outline-none">
          <div className="grid gap-6">
            {learningContext ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/20 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-foreground">Learning Lab</h3>
                    <p className="text-muted-foreground text-xs">Understanding the Why, What, and How</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-orange-500/5 rounded-2xl p-5 border border-orange-500/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                        <Target className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400 mb-3">Why Learn This?</h4>
                        <p className="text-foreground text-sm leading-[1.8]">{learningContext.why}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-500/5 rounded-2xl p-5 border border-blue-500/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Compass className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-3">What To Learn & How</h4>
                        <p className="text-foreground text-sm leading-[1.8]">{learningContext.whatToHowTo}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-500/5 rounded-2xl p-5 border border-green-500/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                        <Lightbulb className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-green-400 mb-3">The Best Approach</h4>
                        <p className="text-foreground text-sm leading-[1.8] font-medium">{learningContext.bestWay}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-sm">Switch to "Educational Deep-Dive" mode for full learning analysis.</p>
              </div>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 glass-card rounded-2xl p-8 text-center border border-primary/10">
              <MessageSquare className="h-10 w-10 text-primary mx-auto opacity-40 mb-4" />
              <h3 className="font-display font-bold text-xl mb-2">Reflect & Apply</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                🤔 How does this connect to what you already know?<br/>
                🎯 What's one thing you can practice right now?<br/>
                💡 What surprised you the most?<br/>
                💬 Use the AI tutor below to ask any question!
              </p>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── QUIZ TAB ─── */}
        <TabsContent value="quiz" className="mt-6 outline-none">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-yellow-400" />
              <h3 className="font-display font-bold text-lg text-foreground">Knowledge Check Quiz</h3>
              {quiz?.length > 0 && <span className="ml-auto text-[10px] bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full font-bold">{quiz.length} Questions</span>}
            </div>
            <QuizTab quiz={quiz || []} />
          </div>
        </TabsContent>

        {/* ─── MINDMAP TAB ─── */}
        <TabsContent value="mindmap" className="mt-6 outline-none">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-purple-400" />
              <h3 className="font-display font-bold text-lg text-foreground">Visual Concept Map</h3>
              <span className="ml-auto text-[10px] bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full font-bold">Drag · Zoom · Pan</span>
            </div>
            <MindMapTab mindMap={mindMap} />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SummaryDisplay;
