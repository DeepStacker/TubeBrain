import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Languages, Cpu, Settings2, Sparkles, Plus, X, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UrlInputProps {
  onSubmit: (urls: string[], options: any) => void;
  isLoading: boolean;
}

const models = [
  { provider: "groq", model: "llama-3.3-70b-versatile", label: "⚡ Llama 3.3 70B (Groq)" },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", label: "🦙 Llama 3.3 (OpenRouter)" },
  { provider: "google", model: "gemini-1.5-pro", label: "💎 Gemini 1.5 Pro" },
  { provider: "xai", model: "grok-beta", label: "🧠 Grok Beta (xAI)" },
  { provider: "cerebras", model: "llama3.1-70b", label: "🚀 Cerebras (Ultra Fast)" },
];

const languages = [
  "English", "Spanish", "French", "German", "Chinese", "Japanese",
  "Hindi", "Arabic", "Portuguese", "Russian", "Korean", "Italian",
  "Turkish", "Vietnamese", "Thai", "Indonesian", "Tamil", "Telugu", "Urdu"
];

const styles = [
  { value: "Detailed", label: "📖 Detailed Analysis" },
  { value: "Concise", label: "⚡ Quick & Concise" },
  { value: "Educational", label: "🎓 Educational Deep-Dive" },
  { value: "Bullet Points", label: "📋 Structured Bullets" },
];

const UrlInput = ({ onSubmit, isLoading }: UrlInputProps) => {
  const [urls, setUrls] = useState(["", "", ""]);
  const [activeCount, setActiveCount] = useState(1);
  const [model, setModel] = useState(models[0].model);
  const [language, setLanguage] = useState("English");
  const [style, setStyle] = useState("Detailed");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = urls.slice(0, activeCount).filter(u => u.trim());
    if (!validUrls.length) return;

    const selectedModelObj = models.find(m => m.model === model);
    onSubmit(validUrls, {
      provider: selectedModelObj?.provider,
      model: selectedModelObj?.model,
      language,
      style
    });
  };

  const updateUrl = (i: number, val: string) => {
    const next = [...urls];
    next[i] = val;
    setUrls(next);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="space-y-3"
      >
        {Array.from({ length: activeCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="relative group"
          >
            {i === 0 && activeCount > 1 && (
              <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-primary/60 w-4">1</div>
            )}
            {i > 0 && (
              <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-purple-400/60 w-4">{i + 1}</div>
            )}
            <div className={`absolute -inset-1 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 ${i === 0 ? "bg-primary/20" : "bg-purple-500/15"}`} />
            <div className="relative flex items-center glass-card rounded-2xl overflow-hidden border border-white/10">
              <Youtube className={`ml-5 h-4 w-4 shrink-0 ${i === 0 ? "text-primary/60" : "text-purple-400/60"}`} />
              <input
                type="text"
                value={urls[i]}
                onChange={e => updateUrl(i, e.target.value)}
                placeholder={i === 0 ? "Paste a YouTube URL to analyze..." : `Video ${i + 1} URL (optional)`}
                className="flex-1 bg-transparent px-4 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-body text-base"
              />
              {i === 0 && i === activeCount - 1 && (
                <Button type="submit" variant="hero" size="lg" disabled={isLoading || !urls[0].trim()} className="m-2 rounded-xl px-6 gap-2">
                  {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /><span className="hidden md:inline">Analyzing...</span></>) : (<><Sparkles className="h-4 w-4" /><span className="hidden md:inline">Analyze</span></>)}
                </Button>
              )}
              {i > 0 && (
                <button type="button" onClick={() => { setActiveCount(c => c - 1); updateUrl(i, ""); }} className="m-3 p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Bottom row: Add video + Submit (if multiple) */}
        <div className="flex items-center gap-3">
          {activeCount < 3 && (
            <button type="button" onClick={() => setActiveCount(c => c + 1)} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1">
              <Plus className="h-3.5 w-3.5" /> Add another video
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Deep-Dive Mode</span>
            </button>
          )}
          {activeCount > 1 && (
            <Button type="submit" variant="hero" size="lg" disabled={isLoading || !urls[0].trim()} className="ml-auto rounded-xl px-6 gap-2">
              {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</>) : (<><Sparkles className="h-4 w-4" />Synthesize {activeCount} Videos</>)}
            </Button>
          )}
        </div>
      </motion.form>

      {/* Options row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 ml-1 flex items-center gap-1.5">
            <Cpu className="h-3 w-3" /> AI Engine
          </label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="bg-background/30 backdrop-blur-md border-white/10 h-11 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map(m => <SelectItem key={m.model} value={m.model}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 ml-1 flex items-center gap-1.5">
            <Languages className="h-3 w-3" /> Output Language
          </label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="bg-background/30 backdrop-blur-md border-white/10 h-11 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 ml-1 flex items-center gap-1.5">
            <Settings2 className="h-3 w-3" /> Analysis Mode
          </label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="bg-background/30 backdrop-blur-md border-white/10 h-11 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {styles.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </div>
  );
};

export default UrlInput;
