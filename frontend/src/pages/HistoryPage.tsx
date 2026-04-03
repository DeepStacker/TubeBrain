import { motion } from "framer-motion";
import { History as HistoryIcon, Trash2, ChevronRight, Search, Sparkles, Clock, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useSpacesContext } from "@/contexts/SpacesContext";
import { useAnalysisContext } from "@/contexts/AnalysisContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRelativeDate } from "@/lib/utils";

export default function HistoryPage() {
  const { historyItems, handleDeleteHistoryItem } = useSpacesContext();
  const { handleLoadHistoryItem } = useAnalysisContext();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return historyItems;
    }

    return historyItems.filter((item) => {
      const channel = item.videoData?.channel?.toLowerCase() || "";
      return item.title.toLowerCase().includes(query) || channel.includes(query);
    });
  }, [historyItems, searchQuery]);

  const latestItem = historyItems[0];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center">
        <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border">
          <HistoryIcon className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Sign in to see your history</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          Log in to access your previously analyzed videos.
        </p>
        <Link to="/">
          <Button className="rounded-xl font-semibold text-sm h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/10">Back Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-6xl mx-auto py-12 px-8 overflow-y-auto w-full h-full scrollbar-thin"
    >
      <div className="mb-12 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border">
          <HistoryIcon className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session History</span>
        </div>
        <h2 className="text-4xl font-black text-foreground tracking-tight">Recent <span className="text-muted-foreground/40">Knowledge.</span></h2>
        <p className="text-sm font-medium text-muted-foreground/60 max-w-lg leading-relaxed">
          Revisit your previously analyzed videos and continue your learning journey right where you left off.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or channel"
              className="h-11 rounded-full border-border/70 bg-card pl-11 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => latestItem && handleLoadHistoryItem(latestItem)}
            disabled={!latestItem}
            className="h-11 rounded-full border border-border/70 bg-card px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary"
          >
            <Clock className="mr-2 h-3.5 w-3.5" />
            Continue Latest
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.dispatchEvent(new CustomEvent("youtube-genius:open-shortcuts"))}
            className="h-11 rounded-full border border-border/70 bg-card px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Quick Help
          </Button>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleLoadHistoryItem(item)}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/20 hover:shadow-md transition-all text-left group w-full cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                 <div className="w-24 h-16 bg-secondary rounded-xl overflow-hidden shrink-0 border border-border relative">
                    <img src={`https://img.youtube.com/vi/${item.videoIds[0]}/mqdefault.jpg`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {item.status && item.status !== "completed" && (
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                        <span className="text-[9px] font-semibold uppercase text-white bg-amber-500 px-1.5 py-0.5 rounded">
                          {item.status === "failed" ? "Failed" : "Processing"}
                        </span>
                      </div>
                    )}
                 </div>
                 <div className="min-w-0">
                   <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                   <div className="flex items-center gap-2 mt-1.5">
                     <span className="text-xs text-muted-foreground">
                       {getRelativeDate(item.date)}
                     </span>
                     {item.videoIds.length > 1 && (
                       <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">
                         {item.videoIds.length} videos
                       </span>
                     )}
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteHistoryItem(item.id); }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground/30 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Delete item"
                >
                   <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border">
            <HistoryIcon className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{searchQuery ? "Nothing matched your search" : "No history yet"}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            {searchQuery
              ? "Try a different title or channel name, or clear the filter to see all sessions."
              : "Start analyzing a video and it will appear here."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {searchQuery ? (
              <Button onClick={() => setSearchQuery("")} variant="outline" className="rounded-xl font-semibold text-sm h-10 px-6">Clear Filter</Button>
            ) : (
              <Link to="/dashboard">
                <Button className="rounded-xl font-semibold text-sm h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/10">Start Learning</Button>
              </Link>
            )}
            <Button
              variant="secondary"
              onClick={() => window.dispatchEvent(new CustomEvent("youtube-genius:open-shortcuts"))}
              className="rounded-xl font-semibold text-sm h-10 px-6 border border-border/70 bg-card"
            >
              Tips
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
