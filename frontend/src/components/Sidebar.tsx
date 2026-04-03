import { 
  Plus, 
  History, 
  LayoutGrid, 
  Library, 
  X,
  Zap,
  Settings,
  Coins,
  MoreHorizontal,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Space } from "@/lib/storage";
import { useState } from "react";
import { AuthDialog } from "./AuthDialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  className?: string;
  spaces?: Space[];
  onCreateSpace?: (name: string) => void;
  onRenameSpace?: (id: string, name: string) => void;
  onDeleteSpace?: (id: string) => void;
  user: { name?: string; email?: string; avatar_url?: string } | null;
  credits: number | null;
  onLogout: () => void;
  onAuthSuccess: () => void;
  onTopUp?: () => void;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onViewChange?: (view: any) => void;
  activeView?: string;
  recents?: string[];
  setIsCollapsed?: (collapsed: boolean) => void;
  setIsFocusMode?: (focus: boolean) => void;
}

const Sidebar = ({ 
  className, 
  spaces = [],
  onCreateSpace,
  onRenameSpace,
  onDeleteSpace,
  user,
  credits,
  onLogout,
  onAuthSuccess,
  onTopUp,
  isCollapsed,
  onCollapse
}: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const navItems = user 
    ? [
        { name: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
        { name: "History", icon: History, path: "/history" },
        { name: "Library", icon: Library, path: "/library" },
      ]
    : [
        { name: "Home", icon: LayoutGrid, path: "/" },
      ];

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      onCreateSpace?.(newSpaceName.trim());
      setNewSpaceName("");
      setIsCreatingSpace(false);
    }
  };

  const handleStartRename = (e: React.MouseEvent, space: Space) => {
    e.stopPropagation();
    setEditingSpaceId(space.id);
    setEditingName(space.name);
  };

  const handleRename = () => {
    if (editingSpaceId && editingName.trim()) {
      onRenameSpace?.(editingSpaceId, editingName.trim());
      setEditingSpaceId(null);
    }
  };

  const handleDeleteSpace = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteSpace?.(id);
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 88 : 300 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cn(
        "relative h-screen shrink-0 overflow-hidden border-r border-border/70 bg-card/95 backdrop-blur-xl", 
        "flex flex-col",
        className
      )}
    >
      {/* Brand Row */}
      <div className={cn(
        "relative z-10 flex h-20 shrink-0 items-center border-b border-border/60",
        isCollapsed ? "px-3" : "px-5"
      )}>
        <div className={cn("flex items-center", isCollapsed ? "w-full justify-center" : "flex-1 gap-3")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background shadow-sm">
            <Zap className="h-5 w-5 fill-foreground text-foreground" />
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex min-w-0 flex-col leading-tight"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">TubeBrain</span>
                <span className="truncate text-sm font-semibold tracking-tight text-foreground">Workspace</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          onClick={() => onCollapse?.(!isCollapsed)}
          className={cn(
            "group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-secondary",
            isCollapsed && "absolute right-2"
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
           {isCollapsed ? (
             <PanelLeftOpen className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
           ) : (
             <PanelLeftClose className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
           )}
        </button>
      </div>

      {/* Nav Section */}
      <nav className="relative z-10 mt-3 space-y-1.5 px-4" aria-label="Main navigation">
        {navItems.map((item) => (
          <Tooltip key={item.name} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link 
                to={item.path}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                  currentPath === item.path 
                    ? "border-border/70 bg-background text-foreground shadow-sm" 
                    : "border-transparent text-muted-foreground/80 hover:bg-secondary/60 hover:text-foreground",
                  isCollapsed && "mx-auto h-12 w-12 justify-center px-0"
                )}
              >
                <item.icon className={cn(
                  "relative z-10 h-5 w-5 shrink-0 transition-all duration-300",
                  currentPath === item.path ? "scale-105 text-foreground" : "text-muted-foreground/60 group-hover:text-foreground"
                )} />
                <AnimatePresence>
                   {!isCollapsed && (
                     <motion.span 
                       initial={{ opacity: 0, x: -5 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -5 }}
                       className="relative z-10 text-[13px] font-semibold tracking-tight"
                     >
                       {item.name}
                     </motion.span>
                   )}
                </AnimatePresence>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="font-semibold text-[10px] uppercase tracking-widest bg-foreground text-background border-none px-3 py-2 rounded-lg">
                {item.name}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      <div className="relative z-10 my-4 w-full shrink-0 px-6">
        <div className="h-px bg-border/70 w-full" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-4 relative z-10">
        {/* Spaces */}
        {user && (
          <div className="space-y-4">
            {!isCollapsed && (
              <div className="mb-2 flex items-center justify-between px-3 animate-in fade-in slide-in-from-left-2 duration-500">
                 <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Spaces</h3>
                 <button 
                   onClick={() => setIsCreatingSpace(true)}
                   className="p-1.5 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all"
                 >
                   <Plus className="h-4 w-4" />
                 </button>
              </div>
            )}
            
            <div className="space-y-1.5">
              {isCreatingSpace && !isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 flex flex-col gap-3 rounded-2xl border border-border/70 bg-background px-3 py-3"
                >
                  <input
                    autoFocus
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    onKeyUp={(e) => e.key === "Enter" && handleCreateSpace()}
                    placeholder="Space Name"
                    className="bg-background border border-border/70 text-xs p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-foreground font-medium placeholder:text-muted-foreground/35"
                  />
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCreateSpace} size="sm" className="h-9 rounded-full text-[10px] flex-1 font-semibold uppercase tracking-[0.22em] bg-foreground text-background hover:bg-foreground/90">Create</Button>
                    <button onClick={() => setIsCreatingSpace(false)} className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground"><X className="h-4 w-4" /></button>
                  </div>
                </motion.div>
              )}
              
              {spaces.map((space) => (
                <div key={space.id} className="group relative">
                  {editingSpaceId === space.id ? (
                    <div className="px-4 py-2 flex items-center gap-2">
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && handleRename()}
                        onBlur={handleRename}
                        className="bg-background/40 border border-white/10 text-xs p-2.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 w-full text-foreground font-bold"
                      />
                    </div>
                  ) : (
                    <Link 
                      to={`/space/${space.id}`}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-[13px] transition-all duration-200",
                        currentPath === `/space/${space.id}` 
                          ? "border-border/70 bg-background text-foreground shadow-sm" 
                          : "border-transparent text-muted-foreground/75 hover:bg-secondary/60 hover:text-foreground",
                        isCollapsed && "mx-auto h-12 w-12 justify-center px-0"
                      )}
                      title={isCollapsed ? space.name : undefined}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all group-hover:scale-125 shrink-0",
                        currentPath === `/space/${space.id}` ? "bg-foreground" : "bg-border group-hover:bg-foreground/50"
                      )} />
                      <AnimatePresence>
                         {!isCollapsed && (
                           <motion.div 
                             initial={{ opacity: 0, x: -5 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -5 }}
                             className="flex-1 flex items-center justify-between min-w-0"
                           >
                             <span className="truncate pr-2 font-medium">{space.name}</span>
                             <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all">
                               <button 
                                 onClick={(e) => handleStartRename(e, space)}
                                 className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground/50 hover:text-foreground"
                               >
                                 <MoreHorizontal className="h-3.5 w-3.5" />
                               </button>
                               <button 
                                 onClick={(e) => handleDeleteSpace(e, space.id)}
                                 className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground/50 hover:text-destructive"
                               >
                                 <Trash2 className="h-3.5 w-3.5" />
                               </button>
                             </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className={cn("mt-auto px-4 pb-8 shrink-0 relative z-10", isCollapsed && "px-3")}>
        {user ? (
          <div className="space-y-4">
             <div className="rounded-[24px] border border-border/70 bg-background p-3 shadow-sm">
                {!isCollapsed && (
                  <div className="mb-3 flex items-center justify-between px-1 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-card">
                        <Coins className="h-3.5 w-3.5 text-foreground" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/80">{credits ?? 0} credits</span>
                    </div>
                    <button 
                      onClick={onTopUp}
                      className="rounded-lg border border-border/70 bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:text-muted-foreground"
                    >
                      Refill
                    </button>
                  </div>
                )}
                
                <Link 
                  to="/settings"
                  className={cn(
                    "flex items-center gap-4 transition-all group py-1",
                    isCollapsed && "justify-center"
                  )}
                >
                  <Avatar className="h-11 w-11 rounded-2xl border border-border/70 group-hover:border-border transition-all duration-300 shadow-sm shrink-0">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-[14px] font-semibold bg-foreground text-background">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="flex-1 flex items-center justify-between min-w-0"
                      >
                           <div className="flex flex-col items-start overflow-hidden flex-1">
                             <span className="text-[13px] font-semibold truncate w-full text-foreground/90 group-hover:text-foreground transition-colors tracking-tight">{user.name || "Your Profile"}</span>
                             <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Settings</span>
                           </div>
                           <Settings className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-all duration-300" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
             </div>
          </div>
        ) : (
          <div className="px-2">
            <AuthDialog onSuccess={onAuthSuccess} />
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;

