import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TopBar } from "@/components/app/TopBar";
import { systemStats } from "@/mock-data";
import { 
  Database, 
  Layers, 
  BarChart3, 
  Grid3X3, 
  Search, 
  Image as ImageIcon, 
  Info, 
  AlertTriangle,
  Download,
  Eye
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

import cmDataRaw from "../mock-data/confusion_matrix.json";
import cmImage from "../mock-data/confusion_matrix.png";

// Declare typescript interface for our confusion matrix data
interface ClassMetric {
  precision: number;
  recall: number;
  f1: number;
  samples: number;
}

interface CMData {
  classes: string[];
  matrix: number[][];
  metrics: Record<string, ClassMetric>;
  overall: {
    accuracy: number;
    weighted_precision: number;
    weighted_recall: number;
    weighted_f1: number;
    total_samples: number;
  };
}

const cmData = cmDataRaw as CMData;

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Dataset Insights · CropSense AI" },
      { name: "description", content: "Explore the model architecture, training corpus, per-class accuracy, and interactive ensemble confusion matrix." },
    ],
  }),
  component: Insights,
});

const classesOverview = [
  { name: "Apple Scab", acc: 99.1, n: 8400 },
  { name: "Tomato Late Blight", acc: 98.6, n: 9200 },
  { name: "Maize Rust", acc: 97.9, n: 7400 },
  { name: "Grape Powdery Mildew", acc: 97.2, n: 6600 },
  { name: "Potato Early Blight", acc: 96.8, n: 8100 },
  { name: "Wheat Septoria", acc: 95.9, n: 7900 },
];

const cropGroups = [
  { id: "all", name: "All Crops (38x38 Matrix)" },
  { id: "Apple", name: "Apple (4 classes)" },
  { id: "Cherry", name: "Cherry (2 classes)" },
  { id: "Corn", name: "Corn / Maize (4 classes)" },
  { id: "Grape", name: "Grape (4 classes)" },
  { id: "Peach", name: "Peach (2 classes)" },
  { id: "Pepper", name: "Pepper (2 classes)" },
  { id: "Potato", name: "Potato (3 classes)" },
  { id: "Strawberry", name: "Strawberry (2 classes)" },
  { id: "Tomato", name: "Tomato (10 classes)" },
  { id: "Other", name: "Other Crops (Blueberry, Orange, Raspberry, Soybean, Squash)" }
];

const getErrorExplanation = (actual: string, predicted: string) => {
  if ((actual.includes("scab") && predicted.includes("rust")) || (actual.includes("rust") && predicted.includes("scab"))) {
    return "Early-stage fungal lesions are tiny, brownish, and circular, showing overlapping texture patterns that confuse spatial CNNs.";
  }
  if ((actual.includes("Early_blight") && predicted.includes("Late_blight")) || (actual.includes("Late_blight") && predicted.includes("Early_blight"))) {
    return "Foliar necrosis shapes are highly similar. Early blight concentric rings vs. late blight water-soaked spots are only distinct in advanced stages.";
  }
  if (actual.includes("Bacterial_spot") && predicted.includes("Septoria")) {
    return "Both pathogens produce numerous small, dark brown circular leaf spots. The edge detection features of Model 1 (VGG16) show high boundary overlap.";
  }
  if (actual.includes("Target_Spot") && predicted.includes("Early_blight")) {
    return "Target spot lesions exhibit circular target-board concentric rings almost identical to Early Blight rings, leading to feature maps similarity.";
  }
  if (actual.includes("Yellow_Leaf_Curl") && predicted.includes("healthy")) {
    return "In early onset, Yellow Leaf Curl virus shows very minor leaf curling and no chlorosis, presenting features identical to healthy leaf margins.";
  }
  if (actual.includes("Black_rot") && predicted.includes("Leaf_blight")) {
    return "Grape black rot lesions on leaves manifest as small reddish-brown spots that resemble early-stage Isariopsis leaf spots.";
  }
  if (actual.includes("Cercospora") && predicted.includes("Northern_Leaf_Blight")) {
    return "Maize foliar blights produce elongated tan/gray lesions that run parallel to veins, causing linear kernel feature overlap.";
  }
  if (actual.includes("Bacterial_spot") && actual.includes("Peach") && predicted.includes("Pepper")) {
    return "Cross-crop bacterial lesions share a common bacterial necrosis shape. Small circular shot-holes can be misclassified across plant species if leaf contours are obscured.";
  }
  return "Necrotic leaf tissues and spore patterns share high pixel-intensity covariance, causing minor boundary errors in softmax classification.";
};

