import { useState, useRef, useEffect } from "react";
import { Search, Bell, Leaf, X, Sprout } from "lucide-react";
import { sampleDiseases } from "@/mock-data";
import { Link } from "@tanstack/react-router";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof sampleDiseases>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length > 1) {
      const filtered = sampleDiseases.filter(d => 
        d.disease.toLowerCase().includes(query.toLowerCase()) ||
        d.crop.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center gap-3 mb-6 lg:mb-8">
      <div className="lg:hidden size-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
        <Leaf className="size-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>
      
      <div className="relative hidden md:block" ref={containerRef}>
        <div className="flex items-center gap-2 glass rounded-full px-4 py-2 w-72 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crops, diseases…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => setQuery("")}><X className="size-3 text-muted-foreground" /></button>
          ) : (
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute top-full right-0 mt-2 w-80 glass-strong rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-3 py-2">Quick Results</div>
            <div className="max-h-60 overflow-y-auto">
              {results.map((r) => (
                <Link 
                  key={r.disease} 
                  to="/detection" 
                  search={{ disease: r.disease }}
                  onClick={() => { setQuery(""); setShowResults(false); }}
                  className="block p-3 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 grid place-items-center group-hover:bg-primary/20">
                      <Sprout className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{r.disease}</div>
                      <div className="text-[10px] text-muted-foreground">{r.crop} · {r.confidence}% match</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-2 border-t border-border/50 mt-1">
              <Link to="/detection" className="block text-center text-xs text-primary font-medium hover:underline py-1">
                View all in Disease Database →
              </Link>
            </div>
          </div>
        )}
      </div>

      <button className="glass rounded-full size-10 grid place-items-center hover:scale-105 transition-transform">
        <Bell className="size-4" />
      </button>
    </header>
  );
}
