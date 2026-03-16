import { 
  Plus, 
  Search, 
  History, 
  LayoutGrid, 
  Library, 
  ChevronRight,
  ChevronDown,
  X,
  Zap,
  TrendingUp,
  Settings,
  LogOut,
  User as UserIcon,
  Coins,
  MoreHorizontal,
  Trash2,
  Check,
  HelpCircle,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Space } from "@/lib/storage";
import { useState, useEffect } from "react";
import { AuthDialog } from "./AuthDialog";
import { authApi, creditApi, removeAuthToken, getAuthToken } from "@/lib/api";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface SidebarProps {
  className?: string;
  onViewChange?: (view: string | { type: string; id: string; name: string }) => void;
  activeView?: string;
  recents?: string[];
  spaces?: Space[];
  onCreateSpace?: (name: string) => void;
  onRenameSpace?: (id: string, name: string) => void;
  onDeleteSpace?: (id: string) => void;
  user: { name?: string; email?: string; avatar_url?: string } | null;
  credits: number | null;
  onLogout: () => void;
  onAuthSuccess: () => void;
  onTopUp?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ 
  className, 
  onViewChange, 
  activeView, 
  recents = [], 
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
  setIsCollapsed
}: SidebarProps) => {
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showMore, setShowMore] = useState(false);

  const navItems = user 
    ? [
        { name: "Search", icon: Search },
        { name: "History", icon: History },
      ]
    : [
        { name: "Search", icon: Search },
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
    <aside className={cn("w-[240px] border-r border-gray-100 bg-white h-screen flex flex-col", className)}>
      {/* Logo & Toggle */}
      <div className={cn("flex items-center justify-between px-5 pt-5 pb-4", isCollapsed && "px-3")}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <span className="text-white text-[12px] font-bold">TB</span>
            </div>
            <span className="font-bold text-lg tracking-tight">TubeBrain</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-foreground transition-all",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Add Content */}
      <div className="px-3 mb-4">
        <button
          onClick={() => onViewChange?.("Add Content")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left",
            isCollapsed && "justify-center px-0 bg-transparent hover:bg-gray-50"
          )}
          title={isCollapsed ? "Add content" : undefined}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span>Add content</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-0.5 mb-2" aria-label="Main navigation">
        {navItems.map((item) => (
          <button 
            key={item.name}
            onClick={() => onViewChange?.(item.name)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all text-left",
              activeView === item.name 
                ? "bg-gray-100 text-foreground font-medium" 
                : "text-muted-foreground hover:bg-gray-50 hover:text-foreground",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="h-4 w-4" />
            {!isCollapsed && item.name}
          </button>
        ))}
      </nav>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
        {/* Recents */}
        {user && !isCollapsed && (
          <div className="mb-4">
            <h3 className="px-3 text-xs font-medium text-muted-foreground mb-2 mt-4">Recents</h3>
            <div className="space-y-0.5">
              {recents.length > 0 ? (
                <>
                  {recents.slice(0, showMore ? recents.length : 5).map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => onViewChange?.("History")}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-muted-foreground hover:text-foreground transition-all text-left"
                    >
                      <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" />
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                  {recents.length > 5 && (
                    <button
                      onClick={() => setShowMore(!showMore)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>···</span>
                      <span>{showMore ? "Less" : "More"}</span>
                    </button>
                  )}
                </>
              ) : (
                <p className="px-3 py-1 text-xs text-muted-foreground opacity-50">No recents</p>
              )}
            </div>
          </div>
        )}

        {/* Spaces */}
        {user && !isCollapsed && (
          <div>
            <h3 className="px-3 text-xs font-medium text-muted-foreground mb-2">Spaces</h3>
            
            {/* New Space Button */}
            <button 
              onClick={() => setIsCreatingSpace(true)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Space</span>
            </button>
            
            <div className="space-y-0.5 mt-1">
              {isCreatingSpace && (
                <div className="px-3 py-2 flex flex-col gap-2 bg-gray-50 rounded-lg mb-2">
                  <input
                    autoFocus
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    onKeyUp={(e) => e.key === "Enter" && handleCreateSpace()}
                    placeholder="Space name..."
                    className="bg-white border border-gray-200 text-sm p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCreateSpace} size="sm" className="h-7 bg-black text-white rounded-lg text-xs flex-1">Add</Button>
                    <button onClick={() => setIsCreatingSpace(false)} className="p-1 hover:bg-white rounded-lg transition-all"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
              
              {spaces.map((space) => (
                <div key={space.id} className="group relative">
                  {editingSpaceId === space.id ? (
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && handleRename()}
                        onBlur={handleRename}
                        className="bg-gray-50 border border-gray-200 text-sm p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 w-full"
                      />
                      <button onClick={handleRename} className="p-1 hover:bg-gray-100 rounded-lg text-green-600">
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onViewChange?.({ type: "Space", id: space.id, name: space.name })}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg transition-all text-left",
                        activeView === space.name ? "bg-gray-100 text-foreground font-medium" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="truncate pr-8">{space.name}</span>
                      
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                        <button 
                          onClick={(e) => handleStartRename(e, space)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSpace(e, space.id)}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Library */}
        {user && !isCollapsed && (
          <div className="mt-4">
            <button
              onClick={() => onViewChange?.("My Library")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors text-left",
                activeView === "My Library" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>My Library</span>
              <ChevronRight className="h-3 w-3 text-gray-300" />
            </button>
          </div>
        )}
        
        {user && isCollapsed && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={() => onViewChange?.("My Library")}
              className={cn(
                "p-2 rounded-lg transition-all",
                activeView === "My Library" ? "bg-gray-100 text-foreground" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              )}
              title="My Library"
            >
              <Library className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {/* Bottom Section */}
      <div className={cn("mt-auto px-3 pb-4", isCollapsed && "px-1")}>
        {user ? (
          <div className="space-y-2">
             {!isCollapsed && (
              <button 
                onClick={onTopUp}
                className="w-full h-8 flex items-center justify-center text-[11px] font-semibold text-[#00a86b] bg-[#e6f9f1] hover:bg-[#d5f2e4] rounded-lg transition-colors border border-[#ccf0dd]"
              >
                Upgrade Plan
              </button>
            )}
            
            <button 
              onClick={() => onViewChange?.("Settings")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-2xl transition-all group",
                activeView === "Settings" || activeView === "settings" ? "bg-gray-50 border border-gray-100" : "hover:bg-gray-50",
                isCollapsed && "px-2 justify-center"
              )}
              title={isCollapsed ? "Settings" : undefined}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 rounded-xl">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-[12px] font-semibold bg-gray-100 text-gray-700">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-bold truncate max-w-[110px]">{user.name || "User"}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Free Plan</span>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-foreground transition-colors" />}
            </button>
          </div>
        ) : (
          <div className="px-1">
            <AuthDialog onSuccess={onAuthSuccess} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

