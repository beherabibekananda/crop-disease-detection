import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/app/TopBar";
import { ChatInterface } from "@/components/app/ChatInterface";
import { Bot, BookOpen, Lightbulb, Leaf } from "lucide-react";

export const Route = createFileRoute("/agronomist")({
  head: () => ({
    meta: [
      { title: "AI Agronomist · CropSense AI" },
      { name: "description", content: "Chat with an AI agronomy assistant trained on millions of field cases." },
    ],
  }),
  component: Agronomist,
});

function Agronomist() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <TopBar title="AI Agronomist" subtitle="Ask anything about crops, pests, and treatment." />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <ChatInterface />
        <aside className="space-y-4">
          <div className="glass-strong rounded-3xl p-6 shadow-elegant">
            <div className="size-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
              <Bot className="size-5 text-primary-foreground" />
            </div>
            <div className="mt-4 font-semibold">How I can help</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {([
                ["Diagnose", "From a description or image", Leaf],
                ["Treat", "Step-by-step protocols", BookOpen],
                ["Prevent", "Field hygiene & rotation", Lightbulb],
              ] as const).map(([t, d, I]) => {
                const Icon = I as React.ComponentType<{ className?: string }>;
                return (
                  <li key={t as string} className="flex gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t}</div>
                      <div className="text-xs">{d}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="glass-strong rounded-3xl p-6 shadow-elegant">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Knowledge sources</div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div>· FAO Crop Protection Compendium</div>
              <div>· USDA Plant Disease Handbook</div>
              <div>· CABI Plantwise Knowledge Bank</div>
              <div>· Peer-reviewed agronomy journals</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
