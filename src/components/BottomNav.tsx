
import { motion } from "framer-motion";
import { LayoutDashboard, Search, History, Settings, Library } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: any) => void;
  className?: string;
}

export function BottomNav({ activeView, onViewChange, className }: BottomNavProps) {
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Home", value: "Add Content" },
    { id: "search-modal", icon: Search, label: "Search", value: "Search" },
    { id: "history", icon: History, label: "History", value: "History" },
    { id: "library", icon: Library, label: "Library", value: "My Library" },
    { id: "settings", icon: Settings, label: "Menu", value: "Settings" },
  ];

  return (
    <div className={cn(
      "fixed bottom-6 left-6 right-6 z-[60] lg:hidden",
      className
    )}>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex items-center justify-between shadow-2xl shadow-black/20"
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "search-modal") {
                  onViewChange("search-modal");
                } else {
                  onViewChange(item.value);
                }
              }}
              aria-label={item.label}
              className="relative flex flex-col items-center justify-center py-2 px-1 flex-1 group"
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                isActive ? "bg-white text-black scale-110 shadow-lg" : "text-gray-400 group-active:scale-95"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-1 transition-all",
                isActive ? "text-white opacity-100" : "text-gray-500 opacity-60"
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
