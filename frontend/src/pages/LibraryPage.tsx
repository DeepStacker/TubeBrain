import { motion } from "framer-motion";
import { Library as LibraryIcon, Trash2, ChevronRight, Search, Sparkles, X, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useSpacesContext } from "@/contexts/SpacesContext";
import { useAnalysisContext } from "@/contexts/AnalysisContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRelativeDate } from "@/lib/utils";

export default function LibraryPage() {
  const { historyItems, spaces, handleDeleteHistoryItem } = useSpacesContext();
  const { handleLoadHistoryItem } = useAnalysisContext();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");

  const libraryItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return historyItems.filter((h) => {
      const inSpace = spaces.some((s) => s.videoIds.includes(h.videoIds[0]));
      if (!inSpace) {
        return false;
      }

      if (!query) {
        return true;
      }

      const spaceNames = spaces
        .filter((s) => s.videoIds.includes(h.videoIds[0]))
        .map((s) => s.name.toLowerCase())
        .join(" ");
      const channel = h.videoData?.channel?.toLowerCase() || "";
      return h.title.toLowerCase().includes(query) || channel.includes(query) || spaceNames.includes(query);
    });
  }, [historyItems, searchQuery, spaces]);

  const latestItem = libraryItems[0];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center">
        <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border">
          <LibraryIcon className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Sign in to see your library</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          Log in to access your videos saved to spaces.
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
          <LibraryIcon className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personal Library</span>
        </div>
        <h2 className="text-4xl font-black text-foreground tracking-tight">Saved <span className="text-muted-foreground/40">Spaces.</span></h2>
        <p className="text-sm font-medium text-muted-foreground/60 max-w-lg leading-relaxed">
          Your curated collection of videos, summaries, and learning tools organized across your custom spaces.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, channel, or space"
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
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Resume Latest
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.dispatchEvent(new CustomEvent("youtube-genius:open-shortcuts"))}
            className="h-11 rounded-full border border-border/70 bg-card px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary"
          >
            <Layers className="mr-2 h-3.5 w-3.5" />
            Library Tips
          </Button>
        </div>
      </div>

      {libraryItems.length > 0 ? (
        <div className="grid gap-4">
          {libraryItems.map((item) => (
            <motion.button 
              key={item.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleLoadHistoryItem(item)}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/20 hover:shadow-md transition-all text-left group w-full"
            >
              <div className="flex items-center gap-4 min-w-0">
                 <div className="w-24 h-16 bg-secondary rounded-xl overflow-hidden shrink-0 border border-border relative">
                    <img src={`https://img.youtube.com/vi/${item.videoIds[0]}/mqdefault.jpg`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                 </div>
                 <div className="min-w-0">
                   <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                   <div className="flex items-center gap-2 mt-1.5">
                     <span className="text-xs text-muted-foreground">
                       {getRelativeDate(item.date)}
                     </span>
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
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border">
            <LibraryIcon className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{searchQuery ? "No matching items" : "Your library is empty"}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            {searchQuery
              ? "Try a broader title, channel, or space name, or clear the filter to view everything saved here."
              : "Add videos to spaces to build your library."}
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
