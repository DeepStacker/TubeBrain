import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, User, X, MessageSquare, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { RichMessage } from "./RichMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Suggestion {
  label: string;
  prompt: string;
}

interface AIChatSidebarProps {
  messages: Message[];
  onSendMessage: (message: string, forcedContext?: string | null) => void | Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  contextSnippet?: string | null;
  onClearContext?: () => void;
  title?: string;
  subtitle?: string;
  storageKey?: string;
  suggestions?: Suggestion[];
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { label: "Executive summary", prompt: "Summarize the key points and main takeaways from this video." },
  { label: "Core concepts", prompt: "What are the most important concepts explained in this video?" },
  { label: "Study notes", prompt: "Create concise study notes from this video's content." },
];

const loadDraft = (storageKey?: string) => {
  if (typeof window === "undefined" || !storageKey) {
    return "";
  }

  try {
    return window.localStorage.getItem(storageKey) || "";
  } catch {
    return "";
  }
};

const saveDraft = (storageKey: string | undefined, value: string) => {
  if (typeof window === "undefined" || !storageKey) {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(storageKey, value);
    } else {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // Ignore storage failures; draft persistence is a convenience.
  }
};


const AIChatSidebar = ({
  messages,
  onSendMessage,
  isOpen,
  onClose,
  isLoading,
  contextSnippet,
  onClearContext,
  title = "AI Intelligence",
  subtitle = "Ask deep questions, clarify concepts, or request a focused summary.",
  storageKey,
  suggestions = DEFAULT_SUGGESTIONS,
}: AIChatSidebarProps) => {
  const [input, setInput] = useState(() => loadDraft(storageKey));
  const scrollRef = useRef<HTMLDivElement>(null);
  const suggestionList = useMemo(() => suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS, [suggestions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    setInput(loadDraft(storageKey));
  }, [storageKey]);

  useEffect(() => {
    saveDraft(storageKey, input);
  }, [input, storageKey]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    const message = trimmedInput || (contextSnippet ? "Explain this context in more detail." : "");

    if (!message) {
      return;
    }

    await onSendMessage(message, contextSnippet || null);
    setInput("");
  };

  const messageCount = messages.length;
  const assistantCount = messages.filter((message) => message.role === "assistant").length;

  return (
    <>
      {isOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[55] bg-background/35 backdrop-blur-[2px]"
          aria-label="Close chat overlay"
        />
      )}

      <motion.aside
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: isOpen ? 0 : 420, opacity: isOpen ? 1 : 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 180 }}
        className={cn(
          "fixed right-4 top-4 bottom-4 z-[60] flex w-[min(92vw,28rem)] flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.45)] backdrop-blur-3xl",
          !isOpen && "pointer-events-none"
        )}
        aria-hidden={!isOpen}
      >
        <div className="relative border-b border-border/70 bg-gradient-to-b from-background/90 to-card/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/15">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">{title}</p>
                <h2 className="mt-1 truncate text-base font-bold text-foreground">{subtitle}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1", isLoading ? "border-primary/25 bg-primary/5 text-primary" : "border-border bg-background/50") }>
                    <span className={cn("h-1.5 w-1.5 rounded-full", isLoading ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/35")} />
                    {isLoading ? "Thinking" : `${messageCount} messages`}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-2.5 py-1">
                    <MessageSquare className="h-3 w-3" />
                    {assistantCount} replies
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-thin" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-[18rem] flex-col items-center text-center py-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-border/70 bg-secondary/40 shadow-inner">
                <Bot className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-foreground">Interactive learning</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Ask a precise follow-up, push for a deeper explanation, or request a condensed summary.</p>

              <div className="mt-8 w-full space-y-3 text-left">
                {suggestionList.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-6 text-left text-[11px] font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => onSendMessage(suggestion.prompt, contextSnippet || null)}
                  >
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary/70" />
                    <span className="leading-5">{suggestion.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ y: 16, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 120, delay: i * 0.03 }}
                  key={`${msg.role}-${i}`}
                  className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "items-start")}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border",
                    msg.role === "assistant" ? "border-primary/10 bg-primary shadow-lg shadow-primary/15" : "border-border/70 bg-background"
                  )}>
                    {msg.role === "assistant" ? (
                      <Bot className="h-4.5 w-4.5 text-primary-foreground" />
                    ) : (
                      <User className="h-4.5 w-4.5 text-muted-foreground" />
                    )}
                  </div>

                  <div className={cn(
                    "max-w-[82%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm",
                    msg.role === "assistant"
                      ? "rounded-tl-none border border-border/60 bg-background/80 text-foreground"
                      : "rounded-tr-none bg-primary text-primary-foreground shadow-primary/10"
                  )}>
                    {msg.role === "assistant" ? (
                      <RichMessage content={msg.content} role="assistant" />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/10 bg-primary shadow-lg shadow-primary/15">
                    <Bot className="h-4.5 w-4.5 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-[1.5rem] rounded-tl-none border border-border/60 bg-background/80 px-4 py-3 shadow-sm">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.24s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.12s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border/70 bg-background/85 p-5 backdrop-blur-xl">
          <AnimatePresence>
            {contextSnippet && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Focused context</p>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-foreground/85">{contextSnippet}</p>
                {onClearContext && (
                  <button
                    onClick={onClearContext}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Clear context
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void handleSend();
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask anything about the video..."
              className="min-h-[72px] max-h-[180px] w-full resize-none rounded-[1.5rem] border border-border/70 bg-background px-4 py-4 pr-14 text-sm leading-6 text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-primary/30 focus:ring-4 focus:ring-primary/5"
            />
            <button
              onClick={() => void handleSend()}
              disabled={(!input.trim() && !contextSnippet) || isLoading}
              className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:scale-100"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/50">
            <span>Enter to send · Shift+Enter for a new line</span>
            <span>Cmd/Ctrl+Enter sends too</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default AIChatSidebar;
