import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ScanLine,
  Bot,
  History,
  Database,
  CloudSun,
  Settings,
  Leaf,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Disease Detection", to: "/detection", icon: ScanLine },
  { title: "AI Agronomist", to: "/agronomist", icon: Bot },
  { title: "Scan History", to: "/history", icon: History },
  { title: "Dataset Insights", to: "/insights", icon: Database },
  { title: "Weather Intelligence", to: "/weather", icon: CloudSun },
  { title: "Settings", to: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 p-4 gap-4">
      <div className="glass-strong rounded-2xl p-5 flex items-center gap-3 shadow-elegant">
        <div className="relative">
          <div className="size-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
            <Leaf className="size-5 text-primary-foreground" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-card animate-pulse" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-sm">CropSense AI</div>
          <div className="text-[11px] text-muted-foreground">Agricultural Intelligence</div>
        </div>
      </div>

      <nav className="glass-strong rounded-2xl p-2 flex-1 flex flex-col gap-0.5 shadow-elegant">
        {items.map((item, i) => {
          const active = pathname === item.to;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-elegant"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent/60",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.title}</span>
                {active && (
                  <motion.span
                    layoutId="sidebar-glow"
                    className="absolute inset-0 -z-10 rounded-xl"
                    style={{ boxShadow: "0 8px 30px -8px var(--primary-glow)" }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}

        <div className="mt-auto p-3">
          <div className="rounded-xl border border-border/60 p-3 bg-gradient-to-br from-primary/5 to-primary-glow/10">
            <div className="flex items-center gap-2 text-xs">
              <Circle className="size-2 fill-success text-success" />
              <span className="text-muted-foreground">AI Model Online</span>
            </div>
            <div className="mt-1 text-xs font-mono text-foreground/80">v2.4 · Ensemble CNN</div>
          </div>
        </div>
      </nav>

      <div className="glass-strong rounded-2xl p-3 flex items-center gap-3 shadow-elegant">
        <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-primary-foreground text-sm font-semibold">
          AG
        </div>
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-sm font-medium truncate">Agronomist</div>
          <div className="text-[11px] text-muted-foreground truncate">Field Specialist</div>
        </div>
      </div>
    </aside>
  );
}
