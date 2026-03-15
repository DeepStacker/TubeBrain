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
  X,
  Plus,
  Filter,
  MoreVertical,
  Send
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface LearnToolsProps {
  onToolClick?: (toolId: string, value?: string) => void;
  sets?: { id: string; name: string; date: string }[];
}

const LearnTools = ({ onToolClick, sets = [] }: LearnToolsProps) => {
  const [question, setQuestion] = useState("");

  const tools = [
    { id: 'podcast', name: 'Podcast', icon: <Headphones className="h-5 w-5" /> },
    { id: 'deepdive', name: 'Video', icon: <Video className="h-5 w-5" /> },
    { id: 'roadmap', name: 'Summary', icon: <FileText className="h-5 w-5" /> },
    { id: 'quiz', name: 'Quiz', icon: <HelpCircle className="h-5 w-5" /> },
    { id: 'flashcards', name: 'Flashcards', icon: <Layers className="h-5 w-5" /> },
    { id: 'ask', name: 'Notes', icon: <StickyNote className="h-5 w-5" /> },
    { id: 'mindmap', name: 'Lesson Plan', icon: <GraduationCap className="h-5 w-5" />, badge: 'New' },
  ];

  const handleAsk = () => {
    if (question.trim()) {
      onToolClick?.("ask", question.trim());
      setQuestion("");
    }
  };

  return (
    <aside className="w-[340px] border-l bg-white h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-semibold text-foreground">Learn Tab</span>
          <button className="p-0.5 hover:bg-gray-100 rounded transition-colors">
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <Plus className="h-4 w-4 text-gray-400" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        </div>
      </div>

      {/* Generate Section */}
      <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-none">
        <h3 className="text-xs font-semibold text-muted-foreground mb-4">Generate</h3>
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolClick?.(tool.id)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100/80 hover:border-gray-200 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {tool.icon}
                </span>
                <span className="text-sm font-medium text-foreground">{tool.name}</span>
                {tool.badge && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{tool.badge}</span>
                )}
              </div>
              <Settings2 className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          ))}
        </div>

        {/* My Sets Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground">My Sets</h3>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
              </button>
              <span className="text-xs text-muted-foreground">{sets.length}</span>
            </div>
          </div>
          {sets.length > 0 ? (
            <div className="space-y-2">
              {sets.map((set) => (
                <div key={set.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100/80 transition-all group">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{set.name}</p>
                      <p className="text-[11px] text-muted-foreground">{set.date}</p>
                    </div>
                  </div>
                  <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all">
                    <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground">No sets yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Ask Anything Input */}
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="relative">
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask anything" 
            className="w-full h-11 pl-4 pr-20 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 text-sm transition-all placeholder:text-gray-400"
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-1">
            {question.trim() ? (
              <Button 
                onClick={handleAsk}
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors">
              <Mic className="h-3 w-3" />
              Voice
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LearnTools;
