import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TopBar } from "@/components/app/TopBar";
import { systemStats } from "@/mock-data";
import { Database, Layers, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Dataset Insights · CropSense AI" },
      { name: "description", content: "Explore the model architecture, training corpus, and per-class accuracy." },
    ],
  }),
  component: Insights,
});

const classes = [
  { name: "Apple Scab", acc: 98.4, n: 8400 },
  { name: "Tomato Late Blight", acc: 97.1, n: 9200 },
  { name: "Maize Rust", acc: 96.5, n: 7400 },
  { name: "Grape Powdery Mildew", acc: 95.8, n: 6600 },
  { name: "Potato Early Blight", acc: 94.9, n: 8100 },
  { name: "Wheat Septoria", acc: 93.7, n: 7900 },
];

function Insights() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <TopBar title="Dataset Insights" subtitle="What powers your diagnoses." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((s) => (
          <div key={s.label} className="glass-strong rounded-2xl p-5 shadow-elegant">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-3xl font-semibold mt-1 tracking-tight gradient-text">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 glass-strong rounded-3xl p-6 shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Per-class accuracy</div>
              <div className="text-lg font-semibold">Top disease classifiers</div>
            </div>
            <BarChart3 className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-5 space-y-4">
            {classes.map((c, i) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono text-muted-foreground">{c.acc}% · {c.n.toLocaleString()} imgs</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.acc}%` }}
                    transition={{ delay: i * 0.05, duration: 0.8 }}
                    className="h-full"
                    style={{ background: "linear-gradient(90deg, var(--primary), var(--primary-glow))" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-elegant">
            <div className="size-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
              <Layers className="size-5 text-primary-foreground" />
            </div>
            <div className="mt-4 font-semibold">Architecture</div>
            <p className="text-xs text-muted-foreground mt-1">Ultimate Ensemble of 4 heterogeneous CNN architectures with weighted confidence averaging.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              {["VGG16", "EfficientNetB0", "InceptionV3", "AlexNet"].map((m) => (
                <div key={m} className="rounded-xl bg-accent/40 py-2 text-[11px] font-medium">{m}</div>
              ))}
            </div>
          </div>
          <div className="glass-strong rounded-3xl p-6 shadow-elegant">
            <div className="size-10 rounded-xl bg-accent/60 grid place-items-center">
              <Database className="size-5 text-primary" />
            </div>
            <div className="mt-4 font-semibold">Training corpus</div>
            <p className="text-xs text-muted-foreground mt-1">Based on the New Plant Diseases Dataset (PlantVillage) containing 87,000+ laboratory-validated and augmented images.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
