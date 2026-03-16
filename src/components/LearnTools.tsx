import { 
  Mic, 
  Headphones,
  Video,
  FileText,
  HelpCircle,
  Layers,
  StickyNote,
  GraduationCap,
  Settings2,
  Plus,
  Send,
  CheckCircle2,
  Loader2,
  Brain,
  Map,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LearnToolsProps {
  onToolClick?: (toolId: string, value?: string) => void;
  sets?: { id: string; name: string; date: string; type: string }[];
  hasQuiz?: boolean;
  hasFlashcards?: boolean;
  hasRoadmap?: boolean;
  hasMindMap?: boolean;
  isChatLoading?: boolean;
  isMobile?: boolean;
}

const LearnTools = ({ onToolClick, sets = [], hasQuiz, hasFlashcards, hasRoadmap, hasMindMap, isChatLoading, isMobile }: LearnToolsProps) => {
  const [question, setQuestion] = useState("");
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const tools = [
    { id: 'podcast', name: 'Podcast', icon: <Headphones className="h-5 w-5" />, type: 'chat' },
    { id: 'deepdive', name: 'Deep Dive', icon: <Video className="h-5 w-5" />, type: 'chat' },
    { id: 'roadmap', name: 'Summary', icon: <FileText className="h-5 w-5" />, type: 'scroll', available: hasRoadmap },
    { id: 'quiz', name: 'Quiz', icon: <HelpCircle className="h-5 w-5" />, type: 'scroll', available: hasQuiz },
    { id: 'flashcards', name: 'Flashcards', icon: <Layers className="h-5 w-5" />, type: 'scroll', available: hasFlashcards },
    { id: 'notes', name: 'Notes', icon: <StickyNote className="h-5 w-5" />, type: 'chat' },
    { id: 'mindmap', name: 'Mind Map', icon: <GraduationCap className="h-5 w-5" />, type: 'scroll', available: hasMindMap },
  ];

  const handleAsk = () => {
    if (question.trim()) {
      onToolClick?.("ask", question.trim());
      setQuestion("");
    }
  };

  const handleToolClick = (toolId: string) => {
    setLastClicked(toolId);
    onToolClick?.(toolId);
  };

  return (
    <aside className={cn(
      "bg-white flex-col overflow-hidden",
      isMobile 
        ? "flex w-full h-auto border-0" 
        : "hidden lg:flex w-[340px] border-l border-gray-100 h-screen"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <h2 className="text-xl font-bold text-foreground">Study Tools</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-gray-50 hover:bg-gray-100">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-none">
        <div className="grid grid-cols-2 gap-3 mb-8">
          {tools.map((tool) => {
            const isActive = lastClicked === tool.id && isChatLoading;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                disabled={isActive}
                className={cn(
                  "flex flex-col items-start p-4 rounded-3xl border transition-all text-left group gap-3 aspect-square justify-between",
                  isActive 
                    ? "bg-blue-50 border-blue-200 cursor-wait shadow-inner" 
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-gray-50",
                  isActive ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-900 group-hover:bg-black group-hover:text-white"
                )}>
                  {isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : tool.icon}
                </div>
                <div>
                   <p className="text-sm font-bold text-foreground">{tool.name}</p>
                   {tool.type === 'chat' && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">AI Tool</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Generated Content Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Generated Sets</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{sets.length}</span>
          </div>
          {sets.length > 0 ? (
            <div className="space-y-3">
              {sets.map((set) => (
                <button 
                  key={set.id} 
                  onClick={() => handleToolClick(set.type)}
                  className="w-full flex items-center justify-between p-4 rounded-[24px] bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                      set.type === 'quiz' ? "bg-red-50 text-red-500" :
                      set.type === 'flashcards' ? "bg-purple-50 text-purple-500" :
                      set.type === 'roadmap' ? "bg-blue-50 text-blue-500" :
                      "bg-gray-50 text-gray-400"
                    )}>
                      {set.type === 'quiz' ? <Brain className="h-5 w-5" /> :
                       set.type === 'flashcards' ? <Layers className="h-5 w-5" /> :
                       set.type === 'roadmap' ? <Map className="h-5 w-5" /> :
                       <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{set.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground">{set.date}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <Layers className="h-6 w-6 text-gray-200" />
              </div>
              <p className="text-sm font-bold text-gray-400">Empty Library</p>
              <p className="text-xs text-gray-300 mt-1 max-w-[160px] mx-auto leading-relaxed">Generate flashcards or quizzes to see them here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ask Anything Input */}
      <div className="p-6 border-t border-gray-100 bg-white">
        <div className="relative group">
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Search transcript..." 
            className="w-full h-14 pl-5 pr-20 rounded-[20px] border border-gray-100 bg-gray-50/50 focus:outline-none focus:bg-white focus:border-gray-200 focus:shadow-sm text-sm font-medium transition-all placeholder:text-gray-400"
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-1">
            <button 
              onClick={() => toast.info("Voice input coming soon!")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors"
              aria-label="Voice input (coming soon)"
            >
              <Mic className="h-3 w-3" />
              Voice
            </button>
            {question.trim() && (
              <Button 
                onClick={handleAsk}
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl text-black hover:bg-gray-100 transition-all"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LearnTools;
