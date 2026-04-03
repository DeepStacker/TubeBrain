import { motion } from "framer-motion";
import { FolderOpen, PlusCircle, History as HistoryIcon, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import UrlInput from "@/components/UrlInput";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAnalysisContext } from "@/contexts/AnalysisContext";
import { useSpacesContext } from "@/contexts/SpacesContext";
import { useUIContext } from "@/contexts/UIContext";
import { getRelativeDate } from "@/lib/utils";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const {
    handleSubmit,
    isLoading,
    analysisStyle,
    setAnalysisStyle,
    handleLoadHistoryItem,
  } = useAnalysisContext();
  const { setIsSearchModalOpen } = useUIContext();
  const { spaces, historyItems } = useSpacesContext();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20"
    >
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
              Focused study workspace
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
              Good to see you, {user?.name?.split(" ")[0] || "there"}.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              Capture a source, review the synthesis, then move it into a space. The workflow stays visible, the interface stays quiet.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsSearchModalOpen(true)}
                className="h-10 rounded-full border border-border/70 bg-card px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary"
              >
                Search Library
              </Button>
              {historyItems.length > 0 && (
                <Button
                  onClick={() => handleLoadHistoryItem(historyItems[0])}
                  className="h-10 rounded-full bg-foreground px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background hover:bg-foreground/90"
                >
                  Continue Latest Session
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-left">
            {[
              { label: "Spaces", value: spaces.length },
              { label: "Recents", value: historyItems.length },
              { label: "Style", value: analysisStyle || "Auto" },
            ].map((item) => (
              <div key={item.label} className="min-w-[96px] rounded-[24px] border border-border/70 bg-card px-4 py-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-xl font-black tracking-tight text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-6">
        <div className="rounded-[32px] border border-border/70 bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Start a new analysis</p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">Paste a link, upload a file, or reuse a recent source.</h2>
                </div>
              </div>

              <UrlInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onUploadComplete={(_, analysisId) => {
                  toast.success("Video uploaded. Processing started.");
                  if (analysisId) {
                    navigate(`/analysis/${analysisId}`);
                  }
                }}
                analysisStyle={analysisStyle}
                onStyleChange={setAnalysisStyle}
              />
            </div>

            <div className="rounded-[28px] border border-border/70 bg-background p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workflow</p>
              <div className="mt-5 space-y-4">
                {[
                  { title: "Add source", desc: "Drop in a URL, paste text, or upload media." },
                  { title: "Review synthesis", desc: "Read the summary, notes, and generated study tools." },
                  { title: "Store in space", desc: "Move the result into a topic workspace for later." },
                ].map((step, index) => (
                  <div key={step.title} className="flex items-start gap-4 rounded-[22px] border border-border/70 bg-card px-4 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background text-[10px] font-semibold text-foreground">
                      0{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.desc}</p>
                    </div>
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 mt-12 space-y-12">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Spaces</h3>
            <Link to="/library" className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground">
              View all
            </Link>
          </div>

          {spaces.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {spaces.slice(0, 6).map((space) => (
                <Link
                  key={space.id}
                  to={`/space/${space.id}`}
                  className="flex aspect-square flex-col justify-between rounded-[28px] border border-border/70 bg-card p-5 text-left shadow-sm transition-all hover:border-border hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background transition-colors group-hover:bg-foreground group-hover:text-background">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block truncate text-base font-semibold text-foreground">{space.name}</span>
                    <span className="text-xs font-medium text-muted-foreground">{space.videoIds.length} items</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[32px] border border-dashed border-border/70 bg-secondary/20 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-border/70 bg-card shadow-sm">
                <PlusCircle className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-base font-semibold text-foreground">Create your first space</p>
              <p className="mt-1 text-sm text-muted-foreground">Organize learning by topic, project, or course.</p>
              <Button
                onClick={() => toast.info("Use the sidebar to create new spaces!")}
                variant="outline"
                className="mt-6 h-10 rounded-full border-border/70 bg-background px-6 text-[10px] font-semibold uppercase tracking-[0.22em] hover:bg-secondary"
              >
                Add space
              </Button>
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Recents</h3>
            <Link to="/history" className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground">
              View history
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {historyItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => handleLoadHistoryItem(item)}
                className="group flex flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card text-left shadow-sm transition-all hover:border-border hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                  <img
                    src={`https://img.youtube.com/vi/${item.videoIds[0]}/maxresdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white/5" />
                </div>
                <div className="p-5">
                  <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{getRelativeDate(item.date)}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="max-w-[100px] truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.videoData?.channel}</span>
                  </div>
                </div>
              </button>
            ))}

            {historyItems.length === 0 && (
              <div className="col-span-full rounded-[32px] border border-dashed border-border/70 bg-secondary/20 py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-border/70 bg-card shadow-sm">
                  <HistoryIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-base font-semibold text-muted-foreground">No recent activity</p>
                <Link to="/dashboard" className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60 transition-colors hover:text-foreground">
                  Start learning
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
