import { 
  Copy, Check, BookOpen, Lightbulb, 
  Clock, Map as MapIcon, FileText, 
  Brain, Target, MessageSquare,
  Rocket, Star, HelpCircle, Layers, LayoutGrid,
  ChevronDown, Plus, FolderPlus, Search, 
  ChevronUp, Settings2, Share2, MoreVertical, Maximize2, Sliders,
  ChevronRight, StickyNote, MoreHorizontal, Mic, History,
  User as UserIcon, Sparkles, X, ChevronLeftCircle,
  Headphones, Video, Link, BookMarked, Languages, Library, List, ExternalLink
} from "lucide-react";
import { useRef, useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RichMessage } from "./RichMessage";
import { useAnalysisContext } from "@/contexts/AnalysisContext";
import { AnimatePresence, motion } from "framer-motion";
import { TOOL_IDS, UTILITY_TOOLS } from "@/lib/toolConstants";

const QuizTab = lazy(() => import("./QuizTab"));
const MindMapTab = lazy(() => import("./MindMapTab"));
const Flashcards = lazy(() => import("./Flashcards"));
const NotesTool = lazy(() => import("./NotesTool"));
const SynthesisTab = lazy(() => import("./SynthesisTab"));
const RoadmapTab = lazy(() => import("./RoadmapTab"));

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface RoadmapStep {
  step: number;
  task: string;
  description: string;
}

interface MindMapData {
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string; label?: string }[];
}

interface Timestamp {
  time: string;
  label: string;
}

interface LearningContext {
  why: string;
  whatToHowTo: string;
  bestWay: string;
}

interface LearnToolsProps {
  onToolClick?: (toolId: string, value?: string, context?: string) => void;
  onOpenGlobalChat?: () => void;
  sets?: { id: string; name: string; date: string; type: string; isGenerating?: boolean }[];
  hasQuiz?: boolean;
  hasFlashcards?: boolean;
  hasRoadmap?: boolean;
  hasMindMap?: boolean;
  onGenerate?: (toolId: string, append?: boolean) => void;
  generatingTools?: string[];
  quizData?: QuizQuestion[];
  roadmapData?: { title: string; steps: RoadmapStep[] };
  mindMapData?: MindMapData;
  flashcardsData?: { front: string; back: string }[];
  podcastData?: { audioUrl?: string; script?: string };
  activeSidebarTab?: string;
  onSidebarTabChange?: (tab: string) => void;
  onCloseTab?: (tabId: string) => void;
  openTabs?: string[];
  onAIAction?: (action: string, context: string) => void;
  overview?: string;
  keyPoints?: string[];
  takeaways?: string[];
  tags?: string[];
  learningContext?: LearningContext;
  onTimestampClick?: (seconds: number) => void;
  timestamps?: Timestamp[];
  aiExplanation?: string | null;
  quizAIExplanation?: string | null;
  roadmapAIExplanation?: string | null;
  onClearExplanation?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  isMobile?: boolean;
}

type StudyProgressState = {
  understand: boolean;
  practice: boolean;
  apply: boolean;
};

const STUDY_PROGRESS_STORAGE_PREFIX = "youtube-genius:study-progress";

const createDefaultStudyProgress = (): StudyProgressState => ({
  understand: false,
  practice: false,
  apply: false,
});

