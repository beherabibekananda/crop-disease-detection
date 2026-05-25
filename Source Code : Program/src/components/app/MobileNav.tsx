import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ScanLine, Bot, History, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/detection", icon: ScanLine, label: "Scan" },
  { to: "/agronomist", icon: Bot, label: "AI" },
  { to: "/history", icon: History, label: "History" },
  { to: "/weather", icon: CloudSun, label: "Weather" },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 glass-strong rounded-2xl px-2 py-2 flex items-center justify-between shadow-elegant">
      {items.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all flex-1",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <it.icon className="size-5" />
            <span className="text-[10px] font-medium">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
