import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  ChevronRight,
  MessageSquare,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { RichMessage } from "./RichMessage";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SpaceChatProps {
  spaceId: string;
  onSendChat: (spaceId: string, message: string, onChunk: (chunk: string) => void) => Promise<void>;
  initialMessages?: Message[];
  spaceName?: string;
}

const EMPTY_MESSAGES: Message[] = [];

const loadDraft = (spaceId: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(`youtube-genius:space-chat-draft:${spaceId}`) || "";
  } catch {
    return "";
  }
};

const saveDraft = (spaceId: string, value: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(`youtube-genius:space-chat-draft:${spaceId}`, value);
    } else {
      window.localStorage.removeItem(`youtube-genius:space-chat-draft:${spaceId}`);
    }
  } catch {
    // Draft persistence is optional.
  }
};


export default function SpaceChat({ spaceId, onSendChat, initialMessages, spaceName }: SpaceChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => initialMessages ?? EMPTY_MESSAGES);
  const [input, setInput] = useState(() => loadDraft(spaceId));
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => ([
    "Summarize everything in this space",
    "What are the common themes?",
    "Help me study for an exam",
  ]), []);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    saveDraft(spaceId, input);
  }, [input, spaceId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      let currentResponse = "";
      const placeholderIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      
      await onSendChat(spaceId, userMsg.content, (chunk) => {
        currentResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[placeholderIndex]) {
            newMessages[placeholderIndex].content = currentResponse;
          }
          return newMessages;
        });
      });
    } catch (err) {
      console.error("Space chat error:", err);
      setMessages(prev => prev.filter((message, index) => index !== prev.length - 1 || message.content.length > 0));
      toast.error("Space chat could not respond right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-lg shadow-foreground/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 bg-background/80 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground font-display">{spaceName || "Space Genius"}</p>
            <div className="flex items-center gap-2">
              <div className={cn("h-1.5 w-1.5 rounded-full", isLoading ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40")} />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">{isLoading ? "Synthesizing" : `${messages.length} messages`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 scrollbar-thin" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="mx-auto flex max-w-[22rem] flex-col items-center px-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] border border-border/70 bg-secondary/40 shadow-inner">
              <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-foreground font-display">Ask your space</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">I can answer questions using the videos, documents, and notes you’ve added here.</p>
            <div className="mt-8 w-full space-y-2">
              {suggestions.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-3 rounded-2xl border-border/70 bg-background/60 px-4 py-5 text-left text-[11px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => setInput(prompt)}
                >
                  <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
                  <span className="leading-5">{prompt}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            key={i}
            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "justify-start")}
          >
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all",
              msg.role === "assistant" ? "border-primary/10 bg-primary shadow-primary/20" : "border-border/70 bg-background"
            )}>
              {msg.role === "assistant" ? <Bot className="h-4.5 w-4.5 text-primary-foreground" /> : <User className="h-4.5 w-4.5 text-muted-foreground" />}
            </div>
            <div className={cn(
              "max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 transition-all",
              msg.role === "assistant" 
                ? "rounded-tl-none border border-border/60 bg-background/80 text-foreground shadow-sm" 
                : "rounded-tr-none bg-primary text-primary-foreground shadow-lg shadow-primary/10"
            )}>
              {msg.role === "assistant" ? <RichMessage content={msg.content} role="assistant" /> : <p>{msg.content}</p>}
            </div>
          </motion.div>
        ))}

        {isLoading && !messages[messages.length - 1]?.content && (
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Bot className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2 rounded-[1.5rem] rounded-tl-none border border-border/60 bg-background/80 px-4 py-3 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Thinking</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/70 bg-background/85 p-4 backdrop-blur-xl">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Search across all materials..."
            className="min-h-[68px] max-h-[160px] w-full resize-none rounded-[1.5rem] border border-border/70 bg-background p-4 pr-12 text-sm leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground/45 focus:border-primary/30 focus:ring-4 focus:ring-primary/5"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
