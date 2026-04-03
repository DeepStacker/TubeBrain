import { motion } from "framer-motion";
import { LayoutDashboard, Search, History, Settings, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface BottomNavProps {
  onViewChange: (view: string) => void;
  activeView?: string;
  className?: string;
}

export function BottomNav({ onViewChange, activeView, className }: BottomNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Home", path: "/dashboard" },
    { id: "search-modal", icon: Search, label: "Search", path: "#search" },
    { id: "history", icon: History, label: "History", path: "/history" },
    { id: "library", icon: Library, label: "Library", path: "/library" },
    { id: "settings", icon: Settings, label: "Menu", path: "/settings" },
  ];

  return (
    <div className={cn(
      "fixed bottom-5 left-5 right-5 z-[60] lg:hidden",
      className
    )}>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between rounded-[24px] border border-border/70 bg-card/95 p-2 shadow-xl shadow-foreground/5 backdrop-blur-xl"
      >
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;

          if (item.id === "search-modal") {
            return (
              <button
                key={item.id}
                onClick={() => onViewChange("search-modal")}
                aria-label={item.label}
                className="group relative flex flex-1 flex-col items-center justify-center px-1 py-2"
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-300",
                  "text-muted-foreground group-active:scale-95"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 transition-all">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              aria-label={item.label}
              className="group relative flex flex-1 flex-col items-center justify-center px-1 py-2"
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                isActive ? "bg-primary text-primary-foreground scale-105 shadow-sm" : "text-muted-foreground group-active:scale-95"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] transition-all",
                isActive ? "text-foreground opacity-100" : "text-muted-foreground/70"
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
