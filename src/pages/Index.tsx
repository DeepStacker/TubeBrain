import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Sparkles, Zap, BookOpen, Globe, Brain, FileText, HelpCircle } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import VideoPreview from "@/components/VideoPreview";
import SummaryDisplay from "@/components/SummaryDisplay";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ChatbotPanel from "@/components/ChatbotPanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

interface VideoData {
  title: string;
  channel: string;
  duration: string;
  views: string;
  likes: string;
  published: string;
}

const features = [
  { icon: <Sparkles className="h-5 w-5" />, title: "Multi-AI Engine", desc: "5 AI providers at your fingertips" },
  { icon: <Globe className="h-5 w-5" />, title: "19 Languages", desc: "Get summaries in any language" },
  { icon: <FileText className="h-5 w-5" />, title: "Full Transcripts", desc: "Word-by-word with timestamps" },
  { icon: <Brain className="h-5 w-5" />, title: "Learning Lab", desc: "Roadmaps & guided learning" },
  { icon: <HelpCircle className="h-5 w-5" />, title: "AI Quizzes", desc: "Test your knowledge instantly" },
  { icon: <Zap className="h-5 w-5" />, title: "Deep Dive Mode", desc: "Synthesize up to 3 videos" },
];

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleSubmit = async (urls: string[], options: any) => {
    const ids = urls.map(u => extractVideoId(u)).filter(Boolean) as string[];
    if (!ids.length) {
      toast.error("No valid YouTube URLs found.");
      return;
    }

    setVideoIds(ids);
    setIsLoading(true);
    setSummaryData(null);
    setTranscript(null);
    setVideoData(null);
    setMetadata(null);

    try {
      const { data, error } = await supabase.functions.invoke("summarize", {
        body: { videoIds: ids, ...options },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVideoData(data.videoInfo);
      setSummaryData(data.summary);
      setTranscript(data.allTranscripts || data.transcript);
      setMetadata(data.metadata);

      const label = ids.length > 1 ? `Synthesized ${ids.length} videos!` : "Analysis complete!";
      toast.success(label);
    } catch (err: any) {
      console.error("Summarize error:", err);
      toast.error(err.message || "Failed to analyze. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Seeks the primary YouTube iframe player using postMessage API
  const handleTimestampClick = (seconds: number) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
      "*"
    );
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20">
            <Youtube className="h-3.5 w-3.5" />
            YouTube Genius · Advanced AI Analysis
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black mb-4 text-gradient leading-tight">
            Watch. Analyze.
            <br />
            Master Anything.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Paste a YouTube URL and get an AI-powered deep analysis — full transcripts, quizzes, mind maps, roadmaps, and an interactive AI tutor.
          </p>
        </motion.div>

        <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Feature cards when no results */}
        <AnimatePresence>
          {!videoData && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-14">
              {features.map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.08 }} className="glass-card rounded-2xl p-5 text-center group hover:border-primary/20 transition-colors">
                  <div className="text-primary mb-3 flex justify-center group-hover:scale-110 transition-transform">{f.icon}</div>
                  <h3 className="font-display font-bold text-sm text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="mt-8 space-y-8">
          {/* Video Players (1-3) */}
          <AnimatePresence>
            {videoData && videoIds.length > 0 && (
              <div className={`grid gap-4 ${videoIds.length > 1 ? "md:grid-cols-2" : ""}`}>
                {videoIds.map((vid, i) => (
                  <VideoPreview
                    key={vid}
                    videoId={vid}
                    thumbnail={`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`}
                    {...(i === 0 ? videoData : { title: `Video ${i + 1}`, channel: "", duration: "", views: "", likes: "", published: "" })}
                    iframeRef={i === 0 ? iframeRef : undefined}
                    compact={videoIds.length > 1 && i > 0}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  AI is analyzing the video...
                </div>
              </motion.div>
              <LoadingSkeleton />
            </div>
          )}

          {/* Analysis Results */}
          <AnimatePresence>
            {summaryData && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {metadata && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                    <div className="inline-flex flex-wrap items-center gap-2 bg-muted/30 backdrop-blur-sm rounded-full px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 border border-white/5">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{metadata.model}</span>
                      <span className="text-white/10">|</span>
                      <span>{metadata.language}</span>
                      <span className="text-white/10">|</span>
                      <span>{metadata.style}</span>
                      {metadata.videoCount > 1 && <><span className="text-white/10">|</span><span className="text-purple-400">⚡ {metadata.videoCount} Videos Synthesized</span></>}
                    </div>
                  </motion.div>
                )}
                <SummaryDisplay
                  {...summaryData}
                  transcript={transcript}
                  onTimestampClick={handleTimestampClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center mt-20 pb-8">
          <p className="text-muted-foreground/40 text-xs font-medium">
            YouTube Genius · Powered by Llama 3.3, Gemini, Grok & more
          </p>
        </motion.div>
      </div>

      {/* Floating AI Chatbot */}
      <ChatbotPanel
        transcript={transcript}
        provider={metadata?.provider}
        model={metadata?.model}
        videoTitle={videoData?.title}
      />
    </div>
  );
};

export default Index;
