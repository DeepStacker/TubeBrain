import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Bold, Italic, List, ListOrdered, Save, Trash2, FileText, Type, Maximize2, 
  Check, X, Sparkles, Wand2, Search, BookOpen, Clock, Quote, Download, 
  Heading1, Heading2, Code, Highlighter, Share2
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAnalysisContext } from "@/contexts/AnalysisContext";
import { motion, AnimatePresence } from "framer-motion";
import { RichMessage } from "./RichMessage";

const NotesTool = () => {
  const { 
    userNotes, 
    updateUserNotes, 
    isNotesSaving, 
    activeAnalysisId,
    currentTime,
    transcript,
    handleToolClick,
    handleGenerateTool,
    chatMessages
  } = useAnalysisContext();

  const [title, setTitle] = useState("Study Session Notes");
  const [internalContent, setInternalContent] = useState(userNotes);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Sync internal content with global state
  useEffect(() => {
    setInternalContent(userNotes);
  }, [userNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setInternalContent(newContent);
    updateUserNotes(newContent);
  };

  const insertText = (before: string, after: string = "") => {
    const el = textAreaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selection = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    setInternalContent(newText);
    updateUserNotes(newText);
    
    // Reset focus and selection
    setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertTimestamp = () => {
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const timeStr = `[${minutes}:${seconds < 10 ? '0' : ''}${seconds}]`;
    insertText(`\n${timeStr} `, "");
  };

  const insertLastCaption = () => {
      // Find the segment closest to currentTime
      // This logic is simplified; in a real app we'd parse the transcript JSON
      insertText(`\n> (Clip at ${Math.floor(currentTime)}s): `, "\n");
  };

  const handleExport = (format: 'md' | 'pdf') => {
      const blob = new Blob([`# ${title}\n\n${internalContent}`], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.md`;
      a.click();
      URL.revokeObjectURL(url);
  };

  // Find AI suggestions for notes
  const aiNotesDraft = chatMessages.find(m => m.toolId === 'notes' && m.role === 'assistant')?.content;

  return (
    <div className="relative flex h-[calc(100vh-250px)] flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-xl">
      {/* Primary Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-border bg-secondary/40 p-3 scrollbar-none">
        <div className="flex rounded-xl border border-border bg-background p-0.5 shadow-sm">
          <Button onClick={() => insertText("**", "**")} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 hover:bg-secondary"><Bold className="h-3 w-3" /></Button>
          <Button onClick={() => insertText("_", "_")} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 hover:bg-secondary"><Italic className="h-3 w-3" /></Button>
          <Button onClick={() => insertText("\n# ", "")} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 hover:bg-secondary"><Heading1 className="h-3 w-3" /></Button>
          <Button onClick={() => insertText("\n## ", "")} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 hover:bg-secondary"><Heading2 className="h-3 w-3" /></Button>
        </div>
        
        <div className="mx-1 h-4 w-px bg-border" />
        
        <div className="flex rounded-xl border border-border bg-background p-0.5 shadow-sm">
          <Button onClick={() => insertText("\n- ", "")} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 hover:bg-secondary"><List className="h-3 w-3" /></Button>
          <Button onClick={() => insertText("\n1. ", "")} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 hover:bg-secondary"><ListOrdered className="h-3 w-3" /></Button>
          <Button onClick={() => insertText("`", "`")} variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 hover:bg-secondary"><Code className="h-3 w-3" /></Button>
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <div className="flex rounded-xl border border-border bg-background p-0.5 shadow-sm">
          <Button onClick={insertTimestamp} title="Current Timestamp" variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 text-indigo-600 hover:bg-indigo-500/10"><Clock className="h-3 w-3" /></Button>
          <Button onClick={insertLastCaption} title="Insert Caption" variant="ghost" size="sm" className="h-7 w-7 rounded-lg p-0 text-indigo-600 hover:bg-indigo-500/10"><Quote className="h-3 w-3" /></Button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button onClick={() => handleExport('md')} variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
            <Download className="h-3 w-3" /> Export
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
            {isNotesSaving ? <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* AI Action Strip */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-indigo-500/5 p-3 scrollbar-none">
        <div className="flex items-center gap-1.5 mr-2">
            <Sparkles className="h-3 w-3 text-indigo-600" />
        <span className="text-[10px] font-semibold uppercase tracking-tighter text-indigo-600">AI Assistant</span>
        </div>
        <Button 
            onClick={() => handleGenerateTool('notes')}
            variant="outline" 
            size="sm" 
            className="h-7 rounded-full border-indigo-300/60 bg-background text-[9px] font-semibold uppercase tracking-wider text-indigo-600 shadow-sm transition-all hover:bg-indigo-600 hover:text-white"
        >
            <Wand2 className="h-2.5 w-2.5 mr-1" /> Enhance Notes
        </Button>
        <Button 
            onClick={() => handleToolClick('ask', 'Summarize my current study notes into a 3-sentence executive summary.', '[Action]: Summarize Notes')}
            variant="outline" 
            size="sm" 
            className="h-7 rounded-full border-purple-300/60 bg-background text-[9px] font-semibold uppercase tracking-wider text-purple-600 shadow-sm transition-all hover:bg-purple-600 hover:text-white"
        >
            Executive Summary
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
        {/* Title Input */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-tighter text-indigo-600">Active Session</span>
          </div>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            placeholder="Untitled Wisdom"
          />
        </div>

        {/* AI Draft Suggestion */}
        <AnimatePresence>
            {aiNotesDraft && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="relative mx-8 mb-6 rounded-[2rem] bg-indigo-900 p-6 text-white shadow-xl shadow-indigo-500/20 group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-300" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200">AI Enhancement Draft</span>
                        </div>
                        <Button 
                            onClick={() => {
                                const merged = `${internalContent}\n\n---\n### AI Suggestions\n${aiNotesDraft}`;
                                setInternalContent(merged);
                                updateUserNotes(merged);
                            }}
                            className="h-8 rounded-xl bg-white px-4 text-[10px] font-semibold uppercase text-indigo-600 shadow-lg transition-all active:scale-95 hover:bg-indigo-50"
                        >
                            Merge with My Notes
                        </Button>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none opacity-90">
                        <RichMessage content={aiNotesDraft} role="assistant" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="px-8 pb-8">
          <textarea 
            ref={textAreaRef}
            value={internalContent}
            onChange={handleChange}
            className="scrollbar-none min-h-[500px] w-full resize-none bg-transparent text-base font-medium leading-relaxed text-foreground placeholder:italic placeholder:text-muted-foreground/50 focus:outline-none"
            placeholder="Capture your epiphanies here... Use the toolbar above to link timestamps or get AI writing help."
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between border-t border-border bg-background p-4 px-8 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Type className="h-3 w-3" /> {internalContent.split(/\s+/).filter(Boolean).length} Words</span>
          <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" /> {internalContent.length} Chars</span>
        </div>
        <div className="flex items-center gap-1.5 text-indigo-600">
          <div className={cn("w-1.5 h-1.5 rounded-full bg-indigo-600", isNotesSaving && "animate-ping")} />
          <span>{isNotesSaving ? "Saving to Cloud" : "Fully Synced"}</span>
        </div>
      </div>
    </div>
  );
};

export default NotesTool;
