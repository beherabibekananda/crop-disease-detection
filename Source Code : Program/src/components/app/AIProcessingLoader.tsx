import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  "Processing image",
  "Extracting leaf features",
  "Running CNN ensemble",
  "Matching disease patterns",
  "Generating treatment",
];

interface Props {
  imageUrl: string;
  onDone: () => void;
}

export function AIProcessingLoader({ imageUrl, onDone }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="relative glass-strong rounded-3xl overflow-hidden aspect-[4/3]">
        <img src={imageUrl} alt="Analyzing" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-primary/40" />
        <motion.div
          className="absolute inset-x-0 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent, color-mix(in oklab, var(--primary-glow) 60%, transparent), transparent)",
            filter: "blur(2px)",
          }}
          animate={{ y: ["-100%", "400%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative size-32">
            <span className="absolute inset-0 rounded-full border-2 border-primary-glow/60 animate-pulse-ring" />
            <span className="absolute inset-0 rounded-full border-2 border-primary-glow/40 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
            <span className="absolute inset-0 rounded-full border-2 border-primary-glow/20 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="size-14 rounded-full glass-strong grid place-items-center shadow-glow">
                <Loader2 className="size-6 animate-spin text-primary-glow" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3 glass rounded-xl px-3 py-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-primary-glow">● ANALYZING</span>
            <span className="text-muted-foreground">CNN-Ensemble v2.4</span>
          </div>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-6 lg:p-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Pipeline</div>
        <h3 className="text-2xl font-semibold mt-1">Diagnosing your sample</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-stage neural inference with confidence calibration.
        </p>

        <ul className="mt-6 space-y-3">
          {steps.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div
                  className={
                    "size-7 rounded-full grid place-items-center shrink-0 transition-colors " +
                    (done ? "bg-success text-primary-foreground" : active ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground")
                  }
                >
                  {done ? <Check className="size-4" /> : active ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
                </div>
                <span className={"text-sm " + (active ? "font-medium" : done ? "text-muted-foreground line-through" : "text-muted-foreground")}>
                  {label}
                </span>
                {active && (
                  <div className="ml-auto h-1 w-24 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-primary-glow" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.7 }} />
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
