import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Paperclip, Send, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { suggestedQuestions } from "@/mock-data";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  typing?: boolean;
  image?: string;
}

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function ChatInterface() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m0",
      role: "assistant",
      content:
        "Hello! I'm your AI Agronomist. I've trained on **87,000+ field images** and the latest agricultural research. Ask me anything about crop health, treatments, or pests.",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const send = async (text: string) => {
    if ((!text.trim() && !attachedImage) || busy) return;
    
    const userMsg: Msg = { 
        id: crypto.randomUUID(), 
        role: "user", 
        content: text, 
        time: now(),
        image: attachedImage || undefined 
    };
    
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const currentImage = attachedImage;
    setAttachedImage(null);
    setBusy(true);
    
    const typingId = crypto.randomUUID();
    setMessages((m) => [...m, { id: typingId, role: "assistant", content: "", time: now(), typing: true }]);

    try {
      let contentPayload: any = text || "Please analyze this image.";
      
      if (currentImage) {
        contentPayload = [
          { type: "text", text: text || "What is wrong with this plant? How do I treat it?" },
          { type: "image_url", image_url: { url: currentImage } }
        ];
      }

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ""}`
        },
        body: JSON.stringify({
          model: currentImage ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a highly knowledgeable AI Agronomist. Help farmers identify crop diseases, provide treatment plans, and give agricultural advice. Keep responses concise and format your responses with Markdown."
            },
            ...messages.filter(m => m.role !== 'assistant' || !m.typing).map((m) => ({
              role: m.role,
              content: m.image ? [
                { type: "text", text: m.content },
                { type: "image_url", image_url: { url: m.image } }
              ] : m.content
            })),
            {
              role: "user",
              content: contentPayload
            }
          ]
        })
      });

      const data = await res.json();
      
      if (data.error) {
          throw new Error(data.error.message || "API Error");
      }
      
      const reply = data.choices[0].message.content;

      setMessages((m) =>
        m.map((msg) => (msg.id === typingId ? { ...msg, content: reply, typing: false } : msg)),
      );
    } catch (error) {
      console.error(error);
      setMessages((m) =>
        m.map((msg) => (msg.id === typingId ? { ...msg, content: "Sorry, I am having trouble connecting to the AI brain right now.", typing: false } : msg)),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-strong rounded-3xl flex flex-col h-[calc(100vh-180px)] min-h-[560px] overflow-hidden relative">
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="size-9 rounded-xl gradient-hero grid place-items-center shadow-glow">
          <Bot className="size-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-medium text-sm flex items-center gap-2">
            AI Agronomist
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium">ONLINE</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Powered by Gemini AI</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-5 pb-20">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={"flex gap-3 " + (m.role === "user" ? "flex-row-reverse" : "")}
            >
              <div
                className={
                  "size-8 rounded-full grid place-items-center shrink-0 " +
                  (m.role === "user"
                    ? "bg-gradient-to-br from-earth to-earth/70 text-primary-foreground"
                    : "gradient-hero text-primary-foreground shadow-glow")
                }
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div className={"max-w-[80%] " + (m.role === "user" ? "items-end text-right" : "")}>
                <div
                  className={
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border/60 rounded-tl-sm")
                  }
                >
                  {m.image && (
                    <img src={m.image} alt="Uploaded leaf" className="w-full max-w-[200px] rounded-lg mb-2 object-cover border border-primary-foreground/20" />
                  )}
                  {m.typing ? (
                    <span className="inline-flex gap-1">
                      <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
                    </span>
                  ) : (
                    formatMd(m.content)
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 px-1">{m.time}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length <= 1 && (
          <div className="pt-4">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="size-3" /> Suggested questions
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs rounded-full px-3 py-1.5 glass hover:bg-accent/60 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {attachedImage && (
        <div className="absolute bottom-[68px] left-4 bg-background/90 backdrop-blur border border-border p-2 rounded-lg shadow-lg">
          <button 
            type="button"
            onClick={() => setAttachedImage(null)} 
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:scale-110 transition-transform"
          >
            <X className="size-3" />
          </button>
          <img src={attachedImage} alt="Attachment" className="h-16 w-16 object-cover rounded-md" />
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="absolute bottom-0 w-full bg-background/80 backdrop-blur-md p-3 border-t border-border/50"
      >
        <div className="glass rounded-2xl pl-4 pr-2 py-2 flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground transition-colors hover:bg-accent p-2 rounded-full"
          >
            <Paperclip className="size-4" />
          </button>
          <input 
            type="file" 
            accept="image/*" 
            hidden 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a disease, crop, or upload an image…"
            className="flex-1 bg-transparent outline-none text-sm py-2 px-2"
          />
          <button
            type="submit"
            disabled={(!input.trim() && !attachedImage) || busy}
            className="size-9 rounded-xl gradient-hero text-primary-foreground grid place-items-center shadow-glow disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-muted-foreground"
      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}

function formatMd(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    } else if (p.startsWith("*") && p.endsWith("*")) {
      return <em key={i} className="italic">{p.slice(1, -1)}</em>;
    }
    return <span key={i}>{p}</span>;
  });
}
