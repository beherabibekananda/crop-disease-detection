import { motion } from "framer-motion";
import { UploadCloud, Camera, Sparkles, Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  onFile: (dataUrl: string) => void;
  onSample: () => void;
}

export function UploadZone({ onFile, onSample }: Props) {
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onFile(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      className="relative glass-strong rounded-3xl p-8 lg:p-12 overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 opacity-60" style={{ backgroundImage: "var(--gradient-glow)" }} />
      <motion.div
        animate={{ scale: drag ? 1.02 : 1, borderColor: drag ? "var(--primary-glow)" : "var(--border)" }}
        className="rounded-2xl border-2 border-dashed p-8 lg:p-14 text-center"
        style={{ borderColor: "var(--border)" }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto size-20 rounded-2xl gradient-hero grid place-items-center shadow-glow"
        >
          <UploadCloud className="size-9 text-primary-foreground" />
        </motion.div>
        <h3 className="mt-6 text-xl lg:text-2xl font-semibold tracking-tight">
          Drop a leaf image to diagnose
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Our 4-model ensemble identifies 38 distinct plant disease classes in under 2 seconds.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium gradient-hero text-primary-foreground shadow-glow hover:opacity-95"
          >
            <ImageIcon className="size-4" /> Upload Image
          </button>
          <button
            onClick={() => cameraRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium glass hover:bg-accent/60"
          >
            <Camera className="size-4" /> Use Camera
          </button>
          <button
            onClick={onSample}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border border-border hover:bg-accent/40"
          >
            <Sparkles className="size-4" /> Test Sample
          </button>
        </div>

        <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={(e) => handleFiles(e.target.files)} />

        <p className="mt-6 text-[11px] text-muted-foreground">Supports JPG · PNG · HEIC up to 10MB</p>
      </motion.div>
    </div>
  );
}
