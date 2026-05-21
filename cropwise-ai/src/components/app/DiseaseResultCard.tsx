import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Download, RefreshCw, ShieldCheck, Sprout, Wind } from "lucide-react";
import type { DiseasePrediction } from "@/mock-data";
import { cn } from "@/lib/utils";

const severityStyles = {
  low: { label: "Low risk", color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  moderate: { label: "Moderate", color: "bg-warning/15 text-[oklch(0.55_0.16_75)] border-warning/30", icon: AlertTriangle },
  high: { label: "High severity", color: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
};

interface Props {
  imageUrl: string;
  prediction: DiseasePrediction;
  onReset: () => void;
}

export function DiseaseResultCard({ imageUrl, prediction, onReset }: Props) {
  const sev = severityStyles[prediction.severity];
  const SevIcon = sev.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid lg:grid-cols-5 gap-6"
    >
      <div className="lg:col-span-2 glass-strong rounded-3xl p-3 overflow-hidden">
        <div className="relative aspect-square rounded-2xl overflow-hidden">
          <img src={imageUrl} alt={prediction.disease} className="absolute inset-0 size-full object-cover" />
          <div className={cn("absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md", prediction.disease === "Not a Leaf" ? "bg-destructive/15 text-destructive border-destructive/30" : sev.color)}>
            {prediction.disease === "Not a Leaf" ? (
              <>
                <AlertTriangle className="size-3.5 inline mr-1.5 -mt-0.5" />
                Invalid Image
              </>
            ) : (
              <>
                <SevIcon className="size-3.5 inline mr-1.5 -mt-0.5" />
                {sev.label}
              </>
            )}
          </div>
        </div>
        <div className="px-3 py-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Detected on</div>
          <div className="font-medium">
            {prediction.disease === "Not a Leaf" ? "Non-leaf image" : `${prediction.crop} leaf`} · sample.jpg
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 glass-strong rounded-3xl p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary-glow font-medium">Diagnosis</div>
            <h2 className="text-3xl font-semibold tracking-tight mt-1">{prediction.disease}</h2>
            {prediction.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">{prediction.description}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Model confidence</span>
            <span className="font-mono text-foreground">{prediction.confidence.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prediction.confidence}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--primary), var(--primary-glow))" }}
            />
          </div>
        </div>

        {prediction.disease !== "Not a Leaf" ? (
          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <ResultBlock icon={Sprout} title="Treatment" items={prediction.treatment} />
            <ResultBlock icon={ShieldCheck} title="Prevention" items={prediction.prevention} />
            <ResultBlock icon={Wind} title="Conditions" items={prediction.causes} />
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-2xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-destructive">Image Verification Failed</div>
              <div className="text-xs text-muted-foreground mt-1">
                The uploaded image does not appear to be a plant leaf. CropSense AI only diagnoses valid plant leaf images. Please upload a clear photo of a crop leaf.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {prediction.disease !== "Not a Leaf" && (
            <button className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium gradient-hero text-primary-foreground shadow-glow">
              <Download className="size-4" /> Download PDF Report
            </button>
          )}
          <button onClick={onReset} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium glass hover:bg-accent/60">
            <RefreshCw className="size-4" /> Analyze Another
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ResultBlock({ icon: Icon, title, items }: { icon: React.ComponentType<{ className?: string }>; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 p-4 bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-lg bg-primary/10 grid place-items-center">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      <ul className="space-y-2 text-xs text-muted-foreground">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary-glow" />
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
