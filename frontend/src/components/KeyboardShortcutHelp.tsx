import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortcutItem {
  keys: string;
  description: string;
  group: "global" | "study";
}

const shortcuts: ShortcutItem[] = [
  { keys: 'Cmd/Ctrl + K', description: 'Open search', group: 'global' },
  { keys: '?', description: 'Toggle shortcuts help', group: 'global' },
  { keys: 'Esc', description: 'Close active modal', group: 'global' },
  { keys: '← / A / [', description: 'Previous card/item', group: 'study' },
  { keys: '→ / D / ]', description: 'Next card/item', group: 'study' },
  { keys: 'Space / F', description: 'Flip flashcard', group: 'study' },
  { keys: 'M', description: 'Mark as mastered', group: 'study' },
  { keys: 'H / I', description: 'Hint / insight', group: 'study' },
  { keys: 'R', description: 'Reset current practice', group: 'study' },
];

export const KeyboardShortcutHelp = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?') {
        e.preventDefault();
        onClose(); // toggle handled by parent
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-help-title"
        >
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close shortcut help"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 id="shortcut-help-title" className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {["global", "study"].map((group) => (
                <div key={group} className="rounded-2xl border border-border bg-background p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {group === "global" ? "Global" : "Study Tools"}
                  </p>
                  <div className="space-y-3">
                    {shortcuts.filter((s) => s.group === group).map((s) => (
                      <div key={s.description} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-foreground/85">{s.description}</span>
                        <code className={cn("rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-semibold text-muted-foreground")}>
                          {s.keys}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
