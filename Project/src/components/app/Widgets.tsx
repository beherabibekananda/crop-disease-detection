import { motion } from "framer-motion";
import { Cloud, CloudRain, Sun, ArrowUpRight, Activity, Leaf } from "lucide-react";
import { cropHealth, recentScans, weatherForecast } from "@/mock-data";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, delta, icon: Icon, accent,
}: { label: string; value: string; delta?: string; icon: React.ComponentType<{ className?: string }>; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-strong rounded-2xl p-5 shadow-elegant relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 size-32 rounded-full opacity-30 blur-2xl" style={{ background: accent || "var(--primary-glow)" }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-1 tracking-tight">{value}</div>
          {delta && <div className="text-xs text-success mt-1 inline-flex items-center gap-1"><ArrowUpRight className="size-3" />{delta}</div>}
        </div>
        <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from "react";

const wIcon = { sun: Sun, cloud: Cloud, rain: CloudRain } as const;

import { MapPin, Loader2 } from "lucide-react";

export function WeatherWidget() {
  const [data, setData] = useState(weatherForecast);
  const [location, setLocation] = useState("India");
  const [blightAlert, setBlightAlert] = useState("Blight risk: stable. Maintain regular scouting.");
  const [isLocating, setIsLocating] = useState(false);

  const fetchAIWeather = async (locName: string) => {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ""}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a specialized agricultural weather service. Generate a JSON object for ${locName}. JSON structure: { \"forecast\": [ { \"day\": \"Mon\", \"icon\": \"sun\"|\"cloud\"|\"rain\", \"high\": 32, \"low\": 22, \"condition\": \"Sunny\", \"risk\": \"Low\" } ], \"blightAlert\": \"Short warning text\" }. Provide 7 days of forecast.`
            }
          ]
        })
      });
      const result = await res.json();
      const content = JSON.parse(result.choices[0].message.content);
      if (content.forecast) setData(content.forecast);
      if (content.blightAlert) setBlightAlert(content.blightAlert);
    } catch (err) {
      console.error("Failed to fetch AI weather", err);
    }
  };

  useEffect(() => {
    fetchAIWeather("Punjab, India");
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const locStr = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      setLocation(locStr);
      await fetchAIWeather(locStr);
      setIsLocating(false);
    }, (err) => {
      console.error(err);
      setIsLocating(false);
    });
  };

  const today = data[0];
  const Icon = wIcon[today.icon as keyof typeof wIcon] || Sun;
  
  return (
    <div className="glass-strong rounded-3xl p-6 shadow-elegant relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-50" style={{ backgroundImage: "var(--gradient-glow)" }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Field Weather</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-sm text-muted-foreground">{location}</div>
            <button 
              onClick={handleLocate}
              disabled={isLocating}
              className="text-primary hover:scale-110 transition-transform disabled:opacity-50"
            >
              {isLocating ? <Loader2 className="size-3 animate-spin" /> : <MapPin className="size-3" />}
            </button>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-5xl font-semibold tracking-tight">{today.high}°</span>
            <div className="text-xs text-muted-foreground pb-2">
              <div>{today.condition}</div>
              <div>L {today.low}°</div>
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity }} className="size-16 rounded-2xl gradient-hero grid place-items-center shadow-glow">
          <Icon className="size-8 text-primary-foreground" />
        </motion.div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {data.map((d) => {
          const I = wIcon[d.icon as keyof typeof wIcon] || Sun;
          return (
            <div key={d.day} className="text-center rounded-xl py-2 hover:bg-accent/40 transition-colors">
              <div className="text-[10px] text-muted-foreground">{d.day}</div>
              <I className="size-4 mx-auto my-1 text-primary" />
              <div className="text-[11px] font-medium">{d.high}°</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-foreground/80">
        <strong className="text-[oklch(0.55_0.16_75)]">AI Insight:</strong> {blightAlert}
      </div>
    </div>
  );
}

const sevColors = {
  low: "bg-success/15 text-success",
  moderate: "bg-warning/15 text-[oklch(0.55_0.16_75)]",
  high: "bg-destructive/15 text-destructive",
} as const;

export function RecentScans({ limit }: { limit?: number }) {
  const data = limit ? recentScans.slice(0, limit) : recentScans;
  return (
    <div className="glass-strong rounded-3xl p-6 shadow-elegant">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Recent Scans</div>
          <div className="text-lg font-semibold mt-0.5">Field activity</div>
        </div>
        <Activity className="size-4 text-muted-foreground" />
      </div>
      <div className="divide-y divide-border/50">
        {data.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-3">
            <div className="size-9 rounded-xl bg-accent/40 grid place-items-center">
              <Leaf className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{s.crop} · {s.disease}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{s.id} · {s.time}</div>
            </div>
            <div className={cn("text-[10px] font-medium px-2 py-1 rounded-full", sevColors[s.severity])}>
              {s.confidence}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CropHealthChart() {
  return (
    <div className="glass-strong rounded-3xl p-6 shadow-elegant">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Crop Health Index</div>
          <div className="text-lg font-semibold mt-0.5">Across active fields</div>
        </div>
        <div className="text-xs text-muted-foreground">last 7 days</div>
      </div>
      <div className="space-y-3">
        {cropHealth.map((c, i) => (
          <div key={c.crop}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{c.crop}</span>
              <span className="text-muted-foreground font-mono">{c.health}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.health}%` }}
                transition={{ delay: i * 0.06, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: c.health > 85
                    ? "linear-gradient(90deg, var(--success), var(--primary-glow))"
                    : c.health > 70
                    ? "linear-gradient(90deg, var(--primary), var(--primary-glow))"
                    : "linear-gradient(90deg, var(--warning), oklch(0.7 0.16 50))",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
