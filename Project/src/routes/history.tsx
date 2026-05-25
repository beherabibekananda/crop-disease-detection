import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TopBar } from "@/components/app/TopBar";
import { recentScans } from "@/mock-data";
import { Leaf, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History · CropSense AI" },
      { name: "description", content: "Browse all past disease detection scans across your fields." },
    ],
  }),
  component: History,
});

const sevColor = {
  low: "bg-success/15 text-success border-success/30",
  moderate: "bg-warning/15 text-[oklch(0.55_0.16_75)] border-warning/30",
  high: "bg-destructive/15 text-destructive border-destructive/30",
};

function History() {
  // duplicate for visual richness
  const all = [...recentScans, ...recentScans.map((s, i) => ({ ...s, id: s.id + "-b" + i, time: "yesterday" }))];
  return (
    <div className="max-w-[1400px] mx-auto">
      <TopBar title="Scan History" subtitle="Every diagnosis, searchable and exportable." />
      <div className="glass-strong rounded-3xl p-3 lg:p-4 shadow-elegant flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 px-3">
          <Search className="size-4 text-muted-foreground" />
          <input className="bg-transparent outline-none text-sm flex-1 py-2" placeholder="Search by crop or disease…" />
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm glass hover:bg-accent/60">
          <Filter className="size-4" /> Filter
        </button>
      </div>

      <div className="glass-strong rounded-3xl shadow-elegant overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1fr_120px_120px_100px] gap-4 px-5 py-3 text-[11px] uppercase tracking-widest text-muted-foreground border-b border-border/60">
          <div>Crop</div><div>Diagnosis</div><div>Severity</div><div>Confidence</div><div>When</div>
        </div>
        <div className="divide-y divide-border/40">
          {all.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-2 md:grid-cols-[1fr_1fr_120px_120px_100px] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-accent/40 grid place-items-center"><Leaf className="size-4 text-primary" /></div>
                <div>
                  <div className="text-sm font-medium">{s.crop}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{s.id}</div>
                </div>
              </div>
              <div className="text-sm">{s.disease}</div>
              <div><span className={cn("text-[10px] font-medium px-2 py-1 rounded-full border", sevColor[s.severity])}>{s.severity}</span></div>
              <div className="text-sm font-mono">{s.confidence}%</div>
              <div className="text-xs text-muted-foreground">{s.time}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