const loadStudyProgress = (analysisId: string | null | undefined): StudyProgressState => {
  if (typeof window === "undefined") {
    return createDefaultStudyProgress();
  }

  try {
    const key = `${STUDY_PROGRESS_STORAGE_PREFIX}:${analysisId || "default"}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return createDefaultStudyProgress();
    }

    const parsed = JSON.parse(raw) as Partial<StudyProgressState>;
    return {
      understand: !!parsed.understand,
      practice: !!parsed.practice,
      apply: !!parsed.apply,
    };
  } catch {
    return createDefaultStudyProgress();
  }
};

const LoadingState = () => (
      <div className="p-12 text-center space-y-6">
    <div className="w-20 h-20 rounded-[28px] bg-secondary mx-auto flex items-center justify-center border border-border/70 shadow-sm">
      <div className="w-8 h-8 border-4 border-muted border-t-primary animate-spin rounded-full" />
    </div>
    <p className="text-xs font-bold text-muted-foreground capitalize">Loading analysis tool...</p>
  </div>
);

const LearnTools = ({ 
  onToolClick, 
  onOpenGlobalChat,
  sets = [], 
  hasQuiz, 
  hasFlashcards, 
  hasRoadmap, 
  hasMindMap, 
  onGenerate, 
  generatingTools = [],
  quizData,
  roadmapData,
  mindMapData,
  flashcardsData,
  podcastData,
  activeSidebarTab = "learn",
  onSidebarTabChange,
  onCloseTab,
  openTabs = ["learn"],
  onAIAction,
  overview,
  keyPoints,
  takeaways,
  tags,
  learningContext,
  onTimestampClick,
  timestamps,
  onMaximize,
  isMaximized,
  aiExplanation,
  quizAIExplanation,
  roadmapAIExplanation,
  onClearExplanation,
}: LearnToolsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [askInput, setAskInput] = useState("");
  const { chatMessages, isChatLoading, summaryData, generatingTools: contextGeneratingTools, activeAnalysisId } = useAnalysisContext();
  const [showConversation, setShowConversation] = useState(false);
  const [chatMode, setChatMode] = useState<"tool" | "coach">("tool");
  const [studyProgress, setStudyProgress] = useState<StudyProgressState>(() => loadStudyProgress(activeAnalysisId));
  
  // Use context generating tools as fallback if props not provided
  const activeGeneratingTools = generatingTools || contextGeneratingTools || [];

  // Filter messages for current tool
  const currentToolMessages = useMemo(() => {
    return chatMessages.filter(m => m.toolId === activeSidebarTab);
  }, [chatMessages, activeSidebarTab]);

  const coachMessagesCount = useMemo(() => {
    return chatMessages.filter((m) => m.toolId === TOOL_IDS.ASK || m.toolId === TOOL_IDS.DEEPDIVE || m.toolId === "action").length;
  }, [chatMessages]);

  // Removed auto-chat transition to keep users in the "Page" view

  const tools = [
    { id: TOOL_IDS.PODCAST, name: 'Podcast', icon: <Headphones className="h-4 w-4" />, color: 'text-indigo-500', bg: 'bg-indigo-500/10', available: !!podcastData },
    { id: TOOL_IDS.VIDEO, name: 'Video', icon: <Video className="h-4 w-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10', available: true },
    { id: TOOL_IDS.SUMMARY, name: 'Summary', icon: <FileText className="h-4 w-4" />, color: 'text-sky-500', bg: 'bg-sky-500/10', available: !!overview },
    { id: TOOL_IDS.QUIZ, name: 'Quiz', icon: <HelpCircle className="h-4 w-4" />, color: 'text-rose-500', bg: 'bg-rose-500/10', available: hasQuiz || !!quizData },
    { id: TOOL_IDS.FLASHCARDS, name: 'Flashcards', icon: <Layers className="h-4 w-4" />, color: 'text-orange-500', bg: 'bg-orange-500/10', available: hasFlashcards || !!flashcardsData },
    { id: TOOL_IDS.NOTES, name: 'Notes', icon: <StickyNote className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-500/10', available: true },
    { id: TOOL_IDS.ROADMAP, name: 'Lesson Plan', icon: <Rocket className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', available: hasRoadmap || !!roadmapData, isNew: true },
    { id: TOOL_IDS.MIND_MAP, name: 'Mind Map', icon: <MapIcon className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-600/10', available: hasMindMap || !!mindMapData },
    { id: TOOL_IDS.GLOSSARY, name: 'Glossary', icon: <Library className="h-4 w-4" />, color: 'text-purple-500', bg: 'bg-purple-500/10', available: true },
    { id: TOOL_IDS.RESOURCES, name: 'Resources', icon: <BookMarked className="h-4 w-4" />, color: 'text-cyan-500', bg: 'bg-cyan-500/10', available: true },
  ];

  const handleAsk = () => {
    if (askInput.trim()) {
      let context = "";
      if (activeSidebarTab === TOOL_IDS.SUMMARY && (overview || keyPoints || takeaways)) {
        context = `[Summary Context]:\nOverview: ${overview || "N/A"}\nKey Points: ${keyPoints?.join(", ") || "N/A"}\nTakeaways: ${takeaways?.join(", ") || "N/A"}`;
      } else if (activeSidebarTab === TOOL_IDS.QUIZ && quizData) {
        context = `[Quiz Context]:\n${quizData.map((q, i) => `Q${i+1}: ${q.question}`).join("\n")}`;
      } else if (activeSidebarTab === TOOL_IDS.ROADMAP && roadmapData) {
        context = `[Roadmap Context]:\nTitle: ${roadmapData.title}\nSteps: ${roadmapData.steps.map(s => `${s.step}. ${s.task}`).join(", ")}`;
      } else if (activeSidebarTab === TOOL_IDS.FLASHCARDS && flashcardsData) {
        context = `[Flashcards Context]:\n${flashcardsData.slice(0, 5).map((f, i) => `Card ${i+1}: ${f.front}`).join("\n")}`;
      }

      if (chatMode === "coach") {
        onToolClick?.(TOOL_IDS.ASK, askInput.trim(), context || `[Tool Context]: ${activeSidebarTab}`);
        onOpenGlobalChat?.();
      } else {
        onToolClick?.(activeSidebarTab, askInput.trim(), context);
      }
      setAskInput("");
      if (chatMode === "tool") {
        setShowConversation(true);
      }
    }
  };

  useEffect(() => {
    setShowConversation(false);
  }, [activeSidebarTab]);

  useEffect(() => {
    setStudyProgress(loadStudyProgress(activeAnalysisId));
  }, [activeAnalysisId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = `${STUDY_PROGRESS_STORAGE_PREFIX}:${activeAnalysisId || "default"}`;
    window.localStorage.setItem(key, JSON.stringify(studyProgress));
  }, [studyProgress, activeAnalysisId]);

  const markStudyStepComplete = (step: keyof StudyProgressState) => {
    setStudyProgress((prev) => ({
      ...prev,
      [step]: true,
    }));
  };

  const resetStudyProgress = () => {
    setStudyProgress(createDefaultStudyProgress());
  };

  const completedSteps = useMemo(() => {
    return [studyProgress.understand, studyProgress.practice, studyProgress.apply].filter(Boolean).length;
  }, [studyProgress]);

  const nextStep = useMemo(() => {
    if (!studyProgress.understand) {
      return {
        label: "Start with understanding",
        description: "Get a clear summary and core concepts first.",
        action: () => {
          markStudyStepComplete("understand");
          onSidebarTabChange?.(TOOL_IDS.SUMMARY);
          onToolClick?.(TOOL_IDS.SUMMARY);
        },
        actionLabel: "Open Summary",
      };
    }

    if (!studyProgress.practice) {
      return {
        label: "Move to practice",
        description: "Use quiz and flashcards to test retention.",
        action: () => {
          markStudyStepComplete("practice");
          onSidebarTabChange?.(TOOL_IDS.QUIZ);
          onToolClick?.(TOOL_IDS.QUIZ);
        },
        actionLabel: "Start Practice",
      };
    }

    if (!studyProgress.apply) {
      return {
        label: "Apply what you learned",
        description: "Generate a roadmap and convert insight into action.",
        action: () => {
          markStudyStepComplete("apply");
          onSidebarTabChange?.(TOOL_IDS.ROADMAP);
          onToolClick?.(TOOL_IDS.ROADMAP);
        },
        actionLabel: "Build Roadmap",
      };
    }

    return {
      label: "Session complete",
      description: "Run an advanced challenge round to reinforce mastery.",
      action: () => {
        onSidebarTabChange?.(TOOL_IDS.QUIZ);
        onToolClick?.(TOOL_IDS.QUIZ, "Give me an advanced challenge round from this topic.");
        setShowConversation(true);
      },
      actionLabel: "Run Challenge",
    };
  }, [studyProgress, onSidebarTabChange, onToolClick]);

  useEffect(() => {
    if ([TOOL_IDS.SUMMARY, TOOL_IDS.SYNTHESIS, TOOL_IDS.CHAPTERS, TOOL_IDS.TRANSCRIPT].includes(activeSidebarTab as any)) {
      markStudyStepComplete("understand");
    }

    if ([TOOL_IDS.QUIZ, TOOL_IDS.FLASHCARDS].includes(activeSidebarTab as any)) {
      markStudyStepComplete("practice");
    }

    if ([TOOL_IDS.ROADMAP, TOOL_IDS.NOTES, TOOL_IDS.MIND_MAP, TOOL_IDS.PODCAST].includes(activeSidebarTab as any)) {
      markStudyStepComplete("apply");
    }
  }, [activeSidebarTab]);

  const activeTabs = useMemo(() => {
    const allTabs = [
      { id: 'learn', name: 'Learn', icon: <LayoutGrid className="h-3 w-3" /> },
      { id: TOOL_IDS.SYNTHESIS, name: 'Synthesis', icon: <Brain className="h-3 w-3" /> },
      { id: TOOL_IDS.SUMMARY, name: 'Summary', icon: <FileText className="h-3 w-3" /> },
      { id: TOOL_IDS.CHAPTERS, name: 'Chapters', icon: <List className="h-3 w-3" /> },
      { id: TOOL_IDS.TRANSCRIPT, name: 'Transcript', icon: <FileText className="h-3 w-3" /> },
      { id: TOOL_IDS.QUIZ, name: 'Quiz', icon: <HelpCircle className="h-3 w-3" /> },
      { id: TOOL_IDS.FLASHCARDS, name: 'Flashcards', icon: <Layers className="h-3 w-3" /> },
      { id: TOOL_IDS.ROADMAP, name: 'Roadmap', icon: <Brain className="h-3 w-3" /> },
      { id: TOOL_IDS.MIND_MAP, name: 'Mind Map', icon: <MapIcon className="h-3 w-3" /> },
      { id: TOOL_IDS.NOTES, name: 'Notes', icon: <StickyNote className="h-3 w-3" /> },
      { id: TOOL_IDS.VIDEO, name: 'Video', icon: <Video className="h-3 w-3" /> },
      { id: TOOL_IDS.GLOSSARY, name: 'Glossary', icon: <Library className="h-3 w-3" /> },
      { id: TOOL_IDS.RESOURCES, name: 'Resources', icon: <BookMarked className="h-3 w-3" /> },
      { id: TOOL_IDS.PODCAST, name: 'Podcast', icon: <Headphones className="h-3 w-3" /> },
    ];

    return allTabs.filter(tab => openTabs.includes(tab.id));
  }, [openTabs]);

  const renderActiveTool = () => {
    switch (activeSidebarTab) {
      case TOOL_IDS.PODCAST:
        if (generatingTools.includes(TOOL_IDS.PODCAST)) {
          return (
            <div className="p-12 text-center space-y-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 rounded-[28px] bg-card mx-auto flex items-center justify-center relative border border-border/70 shadow-sm">
                <div className="absolute inset-0 rounded-[28px] border border-dashed border-indigo-500/15 animate-[spin_10s_linear_infinite]" />
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 animate-spin rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
               </div>
               <div className="space-y-3">
                 <h3 className="text-xl font-black text-foreground tracking-tight">Crafting Audio Edition</h3>
                 <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">Synthesizing personalized podcast insights...</p>
               </div>
            </div>
          );
        }
        return podcastData ? (
            <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 p-5 rounded-[28px] bg-card border border-border/70 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-sm">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground leading-tight">AI Generated Podcast</h3>
                <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">Mastery Audio Edition</p>
              </div>
            </div>
            
            {podcastData.audioUrl && (
              <div className="p-4 bg-card border border-border/70 rounded-[24px] shadow-sm">
                <audio controls className="w-full">
                  <source src={podcastData.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {podcastData.script && (
              <div className="p-8 bg-secondary/30 border border-border/70 rounded-[24px] space-y-4">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Podcast Script</h4>
                <div className="text-sm leading-relaxed text-foreground italic">
                  <RichMessage content={podcastData.script} role="assistant" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Button onClick={() => onGenerate?.('podcast')} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700">
              Generate Podcast
            </Button>
          </div>
        );
      case TOOL_IDS.SUMMARY:
      case TOOL_IDS.CHAPTERS:
      case TOOL_IDS.SYNTHESIS:
        return (
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading summary...</div>}>
            <SynthesisTab 
              overview={overview}
              keyPoints={keyPoints}
              takeaways={takeaways}
              tags={tags}
              learningContext={learningContext}
              onGenerate={(id) => onGenerate?.(id)}
              onTimestampClick={onTimestampClick}
              timestamps={timestamps}
              isGenerating={generatingTools.length > 0}
              aiExplanation={aiExplanation}
              onClearExplanation={onClearExplanation}
              onAIAction={onAIAction}
            />
          </Suspense>
        );
      case TOOL_IDS.VIDEO:
        return (
            <div className="p-6">
            <div className="flex items-center gap-4 p-5 rounded-[28px] bg-card border border-border/70 shadow-sm mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
                <Video className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground leading-tight">Mastery Video</h3>
                <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">Active Player Context</p>
              </div>
            </div>
            <div className="p-8 bg-secondary/30 border border-border/70 rounded-[24px] space-y-4">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Player Navigation</h4>
                <p className="text-sm leading-relaxed text-foreground">
                    The video is playing in the main viewport on the left. Use the **Chapters** and **Transcript** tabs to navigate to specific insights. You can also ask follow-up questions about specific moments here.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button variant="outline" className="rounded-2xl border-border/70 font-medium text-[10px] h-10 uppercase tracking-widest" onClick={() => onSidebarTabChange?.(TOOL_IDS.CHAPTERS)}>
                        Open Chapters
                    </Button>
                    <Button variant="outline" className="rounded-2xl border-border/70 font-medium text-[10px] h-10 uppercase tracking-widest" onClick={() => onSidebarTabChange?.(TOOL_IDS.TRANSCRIPT)}>
                        View Transcript
                    </Button>
                </div>
            </div>
          </div>
        );
      case TOOL_IDS.GLOSSARY:
        if (activeGeneratingTools.includes(TOOL_IDS.GLOSSARY)) {
          return (
            <div className="p-12 text-center space-y-6 animate-pulse">
               <div className="w-20 h-20 rounded-[28px] bg-card mx-auto flex items-center justify-center border border-border/70 shadow-sm">
                  <div className="w-8 h-8 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 animate-spin rounded-full" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-lg font-semibold text-foreground">Term Analysis</h3>
                 <p className="text-xs text-muted-foreground">Extracting video-specific jargon...</p>
               </div>
            </div>
          );
        }
        return (
          <div className="p-6">
             <div className="flex items-center gap-4 p-5 rounded-[28px] bg-card border border-border/70 shadow-sm mb-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-sm">
                <Library className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground leading-tight">Video Glossary</h3>
                <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">Terminology Mastery</p>
              </div>
            </div>

            {summaryData?.glossary?.length ? (
                <div className="space-y-4">
                    {summaryData.glossary.map((item: any, i: number) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-6 rounded-[24px] bg-card border border-border/70 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-semibold text-foreground tracking-tight">{item.term}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed pl-11">
                                {item.definition}
                            </p>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="p-8 bg-secondary/30 border border-dashed border-border/70 rounded-[24px] text-center space-y-4">
                  <p className="text-xs text-muted-foreground">No terms analyzed yet.</p>
                </div>
            )}
          </div>
        );
      case TOOL_IDS.RESOURCES:
        if (activeGeneratingTools.includes(TOOL_IDS.RESOURCES)) {
          return (
            <div className="p-12 text-center space-y-6 animate-pulse">
               <div className="w-20 h-20 rounded-[28px] bg-card mx-auto flex items-center justify-center border border-border/70 shadow-sm">
                  <div className="w-8 h-8 border-4 border-cyan-200 dark:border-cyan-800 border-t-cyan-600 animate-spin rounded-full" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-lg font-semibold text-foreground">Finding Mentions</h3>
                 <p className="text-xs text-muted-foreground">Scanning for tools, books and links...</p>
               </div>
            </div>
          );
        }
        return (
          <div className="p-6">
             <div className="flex items-center gap-4 p-5 rounded-[28px] bg-card border border-border/70 shadow-sm mb-8">
              <div className="w-14 h-14 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-sm">
                <ExternalLink className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground leading-tight">Resource Hub</h3>
                <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">External References</p>
              </div>
            </div>

            {summaryData?.resources?.length ? (
                <div className="space-y-4">
                    {summaryData.resources.map((res: any, i: number) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-6 rounded-[24px] bg-card border border-border/70 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-foreground tracking-tight">{res.name}</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed pr-4">
                                        {res.description}
                                    </p>
                                </div>
                                {res.url && (
                                    <a 
                                        href={res.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all ring-4 ring-cyan-50/50 dark:ring-cyan-900/20"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="p-8 bg-secondary/30 border border-dashed border-border rounded-[2.5rem] text-center space-y-4">
                    <p className="text-xs font-bold text-muted-foreground">No resources found yet.</p>
                </div>
            )}
          </div>
        );
      case TOOL_IDS.TRANSCRIPT:
        return (
            <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-secondary text-primary flex items-center justify-center border border-border/70">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Full Transcript</h3>
            </div>
            <div className="p-8 rounded-[24px] bg-secondary/30 border border-border/70 text-sm leading-relaxed text-muted-foreground">
              The full transcript is synchronized with the video player. You can jump to any section using the timestamps in the Summary or Chapters view.
            </div>
          </div>
        );
      case TOOL_IDS.QUIZ:
        if (generatingTools.includes(TOOL_IDS.QUIZ)) {
          return (
            <div className="p-12 text-center space-y-6 animate-pulse">
              <div className="w-20 h-20 rounded-[28px] bg-card mx-auto flex items-center justify-center border border-border/70 shadow-sm">
                  <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 animate-spin rounded-full" />
               </div>
                <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Crafting Quiz</h3>
                <p className="text-xs text-muted-foreground">Designing questions to test your knowledge...</p>
                </div>
            </div>
          );
        }
        return quizData ? (
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading quiz...</div>}>
            <div className="sidebar-quiz-container scale-[0.85] origin-top -mt-4">
              <QuizTab 
                quiz={quizData} 
                onAIAction={onAIAction}
                onGenerateMore={() => onGenerate?.('quiz', true)}
                isGenerating={generatingTools.includes('quiz')}
                quizAIExplanation={quizAIExplanation}
                onClearExplanation={onClearExplanation}
              />
            </div>
          </Suspense>
        ) : null;
      case TOOL_IDS.FLASHCARDS:
        if (generatingTools.includes(TOOL_IDS.FLASHCARDS)) {
          return (
            <div className="p-12 text-center space-y-6 animate-pulse">
              <div className="w-20 h-20 rounded-[28px] bg-card mx-auto flex items-center justify-center border border-border/70 shadow-sm">
                  <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 animate-spin rounded-full" />
               </div>
                <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Generating Cards</h3>
                <p className="text-xs text-muted-foreground">Creating flashcards for spaced repetition...</p>
                </div>
            </div>
          );
        }
        return flashcardsData ? (
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading flashcards...</div>}>
             <div className="scale-[0.85] origin-top -mt-4">
                <Flashcards 
                  cards={flashcardsData} 
                  onAIAction={onAIAction}
                  onGenerateMore={() => onGenerate?.('flashcards', true)}
                  isGenerating={generatingTools.includes('flashcards')}
                  aiExplanation={aiExplanation}
                  onClearExplanation={onClearExplanation}
                />
             </div>
          </Suspense>
        ) : null;
      case TOOL_IDS.ROADMAP:
        if (generatingTools.includes(TOOL_IDS.ROADMAP)) {
          return (
            <div className="p-12 text-center space-y-6 animate-pulse">
              <div className="w-20 h-20 rounded-[28px] bg-card mx-auto flex items-center justify-center border border-border/70 shadow-sm">
                  <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 animate-spin rounded-full" />
               </div>
                <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Mapping Knowledge</h3>
                <p className="text-xs text-muted-foreground">Structuring your personalized learning path...</p>
                </div>
            </div>
          );
        }
        return roadmapData ? (
          <Suspense fallback={<LoadingState />}>
            <RoadmapTab 
              roadmap={roadmapData} 
              onAIAction={onAIAction}
              onGenerateMore={() => onGenerate?.('roadmap', true)}
              isGenerating={generatingTools.includes('roadmap')}
              roadmapAIExplanation={roadmapAIExplanation}
              onClearExplanation={onClearExplanation}
            />
          </Suspense>
        ) : null;
      case TOOL_IDS.MIND_MAP:
        return mindMapData ? (
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading mind map...</div>}>
            <div className="h-[500px] border border-border bg-secondary/20 rounded-3xl overflow-hidden mt-4">
              <MindMapTab mindMap={mindMapData} />
            </div>
          </Suspense>
        ) : null;
      case TOOL_IDS.NOTES:
        if (generatingTools.includes(TOOL_IDS.NOTES)) {
          return (
            <div className="p-12 text-center space-y-6 animate-pulse">
               <div className="w-20 h-20 rounded-[2.5rem] bg-amber-50 mx-auto flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 animate-spin rounded-full" />
               </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Note Crafting</h3>
                  <p className="text-xs text-muted-foreground">Synthesizing study materials...</p>
                </div>
            </div>
          );
        }
        return (
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading notes...</div>}>
            <div className="mt-4 space-y-6">
              <NotesTool />
              <div className="p-8 bg-secondary/50 rounded-[2.5rem] border border-border text-center space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center text-primary">
                    <Sparkles className="h-6 w-6" />
                 </div>
                 <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">AI Study Assistant</h4>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enhance your drafts</p>
                 </div>
                 <Button 
                    onClick={() => onToolClick?.('notes', 'Create comprehensive study notes from this video content.', '[Action]: Generate AI Notes')}
                      className="h-12 w-full rounded-2xl bg-primary text-[10px] font-semibold uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
                 >
                    Inject AI Insights
                 </Button>
              </div>

              {/* AI Breakdown for Notes */}
              <AnimatePresence>
                {currentToolMessages.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[2.5rem] border border-white/10 bg-gray-900 p-8 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-400" />
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-100">AI Insights</span>
                            </div>
                            <button 
                                onClick={() => setShowConversation(true)}
                                className="text-[10px] font-semibold text-amber-400 underline underline-offset-4 hover:text-white"
                            >
                                Discuss in Chat
                            </button>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <RichMessage 
                                content={currentToolMessages[currentToolMessages.length - 1].content} 
                                role="assistant" 
                                className="text-gray-200"
                            />
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <aside className={cn(
      "bg-background flex flex-col overflow-hidden relative h-full max-h-full",
      "w-full border-border transition-all duration-500",
      !isMaximized && "border-l"
    )}>
      {/* Tabbed Header - Stays at top */}
      <div className="px-6 py-4 border-b border-border bg-background/50 backdrop-blur-md z-20 overflow-x-auto scrollbar-none shrink-0">
        <div className="flex items-center gap-2">
           {activeTabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => onSidebarTabChange?.(tab.id)}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border",
                 activeSidebarTab === tab.id 
                   ? "bg-primary text-primary-foreground border-primary shadow-md" 
                   : "bg-secondary text-muted-foreground border-transparent hover:bg-accent"
               )}
             >
               {tab.icon}
               {tab.name}
               {tab.id !== 'learn' && (
                 <X 
                   className="h-3 w-3 ml-2 hover:text-red-400 transition-colors" 
                   onClick={(e) => {
                     e.stopPropagation();
                     onCloseTab?.(tab.id);
                   }} 
                 />
               )}
             </button>
           ))}
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl bg-secondary/50">
               <Plus className="h-4 w-4 text-muted-foreground" />
            </Button>
            <button
              onClick={() => setShowConversation(!showConversation)}
              className={cn(
                "p-2 rounded-lg transition-colors group ml-1 relative",
                showConversation ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              )}
              title="Tool Discussion"
            >
              <MessageSquare className="h-4 w-4" />
              {currentToolMessages.length > 0 && !showConversation && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
            <button
              onClick={onOpenGlobalChat}
              className="p-2 hover:bg-secondary rounded-lg transition-colors group ml-1"
              title="Open Full AI Chat"
            >
              <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </button>
            <button 
              onClick={onMaximize}
              className="p-2 hover:bg-secondary rounded-lg transition-colors group ml-1"
              title={isMaximized ? "Minimize Sidebar" : "Maximize Sidebar"}
            >
              <Maximize2 className={cn("h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform", isMaximized && "rotate-180")} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {showConversation ? (
            <motion.div 
              key="conversation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 z-20 bg-background flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-md z-30 shrink-0">
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setShowConversation(false)}
                       className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                     >
                       <ChevronLeftCircle className="h-4 w-4" />
                     </button>
                     <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                           {activeSidebarTab} Discussion
                        </span>
                     </div>
                  </div>
                  <button 
                    onClick={() => setShowConversation(false)}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                  >
                    Back to Tool
                  </button>
              </div>

              <ScrollArea className="flex-1 px-6 py-6">
                <div className="space-y-8 pb-10">
                  {currentToolMessages.length === 0 && !isChatLoading && (
                    <div className="rounded-3xl border border-dashed border-border bg-secondary/20 p-8 text-center space-y-3">
                      <p className="text-sm font-semibold text-foreground">Start tool discussion</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Ask a focused question from the input below. The response will stay here so your learning flow is not interrupted.
                      </p>
                    </div>
                  )}
                  {currentToolMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex flex-col gap-3",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                        <div className="flex items-center gap-2 px-1">
                        {msg.role === 'assistant' ? (
                          <>
                            <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center">
                               <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Genius AI</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">You</span>
                            <div className="w-5 h-5 rounded-lg bg-secondary flex items-center justify-center">
                               <UserIcon className="h-2.5 w-2.5 text-muted-foreground" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className={cn(
                        "max-w-[90%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-secondary text-secondary-foreground rounded-tl-none border border-border"
                      )}>
                        {msg.role === 'assistant' ? (
                          <RichMessage content={msg.content} role={msg.role} />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex flex-col items-start gap-3 animate-pulse">
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-5 h-5 rounded-lg bg-secondary flex items-center justify-center">
                           <Sparkles className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Genius is thinking...</span>
                      </div>
                      <div className="w-[70%] h-20 bg-secondary rounded-2xl rounded-tl-none border border-border" />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div 
              key="tool-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-8 space-y-8">
                {activeSidebarTab === 'learn' ? (
                  <>
                    {/* Study Session Presets */}
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Session Progress</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{completedSteps}/3 steps completed</p>
                          </div>
                          <button
                            onClick={resetStudyProgress}
                            className="rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Reset
                          </button>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className={cn("rounded-xl border px-2 py-2 text-center", studyProgress.understand ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground")}>
                            <p className="text-[9px] font-black uppercase tracking-widest">Understand</p>
                          </div>
                          <div className={cn("rounded-xl border px-2 py-2 text-center", studyProgress.practice ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground")}>
                            <p className="text-[9px] font-black uppercase tracking-widest">Practice</p>
                          </div>
                          <div className={cn("rounded-xl border px-2 py-2 text-center", studyProgress.apply ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground")}>
                            <p className="text-[9px] font-black uppercase tracking-widest">Apply</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-border bg-background p-3 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Recommended Next</p>
                          <p className="text-sm font-semibold text-foreground">{nextStep.label}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{nextStep.description}</p>
                          <Button
                            onClick={nextStep.action}
                            className="h-9 rounded-xl px-4 text-[10px] font-semibold uppercase tracking-widest"
                          >
                            {nextStep.actionLabel}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-muted-foreground opacity-70 uppercase tracking-widest">Study Sessions</h3>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Start quickly</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 pb-8 border-b border-border">
                        <button
                          onClick={() => {
                            onSidebarTabChange?.(TOOL_IDS.SUMMARY);
                            onToolClick?.(TOOL_IDS.SUMMARY, "Give me a 5-minute revision with only high-impact points.");
                            markStudyStepComplete("understand");
                            setChatMode("tool");
                            setShowConversation(true);
                          }}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">Quick Revision</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Compressed recap for fast recall</p>
                        </button>
                        <button
                          onClick={() => {
                            onSidebarTabChange?.(TOOL_IDS.QUIZ);
                            onToolClick?.(TOOL_IDS.QUIZ, "Prepare me for interview-style questions from this topic.");
                            markStudyStepComplete("practice");
                            setChatMode("tool");
                            setShowConversation(true);
                          }}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">Interview Prep</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Practice with challenge questions</p>
                        </button>
                        <button
                          onClick={() => {
                            onSidebarTabChange?.(TOOL_IDS.ROADMAP);
                            onToolClick?.(TOOL_IDS.ROADMAP, "Create a practical execution plan with milestones and checkpoints.");
                            markStudyStepComplete("apply");
                            setChatMode("tool");
                            setShowConversation(true);
                          }}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">Deep Study Plan</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Step-by-step mastery workflow</p>
                        </button>
                      </div>
                    </div>

                    {/* Guided Workflow */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-muted-foreground opacity-70 uppercase tracking-widest">Learning Flow</h3>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Pick next step</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 pb-8 border-b border-border">
                        <button
                          onClick={() => {
                            markStudyStepComplete("understand");
                            onToolClick?.(TOOL_IDS.SUMMARY);
                          }}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">1. Understand</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Read overview and key points</p>
                        </button>
                        <button
                          onClick={() => {
                            markStudyStepComplete("practice");
                            onToolClick?.(TOOL_IDS.QUIZ);
                          }}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">2. Practice</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Test yourself with quiz and flashcards</p>
                        </button>
                        <button
                          onClick={() => {
                            markStudyStepComplete("apply");
                            onToolClick?.(TOOL_IDS.ROADMAP);
                          }}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary/80">3. Apply</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Generate action roadmap and notes</p>
                        </button>
                      </div>
                    </div>

                    {/* Available Tools Grid */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-muted-foreground px-1 opacity-70 mt-2 uppercase tracking-widest">Generate</h3>
                      <div className="grid grid-cols-2 gap-3 pb-8 border-b border-border">
                        {tools.map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onToolClick?.(tool.id);
                            }}
                            className={cn(
                              "flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] group",
                              "bg-card border-border hover:border-primary hover:shadow-md hover:shadow-foreground/[0.02]"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                tool.bg, tool.color
                              )}>
                                {tool.icon}
                              </div>
                              <div className="text-left flex items-center gap-2">
                                <p className="text-[13px] font-bold text-foreground">{tool.name}</p>
                                {tool.isNew && (
                                  <span className="bg-emerald-50 dark:bg-emerald-900/40 text-[9px] font-black text-emerald-500 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800 uppercase tracking-tighter">New</span>
                                )}
                              </div>
                            </div>
                            <Sliders className="h-3.5 w-3.5 text-muted-foreground opacity-20 group-hover:opacity-40 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generated Items Section - My Sets */}
                    <div className="space-y-4 pt-4 pb-12">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground opacity-70">My Sets</h3>
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1 opacity-40">
                              <Sliders className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-semibold">1</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {sets.length > 0 ? sets.map((set) => (
                          <button 
                            key={set.id} 
                            disabled={set.isGenerating}
                            onClick={() => onToolClick?.(set.type)}
                            className={cn(
                              "group w-full rounded-3xl border border-border bg-card p-4 transition-all",
                              set.isGenerating ? "cursor-not-allowed opacity-60" : "hover:border-border/80 hover:shadow-md hover:shadow-foreground/[0.04]"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                              set.isGenerating ? "bg-secondary text-muted-foreground" : (
                                set.type === TOOL_IDS.QUIZ ? "bg-red-500/10 text-red-500" :
                                set.type === TOOL_IDS.ROADMAP ? "bg-emerald-500/10 text-emerald-500" :
                                set.type === TOOL_IDS.FLASHCARDS ? "bg-amber-500/10 text-amber-500" :
                                set.type === TOOL_IDS.SUMMARY ? "bg-blue-500/10 text-blue-500" :
                                "bg-indigo-500/10 text-indigo-500"
                              )
                            )}>
                               {set.isGenerating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" /> : (
                                 set.type === TOOL_IDS.QUIZ ? <HelpCircle className="h-5 w-5" /> :
                                  set.type === TOOL_IDS.ROADMAP ? <Target className="h-5 w-5" /> :
                                  set.type === TOOL_IDS.FLASHCARDS ? <Layers className="h-5 w-5" /> :
                                  set.type === TOOL_IDS.SUMMARY ? <FileText className="h-5 w-5" /> :
                                  <Headphones className="h-5 w-5" />
                               )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="line-clamp-1 text-[13px] font-semibold text-foreground">{set.name}</p>
                              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground opacity-80">
                                  {set.isGenerating ? 'Content is being generated...' : (
                                    set.type === TOOL_IDS.QUIZ ? '10 questions left • All topics' :
                                     set.type === TOOL_IDS.SUMMARY ? 'Detailed Summary • All topics' :
                                     set.type === TOOL_IDS.ROADMAP ? 'Personalized Learning Path' :
                                     'Processed Analysis'
                                  )}
                              </p>
                            </div>
                             {!set.isGenerating && <MoreVertical className="h-4 w-4 text-muted-foreground/50" />}
                          </button>
                        )) : (
                            <div className="space-y-3 p-10 text-center opacity-40">
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2.5rem] border border-border bg-secondary">
                                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                             </div>
                              <p className="text-xs font-medium text-muted-foreground">Generate your first set to see it here.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pb-12">
                    {renderActiveTool()}
                  </div>
                )}
              </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Large Bottom Input Section - Fixed at bottom */}
      <div className="shrink-0 border-t border-border bg-background p-6 pt-2">
         <div className="mb-3 flex items-center gap-2 px-2">
            <button
              onClick={() => {
                setChatMode("tool");
                setShowConversation(true);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                chatMode === "tool" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
              )}
            >
              Tool Thread ({currentToolMessages.length})
            </button>
            <button
              onClick={() => {
                setChatMode("coach");
                onOpenGlobalChat?.();
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                chatMode === "coach" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
              )}
            >
              Coach Thread ({coachMessagesCount})
            </button>
         </div>

         <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-tight text-muted-foreground">Mode:</span>
            <button
              onClick={() => setChatMode("tool")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
                chatMode === "tool" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
              )}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Tool Discussion</span>
            </button>
            <button
              onClick={() => setChatMode("coach")}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
                chatMode === "coach" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
              )}
            >
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">AI Coach</span>
            </button>
            </div>
            <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
               <Plus className="h-4 w-4 cursor-pointer" />
               <History className="h-4 w-4 cursor-pointer" />
            </div>
         </div>

         <div className="relative group">
            <textarea 
               value={askInput}
               onChange={(e) => setAskInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAsk())}
              placeholder={chatMode === "coach" ? "Ask AI coach for strategy, preparation, or deep understanding" : "Ask about the current tool output"}
              className="scrollbar-none h-14 w-full resize-none rounded-3xl border border-border bg-secondary/50 py-4 pl-6 pr-24 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-border focus:bg-background focus:outline-none focus:ring-8 focus:ring-foreground/[0.04]"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
               <button 
                  onClick={handleAsk}
                className="flex items-center gap-2 rounded-2xl bg-primary py-2 pl-4 pr-3 text-primary-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
               >
                  <Mic className="h-3.5 w-3.5" />
                <span className="-mb-0.5 text-[11px] font-semibold uppercase tracking-widest">Send</span>
               </button>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default LearnTools;
