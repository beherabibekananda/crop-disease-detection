import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/app/TopBar";
import { Bell, Globe, Shield, User, Moon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · CropSense AI" },
      { name: "description", content: "Manage your profile, notifications, and AI preferences." },
    ],
  }),
  component: Settings,
});

function Row({ Icon, title, desc, children }: { Icon: React.ComponentType<{className?:string}>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 p-5 border-b border-border/50 last:border-b-0">
      <div className="size-10 rounded-xl bg-primary/10 grid place-items-center"><Icon className="size-5 text-primary" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

function Settings() {
  const [region, setRegion] = useState("Punjab · India");
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setRegion(`${latitude.toFixed(2)}, ${longitude.toFixed(2)} (Detected)`);
      setIsLocating(false);
    }, (err) => {
      console.error(err);
      setIsLocating(false);
    });
  };

  return (
    <div className="max-w-[900px] mx-auto">
      <TopBar title="Settings" subtitle="Preferences and account" />
      <div className="glass-strong rounded-3xl shadow-elegant overflow-hidden">
        <Row Icon={User} title="Profile" desc="Agronomist · Field Specialist">
          <button className="text-xs font-medium px-3 py-1.5 rounded-full glass hover:bg-accent/60">Edit</button>
        </Row>
        <Row Icon={Bell} title="Disease alerts" desc="Push when high-risk weather is detected">
          <Toggle defaultOn />
        </Row>
        <Row Icon={Globe} title="Region" desc={region}>
          <button 
            onClick={handleLocate}
            disabled={isLocating}
            className="text-xs font-medium px-3 py-1.5 rounded-full glass hover:bg-accent/60 inline-flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isLocating ? <Loader2 className="size-3 animate-spin" /> : <MapPin className="size-3" />}
            {isLocating ? "Locating..." : "Locate Me"}
          </button>
        </Row>

        <Row Icon={Shield} title="Data privacy" desc="Your scans are encrypted and never sold">
          <Toggle defaultOn />
        </Row>
      </div>
    </div>
  );
}
