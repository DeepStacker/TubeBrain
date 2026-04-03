import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlusCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useUIContext } from "@/contexts/UIContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAnalysisContext } from "@/contexts/AnalysisContext";
import { useSpacesContext } from "@/contexts/SpacesContext";

// Modals to be extracted later
import SearchModal from "../components/SearchModal";
import TopUpDialog from "../components/TopUpDialog";
import FeedbackDialog from "../components/FeedbackDialog";
import ProfileUpdateDialog from "../components/ProfileUpdateDialog";

export function AppLayout() {
  const { 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    isFocusMode, 
    setIsFocusMode,
    isSearchModalOpen,
    setIsSearchModalOpen,
    isTopUpOpen,
    setIsTopUpOpen,
    isFeedbackOpen,
    setIsFeedbackOpen,
    isProfileUpdateOpen,
    setIsProfileUpdateOpen
  } = useUIContext();

  const { user, credits, handleLogout } = useAuthContext();
  const { videoData, activeAnalysisId, handleBackToDashboard } = useAnalysisContext();
  const { spaces, handleCreateNewSpace } = useSpacesContext();

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground relative">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.03),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.02),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.035),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.02),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* Sidebar - Desktop */}
      {!isFocusMode && (
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
          user={user}
          onLogout={handleLogout}
          spaces={spaces}
          onCreateSpace={handleCreateNewSpace}
          credits={credits} 
          onAuthSuccess={() => {}} 
          className="relative z-10"
        />
      )}

      {/* Main Content */}
      <main 
        id="main-content"
        className={cn(
          "flex-1 flex flex-col min-w-0 relative z-10"
        )}
      >
        {/* Global Nav / Header - Premium Glass */}
        {!isFocusMode && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-border/60 bg-background/85 px-6 backdrop-blur-xl"
          >
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card">
                    <PlusCircle className="h-4.5 w-4.5 text-foreground" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      {activeAnalysisId && videoData ? "Analysis" : "Workspace"}
                    </p>
                    <h1 className="max-w-[220px] truncate text-sm font-semibold tracking-tight text-foreground md:max-w-[420px]">
                      {activeAnalysisId && videoData ? videoData.title : "Dashboard"}
                    </h1>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground lg:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                    Ready
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={cn(
                      "h-9 gap-2 rounded-full border border-border/70 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all",
                      isFocusMode 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent" 
                        : "bg-background text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{isFocusMode ? "Exit Focus" : "Focus Mode"}</span>
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsTopUpOpen(true)}
                    className="h-9 rounded-full bg-foreground px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background hover:bg-foreground/90"
                  >
                    Upgrade
                  </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </div>

        {/* Floating Exit Focus Button */}
        <AnimatePresence>
          {isFocusMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed top-8 left-1/2 -translate-x-1/2 z-[60]"
            >
              <Button
                onClick={() => setIsFocusMode(false)}
                className="group h-12 rounded-full border border-primary-foreground/20 bg-primary px-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-xl backdrop-blur-sm hover:bg-primary/90"
              >
                <X className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                Exit Focus Mode
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        {!isFocusMode && (
          <BottomNav 
            activeView={activeAnalysisId ? "analysis" : "dashboard"} 
            onViewChange={(view) => {
              if (view === "search-modal") {
                setIsSearchModalOpen(true);
              }
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <SearchModal />
      <TopUpDialog />
      <FeedbackDialog />
      <ProfileUpdateDialog />
    </div>
  );
}
