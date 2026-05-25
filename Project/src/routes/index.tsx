import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ScanLine, Bot, Activity, ShieldCheck, Leaf, ArrowRight, Sparkles } from "lucide-react";
import { TopBar } from "@/components/app/TopBar";
import { CropHealthChart, RecentScans, StatCard, WeatherWidget } from "@/components/app/Widgets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · CropSense AI" },
      { name: "description", content: "Real-time field health, recent disease scans, and weather risk overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <TopBar title="Welcome back" subtitle="The field health system is active and monitoring for risks." />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl gradient-hero p-8 lg:p-12 text-primary-foreground shadow-glow"
      >
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 size-72 rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="relative max-w-2xl">

          <h2 className="mt-4 text-3xl lg:text-5xl font-semibold tracking-tight leading-tight">
            An AI operating system <br className="hidden md:block" /> for agriculture.
          </h2>
          <p className="mt-4 text-sm lg:text-base text-primary-foreground/80 max-w-xl">
            Diagnose crop disease in seconds, get treatment plans grounded in research, and stay ahead of weather-driven risk — all in one calm workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/detection" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
              <ScanLine className="size-4" /> Start a Scan <ArrowRight className="size-4" />
            </Link>
            <Link to="/agronomist" className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-5 py-2.5 text-sm font-medium hover:bg-white/20">
              <Bot className="size-4" /> Ask the Agronomist
            </Link>
          </div>
        </div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="hidden lg:grid absolute right-12 top-1/2 -translate-y-1/2 size-40 rounded-3xl glass-strong place-items-center"
        >
          <Leaf className="size-16 text-primary-foreground/90" />
        </motion.div>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="Scans this week" value="1,284" delta="+12.4%" icon={ScanLine} />
        <StatCard label="Healthy fields" value="73%" delta="+3.1%" icon={ShieldCheck} accent="oklch(0.7 0.16 145)" />
        <StatCard label="Active alerts" value="2" icon={Activity} accent="oklch(0.78 0.16 75)" />
        <StatCard label="Avg confidence" value="94.2%" delta="+0.6%" icon={ShieldCheck} />
      </section>

      {/* Body grid */}
      <section className="grid lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <CropHealthChart />
          <RecentScans limit={5} />
        </div>
        <div className="space-y-6">
          <WeatherWidget />
          <Link
            to="/detection"
            className="block glass-strong rounded-3xl p-6 shadow-elegant hover:scale-[1.01] transition-transform group"
          >
            <div className="size-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
              <ScanLine className="size-5 text-primary-foreground" />
            </div>
            <div className="mt-4 font-semibold">Scan a leaf now</div>
            <p className="text-xs text-muted-foreground mt-1">Drop an image or use your camera. Diagnosis in under 2 seconds.</p>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
              Open detection <ArrowRight className="size-3" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