const cleanClassName = (name: string) => {
  return name
    .replace(/___/g, " · ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

function Insights() {
  const [activeTab, setActiveTab] = useState<"overview" | "matrix">("overview");
  const [selectedCropGroup, setSelectedCropGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showStaticModal, setShowStaticModal] = useState<boolean>(false);

  // Calculate row totals (total validation samples per class)
  const rowTotals = useMemo(() => {
    return cmData.matrix.map((row) => row.reduce((sum, val) => sum + val, 0));
  }, []);

  // Filter classes based on selected crop group and search query
  const filteredClasses = useMemo(() => {
    return cmData.classes
      .map((name, idx) => ({ name, originalIdx: idx }))
      .filter((item) => {
        // Filter by crop group
        if (selectedCropGroup !== "all") {
          if (selectedCropGroup === "Other") {
            const isOther = ["Blueberry", "Orange", "Raspberry", "Soybean", "Squash"].some((prefix) =>
              item.name.startsWith(prefix)
            );
            if (!isOther) return false;
          } else {
            if (!item.name.startsWith(selectedCropGroup)) return false;
          }
        }
        // Filter by search query
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          const clean = cleanClassName(item.name).toLowerCase();
          if (!clean.includes(query)) return false;
        }
        return true;
      });
  }, [selectedCropGroup, searchQuery]);

  // Calculate Top 5 errors dynamically from the matrix
  const topErrorsList = useMemo(() => {
    const list: {
      actual: string;
      predicted: string;
      actualIdx: number;
      predictedIdx: number;
      count: number;
      percentage: number;
    }[] = [];

    const matrix = cmData.matrix;
    const classes = cmData.classes;

    for (let i = 0; i < classes.length; i++) {
      const rowTotal = rowTotals[i];
      for (let j = 0; j < classes.length; j++) {
        if (i !== j && matrix[i][j] > 0) {
          list.push({
            actual: classes[i],
            predicted: classes[j],
            actualIdx: i,
            predictedIdx: j,
            count: matrix[i][j],
            percentage: rowTotal > 0 ? (matrix[i][j] / rowTotal) * 100 : 0,
          });
        }
      }
    }

    // Sort by count descending and take top 5
    return list.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [rowTotals]);

  // Drilldown card content based on selected or hovered cell
  const drilldownPanel = useMemo(() => {
    const cell = selectedCell || hoveredCell;
    if (!cell) return null;

    const { row, col } = cell;
    const actualName = cmData.classes[row];
    const predictedName = cmData.classes[col];
    const count = cmData.matrix[row][col];
    const rowTotal = rowTotals[row];
    const percentage = rowTotal > 0 ? (count / rowTotal) * 100 : 0;
    const isCorrect = row === col;
    const explanation = getErrorExplanation(actualName, predictedName);

    return (
      <div className="glass-strong rounded-3xl p-6 shadow-elegant h-full flex flex-col justify-between border border-border/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-32 rounded-full opacity-10 blur-2xl" style={{ background: isCorrect ? "var(--success)" : "var(--destructive)" }} />
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Cell Diagnostic Details</div>
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                isCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              )}
            >
              {isCorrect ? "Correct Diagnosis" : "Misclassification"}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Ground Truth (Actual Label)</div>
              <div className="text-sm font-semibold mt-0.5 text-foreground">{cleanClassName(actualName)}</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Prediction Output</div>
              <div className="text-sm font-semibold mt-0.5 text-foreground">{cleanClassName(predictedName)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-accent/20 rounded-xl p-3 text-center border border-border/20">
                <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Sample Count</div>
                <div className="text-2xl font-bold mt-1 text-primary">{count}</div>
              </div>
              <div className="bg-accent/20 rounded-xl p-3 text-center border border-border/20">
                <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Error Rate</div>
                <div className="text-2xl font-bold mt-1 text-primary">{percentage.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-border/30 pt-4">
            <div className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
              <Info className="size-3.5 text-primary" />
              {isCorrect ? "Classification Insights" : "Pathological Confusion Analysis"}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {isCorrect
                ? `The ensemble model successfully classified ${count} out of ${rowTotal} validation images for this disease class, demonstrating robust texture and edge recognition.`
                : explanation}
            </p>
          </div>
        </div>

        {!isCorrect && count > 0 && (
          <div className="mt-5 rounded-xl bg-primary/5 border border-primary/20 p-3 text-[11px] text-foreground/80 leading-normal">
            <strong className="text-primary">Soft Voting Impact:</strong> By mathematically averaging softmax distributions, the ensemble cancels out architectural errors, yielding accurate classifications in boundary regions.
          </div>
        )}
      </div>
    );
  }, [selectedCell, hoveredCell, rowTotals]);

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <TopBar title="System Evaluation" subtitle="Statistical insights and diagnostics of the classification engine." />

      {/* Tabs Menu */}
      <div className="flex border-b border-border/50 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "pb-3 text-sm font-medium transition-all px-4 border-b-2 outline-none relative",
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Overview & Per-Class Stats
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={cn(
            "pb-3 text-sm font-medium transition-all px-4 border-b-2 outline-none relative",
            activeTab === "matrix"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Ensemble Confusion Matrix
        </button>
      </div>

      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStats.map((s) => (
              <div key={s.label} className="glass-strong rounded-2xl p-5 shadow-elegant relative overflow-hidden">
                <div className="absolute -top-12 -right-12 size-32 rounded-full opacity-20 blur-2xl bg-primary-glow" />
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-3xl font-semibold mt-1 tracking-tight gradient-text">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Per-class Accuracy Bar Chart */}
            <div className="lg:col-span-2 glass-strong rounded-3xl p-6 shadow-elegant border border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Per-class accuracy</div>
                  <div className="text-lg font-semibold">Top disease classifiers</div>
                </div>
                <BarChart3 className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-5 space-y-4">
                {classesOverview.map((c, i) => (
                  <div key={c.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{c.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {c.acc}% · {c.n.toLocaleString()} imgs
                      </span>
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

            {/* Side Column info cards */}
            <div className="space-y-6">
              <div className="glass-strong rounded-3xl p-6 shadow-elegant border border-border/40">
                <div className="size-10 rounded-xl gradient-hero grid place-items-center shadow-glow">
                  <Layers className="size-5 text-primary-foreground" />
                </div>
                <div className="mt-4 font-semibold">Architecture</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ultimate Ensemble of 4 heterogeneous CNN architectures with weighted confidence averaging.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  {["VGG16", "EfficientNetB0", "InceptionV3", "AlexNet"].map((m) => (
                    <div key={m} className="rounded-xl bg-accent/40 py-2 text-[11px] font-medium border border-border/10">
                      {m}
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-strong rounded-3xl p-6 shadow-elegant border border-border/40">
                <div className="size-10 rounded-xl bg-accent/60 grid place-items-center">
                  <Database className="size-5 text-primary" />
                </div>
                <div className="mt-4 font-semibold">Training corpus</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on the New Plant Diseases Dataset (PlantVillage) containing 87,000+ laboratory-validated and
                  augmented images.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "matrix" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header Card */}
          <div className="glass-strong rounded-3xl p-6 shadow-elegant border border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Grid3X3 className="size-5 text-primary" /> Ensemble Confusion Matrix Explorer
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                  Interactive evaluation matrix covering 38 disease categories of the New Plant Diseases Dataset. True positives populate the diagonal (deep green/teal gradients) and off-diagonal cells represent visual misclassifications (warm red/orange gradients).
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => setShowStaticModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 text-xs px-3.5 py-2 font-medium transition-all"
                >
                  <ImageIcon className="size-3.5 text-primary" /> View High-Res PNG
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid md:grid-cols-3 gap-3 mt-6 border-t border-border/30 pt-5">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Filter by Crop Group</label>
                <select
                  value={selectedCropGroup}
                  onChange={(e) => {
                    setSelectedCropGroup(e.target.value);
                    setSelectedCell(null);
                  }}
                  className="w-full bg-background/50 backdrop-blur rounded-xl border border-border/50 text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                >
                  {cropGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Search Specific Diseases</label>
                <div className="relative">
                  <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search e.g. blight, healthy, scab..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedCell(null);
                    }}
                    className="w-full bg-background/50 backdrop-blur rounded-xl border border-border/50 text-xs pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Table & Diagnostics Side Grid */}
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Heatmap Grid Box */}
            <div className="lg:col-span-2 glass-strong rounded-3xl p-5 shadow-elegant border border-border/40 flex flex-col justify-between overflow-hidden">
              <div className="mb-3 flex justify-between items-center">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Heatmap Display ({filteredClasses.length} × {filteredClasses.length} grid)
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-success/75" /> True Positives
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-destructive/60" /> Misclassifications
                  </span>
                </div>
              </div>

              {filteredClasses.length === 0 ? (
                <div className="text-center py-20 bg-accent/10 rounded-2xl border border-dashed border-border/60">
                  <AlertTriangle className="size-8 text-warning mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-semibold">No classes match search parameters</div>
                  <p className="text-xs text-muted-foreground mt-1">Try clearing the search query or selecting a different crop group.</p>
                </div>
              ) : (
                <div className="overflow-auto max-w-full rounded-2xl border border-border/30 bg-background/30 shadow-inner relative max-h-[580px]">
                  <table className="border-collapse table-fixed w-full text-center">
                    <thead>
                      <tr className="sticky top-0 bg-background/95 backdrop-blur z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                        <th className="sticky left-0 bg-background/95 backdrop-blur border-r border-b border-border/40 p-2 text-[10px] font-semibold text-muted-foreground w-[160px] text-right z-30">
                          Actual \ Pred
                        </th>
                        {filteredClasses.map((col) => (
                          <th
                            key={col.name}
                            className="border-b border-r border-border/20 p-1 text-[9px] font-medium text-muted-foreground min-w-[28px] h-[75px]"
                            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                          >
                            <span className="inline-block transform -rotate-180 text-left truncate max-w-[65px] font-mono leading-none">
                              {cleanClassName(col.name).split(" · ")[1] || cleanClassName(col.name)}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClasses.map((row) => {
                        const origRIdx = row.originalIdx;
                        const rowTotalCount = rowTotals[origRIdx];

                        return (
                          <tr key={row.name} className="hover:bg-accent/15 transition-colors">
                            <td className="sticky left-0 bg-background/95 backdrop-blur border-r border-b border-border/40 p-1.5 text-[10px] font-semibold text-muted-foreground text-right z-10 w-[160px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                              {cleanClassName(row.name)}
                            </td>
                            {filteredClasses.map((col) => {
                              const origCIdx = col.originalIdx;
                              const val = cmData.matrix[origRIdx][origCIdx];
                              const isDiagonal = origRIdx === origCIdx;

                              // Styling logic
                              let cellBg = "transparent";
                              let textColor = "text-muted-foreground/30";

                              if (isDiagonal) {
                                const percentage = rowTotalCount > 0 ? (val / rowTotalCount) * 100 : 0;
                                cellBg = `color-mix(in oklab, var(--success) ${Math.max(15, percentage)}%, transparent)`;
                                textColor = "text-foreground font-semibold";
                              } else if (val > 0) {
                                cellBg = `color-mix(in oklab, var(--destructive) ${Math.min(100, 20 + val * 10)}%, transparent)`;
                                textColor = "text-destructive font-bold";
                              }

                              const isHovered = hoveredCell && (hoveredCell.row === origRIdx || hoveredCell.col === origCIdx);
                              const isSelected = selectedCell && selectedCell.row === origRIdx && selectedCell.col === origCIdx;

                              return (
                                <td
                                  key={col.name}
                                  onMouseEnter={() => setHoveredCell({ row: origRIdx, col: origCIdx })}
                                  onMouseLeave={() => setHoveredCell(null)}
                                  onClick={() => setSelectedCell({ row: origRIdx, col: origCIdx })}
                                  className={cn(
                                    "border-r border-b border-border/20 text-[9px] cursor-pointer transition-all duration-75 min-w-[28px] h-[28px] relative select-none",
                                    isSelected ? "ring-2 ring-primary ring-inset z-10" : ""
                                  )}
                                  style={{
                                    backgroundColor: cellBg,
                                    outline: isHovered ? "1.5px solid var(--primary)" : undefined,
                                    zIndex: isHovered ? 5 : undefined,
                                  }}
                                >
                                  <span className={cn(textColor)}>{val > 0 ? val : ""}</span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Diagnostics Panel Card */}
            <div className="space-y-6 h-full flex flex-col">
              {/* Conditional Drilldown Panel */}
              <div className="flex-1 min-h-[300px]">
                {drilldownPanel || (
                  <div className="glass-strong rounded-3xl p-6 shadow-elegant h-full flex flex-col justify-center items-center text-center border border-border/40 min-h-[300px]">
                    <div className="size-12 rounded-2xl bg-accent/40 grid place-items-center mb-4 border border-border/20">
                      <Grid3X3 className="size-6 text-primary" />
                    </div>
                    <div className="font-semibold text-sm text-foreground">Diagnostics Panel</div>
                    <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
                      Hover over any cell or click on a grid element to inspect its classification statistics, visual similarity analysis, and soft-voting results.
                    </p>
                  </div>
                )}
              </div>

              {/* Top Confusions List Card */}
              <div className="glass-strong rounded-3xl p-6 shadow-elegant border border-border/40">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                  Top Ensemble Confusions
                </div>
                <div className="space-y-4">
                  {topErrorsList.map((err, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedCell({ row: err.actualIdx, col: err.predictedIdx })}
                      className="group cursor-pointer hover:bg-accent/20 border border-border/10 rounded-2xl p-3 transition-colors duration-100"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0">
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            Actual: {cleanClassName(err.actual).split(" · ")[1]}
                          </div>
                          <div className="text-[10px] text-destructive font-mono truncate font-semibold">
                            Predicted: {cleanClassName(err.predicted).split(" · ")[1]}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-destructive px-1.5 py-0.5 bg-destructive/15 rounded-md shrink-0">
                          {err.count} errs
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden relative">
                        <div
                          className="h-full bg-destructive"
                          style={{ width: `${Math.min(100, err.percentage * 15)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Script instructions card */}
          <div className="glass-strong rounded-3xl p-6 shadow-elegant border border-border/40">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0 border border-primary/20">
                <Download className="size-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Regeneration Pipeline</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  The data displayed above is generated dynamically by evaluating the validation corpus split on local Keras models. If you have updated model files or new datasets in your Google Drive, you can rebuild this matrix by running the generator script:
                </p>
                <div className="mt-3 bg-accent/40 rounded-xl p-3 border border-border/20">
                  <code className="text-[11px] font-mono text-foreground/90 block">
                    python3 ml-pipeline/generate_confusion_matrix.py
                  </code>
                </div>
                <div className="mt-3 text-[10px] text-muted-foreground leading-normal">
                  * Note: Requires <code className="font-mono">numpy</code>, <code className="font-mono">matplotlib</code>, and <code className="font-mono">seaborn</code>. Saved outputs will automatically sync with this dashboard upon reloading.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal Dialog for Static High-Resolution Plot */}
      {showStaticModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 grid place-items-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-[1000px] rounded-3xl p-6 shadow-glow border border-border/50 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/30">
              <div>
                <h4 className="font-semibold text-lg">Ensemble Confusion Matrix Plot</h4>
                <p className="text-xs text-muted-foreground">Publication-grade matrix visualization generated via Matplotlib.</p>
              </div>
              <button
                onClick={() => setShowStaticModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold px-3 py-1 bg-accent/50 hover:bg-accent rounded-xl border border-border/50 transition-colors"
              >
                Close View
              </button>
            </div>
            
            <div className="flex-1 overflow-auto mt-4 grid place-items-center">
              <img
                src={cmImage}
                alt="Ultimate Ensemble Confusion Matrix"
                className="max-w-full h-auto rounded-xl object-contain shadow-elegant border border-border/20 max-h-[60vh]"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-border/30 flex justify-between items-center text-xs text-muted-foreground">
              <span>File path: <code className="font-mono">Source Code : Program/confusion_matrix.png</code></span>
              <a
                href={cmImage}
                download="Ultimate_Ensemble_Confusion_Matrix.png"
                className="inline-flex items-center gap-1 bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Download className="size-3" /> Save to Computer
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

