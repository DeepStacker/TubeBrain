import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, Check, BookOpen, Lightbulb, ListChecks, 
  Clock, Hash, Map, MessageSquare, FileText, 
  ChevronRight, Brain, Target, Compass, Download,
  GraduationCap, Rocket, ArrowRight, Star, HelpCircle,
  Settings, ChevronDown, Plus, Eye
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizTab from "./QuizTab";
import MindMapTab from "./MindMapTab";
import Flashcards from "./Flashcards";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  spaces?: { id: string; name: string }[];
  onAddToSpace?: (spaceId: string) => void;
  currentTime?: number;
  flashcards?: { front: string; back: string }[];
  transcript_segments?: { start: number; end: number; text: string }[];
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

const SummaryDisplay = ({ 
  overview, 
  keyPoints, 
  takeaways, 
  timestamps, 
  tags, 
  transcript,
  roadmap,
  learningContext,
  quiz,
  mindMap,
  onTimestampClick,
  spaces = [],
  onAddToSpace,
  currentTime = 0,
  flashcards,
  transcript_segments
}: SummaryDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState("chapters");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    const text = `Title: ${overview}\n\nKey Points:\n${keyPoints.join("\n")}\n\nTakeaways:\n${takeaways.join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isAutoScroll && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentTime, isAutoScroll, activeTab]);

  const findActiveTranscriptIndex = () => {
    if (transcript_segments) {
      let activeIndex = -1;
      for (let i = 0; i < transcript_segments.length; i++) {
        if (transcript_segments[i].start <= currentTime) {
          activeIndex = i;
        } else {
          break;
        }
      }
      return activeIndex;
    }
    if (!transcript) return -1;
    const lines = transcript.split("\n");
    let activeIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\[(\d+:\d+)\]/);
      if (match) {
        const time = parseTimeToSeconds(match[1]);
        if (time <= currentTime) {
          activeIndex = i;
        } else {
          break;
        }
      }
    }
    return activeIndex;
  };

  const findActiveChapterIndex = () => {
    if (!timestamps) return -1;
    let activeIndex = -1;
    for (let i = 0; i < timestamps.length; i++) {
      const time = parseTimeToSeconds(timestamps[i].time);
      if (time <= currentTime) {
        activeIndex = i;
      } else {
        break;
      }
    }
    return activeIndex;
  };

  const activeTranscriptIndex = findActiveTranscriptIndex();
  const activeChapterIndex = findActiveChapterIndex();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-8 pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-transparent p-0 gap-6 h-auto">
            <TabsTrigger 
              value="chapters" 
              className="px-0 py-2 text-sm font-medium data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent data-[state=active]:border-green-500 rounded-none bg-transparent gap-2"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Chapters
            </TabsTrigger>
            <TabsTrigger 
              value="transcripts" 
              className="px-0 py-2 text-sm font-medium data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent data-[state=active]:border-foreground rounded-none bg-transparent gap-2"
            >
              <span className="text-muted-foreground text-xs">T</span>
              Transcripts
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsAutoScroll(!isAutoScroll)}
               className={cn(
                 "flex items-center gap-2 text-xs font-medium transition-colors px-3 py-1.5 rounded-full border",
                 isAutoScroll ? "text-foreground border-gray-200 bg-white" : "text-muted-foreground border-gray-100 hover:border-gray-200"
               )}
             >
                <ChevronDown className="h-3 w-3" />
                Auto Scroll
             </button>
             <button 
               onClick={handleCopy} 
               className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
             >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
             </button>
          </div>
        </div>

        {/* ─── CHAPTERS TAB ─── */}
        <TabsContent value="chapters" className="mt-0 outline-none space-y-8">
          {timestamps?.map((ts, i) => (
            <motion.div 
              key={i}
              ref={i === activeChapterIndex ? activeLineRef : null}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "group cursor-pointer p-4 -mx-4 rounded-2xl transition-all",
                i === activeChapterIndex ? "bg-gray-50" : "hover:bg-gray-50/50"
              )}
              onClick={() => onTimestampClick && onTimestampClick(parseTimeToSeconds(ts.time))}
            >
              <span className={cn(
                "text-xs font-medium mb-2 block transition-colors",
                i === activeChapterIndex ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>{ts.time}</span>
              <h3 className={cn(
                "text-lg font-semibold mb-2 transition-colors",
                i === activeChapterIndex ? "text-foreground" : "group-hover:text-foreground"
              )}>{ts.label}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {keyPoints[i] || overview.slice(0, 200)}
              </p>
            </motion.div>
          ))}

          {!timestamps?.length && (
            <div className="p-8 border-2 border-dashed rounded-3xl text-center text-muted-foreground">
               No chapters detected. The summary provides a full overview.
            </div>
          )}
        </TabsContent>

        {/* ─── TRANSCRIPTS TAB ─── */}
        <TabsContent value="transcripts" className="mt-0 outline-none">
          {transcript_segments ? (
            <div className="space-y-4">
              {transcript_segments.map((seg, i) => {
                const isActive = i === activeTranscriptIndex;
                const hh = Math.floor(seg.start / 3600);
                const mm = Math.floor((seg.start % 3600) / 60);
                const ss = Math.floor(seg.start % 60);
                const timeStr = hh > 0 
                  ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
                  : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

                return (
                  <div
                    key={i}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => onTimestampClick && onTimestampClick(seg.start)}
                    className={cn(
                      "group cursor-pointer p-3 -mx-3 rounded-2xl transition-all",
                      isActive ? "bg-blue-50 text-blue-700 font-bold shadow-sm" : "hover:bg-gray-50"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-black mb-1 block",
                      isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-foreground"
                    )}>[{timeStr}]</span>
                    <p className="text-sm leading-relaxed">{seg.text}</p>
                  </div>
                );
              })}
            </div>
          ) : transcript ? (
            <div className="space-y-4">
              {transcript.split("\n").map((line, i) => {
                const match = line.match(/^\[(\d+:\d+)\]\s*(.*)$/);
                const isActive = i === activeTranscriptIndex;
                if (match) {
                  return (
                    <div
                      key={i}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => onTimestampClick && onTimestampClick(parseTimeToSeconds(match[1]))}
                      className={cn(
                        "group cursor-pointer p-3 -mx-3 rounded-2xl transition-all",
                        isActive ? "bg-blue-50 text-blue-700 font-bold shadow-sm" : "hover:bg-gray-50"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-black mb-1 block",
                        isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-foreground"
                      )}>{match[1]}</span>
                      <p className="text-sm leading-relaxed">{match[2]}</p>
                    </div>
                  );
                }
                return <p key={i} className="text-foreground text-sm leading-relaxed">{line}</p>;
              })}
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed rounded-3xl text-center text-muted-foreground">
               Transcript unavailable for this video.
            </div>
          )}
        </TabsContent>

        {/* ─── FLASHCARDS TAB ─── */}
        <TabsContent value="flashcards" className="mt-0 outline-none">
          {flashcards ? (
            <Flashcards cards={flashcards} />
          ) : (
            <div className="p-12 border-2 border-dashed rounded-[3rem] text-center bg-gray-50/30">
               <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Study Cards Unavailable</p>
               <p className="text-sm font-bold mt-2">Try re-analyzing this video to generate interactive cards.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Other Sections (Roadmap, Quiz, etc.) */}
      {(roadmap || quiz || mindMap) && (
        <div className="mt-20 pt-12 border-t space-y-20">
           {roadmap && (
             <section id="roadmap">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                      <Rocket className="h-5 w-5 text-purple-600" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter italic">Mastery Roadmap</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {roadmap.steps.map((step, i) => (
                     <div key={i} className="p-6 rounded-3xl border bg-white shadow-sm hover:shadow-md transition-all">
                        <span className="text-xs font-black text-purple-600 mb-2 block tracking-widest uppercase">Step {step.step}</span>
                        <h4 className="text-lg font-bold mb-3">{step.task}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                     </div>
                   ))}
                </div>
             </section>
           )}

           {quiz && quiz.length > 0 && (
             <section id="quiz">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-red-500" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter italic">Evaluation Quiz</h3>
                </div>
                <QuizTab quiz={quiz} />
             </section>
           )}

           {mindMap && mindMap.nodes && mindMap.nodes.length > 0 && (
              <section id="mindmap">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                       <Map className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Mind Map</h3>
                 </div>
                 <MindMapTab mindMap={mindMap} />
              </section>
            )}
        </div>
      )}
    </motion.div>
  );
};

export default SummaryDisplay;
