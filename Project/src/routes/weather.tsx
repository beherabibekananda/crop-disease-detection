import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/app/TopBar";
import { WeatherWidget } from "@/components/app/Widgets";
import { Droplets, Wind, Thermometer, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather Intelligence · CropSense AI" },
      { name: "description", content: "Hyperlocal forecasts and disease-risk alerts for your fields." },
    ],
  }),
  component: Weather,
});

function Weather() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <TopBar title="Weather Intelligence" subtitle="Hyperlocal forecast tied to disease risk." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeatherWidget />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { Icon: Droplets, label: "Humidity", value: "68%", sub: "↑ rising" },
              { Icon: Wind, label: "Wind", value: "12 km/h", sub: "NE" },
              { Icon: Thermometer, label: "Soil temp", value: "22°C", sub: "optimal" },
            ].map(({ Icon, label, value, sub }) => (
              <div key={label} className="glass-strong rounded-2xl p-5 shadow-elegant">
                <Icon className="size-5 text-primary" />
                <div className="text-xs text-muted-foreground mt-2">{label}</div>
                <div className="text-2xl font-semibold tracking-tight">{value}</div>
                <div className="text-[11px] text-muted-foreground">{sub}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[
            { c: "Late Blight", risk: "High", note: "High humidity + 14–18°C nights Wed–Thu" },
            { c: "Powdery Mildew", risk: "Moderate", note: "Dry days with cool nights" },
            { c: "Aphid pressure", risk: "Low", note: "Beneficial population stable" },
          ].map((a) => (
            <div key={a.c} className="glass-strong rounded-2xl p-5 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-warning/15 grid place-items-center">
                  <AlertTriangle className="size-4 text-[oklch(0.55_0.16_75)]" />
                </div>
                <div>
                  <div className="text-sm font-medium">{a.c}</div>
                  <div className="text-[11px] text-muted-foreground">Risk: {a.risk}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{a.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
