import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, TrendingUp, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { XAIExplanation } from "@/lib/xai-engine";

export interface PredictionLogEntry {
  hour: number;
  timestamp: string;
  explanation: XAIExplanation;
}

function statusColor(status: string): string {
  switch (status) {
    case "CRITICAL": return "hsl(var(--risk-critical))";
    case "HIGH": return "hsl(var(--risk-high))";
    case "MODERATE": return "hsl(var(--risk-medium))";
    default: return "hsl(var(--risk-low))";
  }
}

function statusBg(status: string): string {
  switch (status) {
    case "CRITICAL": return "hsl(var(--risk-critical) / 0.12)";
    case "HIGH": return "hsl(var(--risk-high) / 0.12)";
    case "MODERATE": return "hsl(var(--risk-medium) / 0.12)";
    default: return "hsl(var(--risk-low) / 0.12)";
  }
}

function LogEntryCard({ entry, index }: { entry: PredictionLogEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { explanation } = entry;
  const color = statusColor(explanation.status);
  const abnormal = explanation.explanation.filter(f => f.direction !== "normal");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/30 transition-colors"
      >
        {/* Hour marker */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ backgroundColor: statusBg(explanation.status), color }}
        >
          H{entry.hour + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold font-mono" style={{ color }}>
              {explanation.risk_score}%
            </span>
            <Badge
              className="text-[8px] px-1.5 py-0 border-0 uppercase"
              style={{ backgroundColor: statusBg(explanation.status), color }}
            >
              {explanation.status}
            </Badge>
            {abnormal.length > 0 && (
              <span className="text-[9px] text-muted-foreground">
                · {abnormal.length} abnormal
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {explanation.clinical_narrative.slice(0, 80)}…
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-muted-foreground font-mono">{entry.timestamp}</span>
          {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
              {/* Narrative */}
              <div
                className="rounded-lg p-2.5 text-[10px] leading-relaxed"
                style={{ backgroundColor: `${color}08`, borderLeft: `3px solid ${color}` }}
              >
                {explanation.clinical_narrative}
              </div>

              {/* Factor breakdown */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Brain className="w-2.5 h-2.5" /> Contributing Factors
                </span>
                {explanation.explanation
                  .filter(f => f.contribution > 0.05 || f.direction !== "normal")
                  .slice(0, 5)
                  .map(f => {
                    const fColor = f.severity === "critical"
                      ? "hsl(var(--risk-critical))"
                      : f.severity === "warning"
                        ? "hsl(var(--risk-medium))"
                        : "hsl(var(--risk-low))";
                    return (
                      <div key={f.vital} className="flex items-center gap-2">
                        {f.direction !== "normal" ? (
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" style={{ color: fColor }} />
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-[hsl(var(--risk-low))]" />
                        )}
                        <span className="text-[10px] text-foreground/80 flex-1">{f.clinical_text}</span>
                        <span className="text-[9px] font-mono" style={{ color: fColor }}>
                          {(f.contribution * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Trends */}
              {explanation.trend_insights.filter(t => t.severity !== "info").length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" /> Trends
                  </span>
                  {explanation.trend_insights
                    .filter(t => t.severity !== "info")
                    .slice(0, 3)
                    .map(t => (
                      <p key={t.vital} className="text-[10px] text-muted-foreground pl-3.5">
                        • {t.description}
                      </p>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface PredictionHistoryProps {
  history: PredictionLogEntry[];
}

export function PredictionHistory({ history }: PredictionHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...history].reverse(); // Most recent first
  const displayed = showAll ? sorted : sorted.slice(0, 8);

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4"
      >
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
          <History className="w-3.5 h-3.5" />
          Prediction History
        </h3>
        <div className="flex items-center justify-center py-6 text-[11px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5 mr-2" />
          Play the simulation to build prediction history
        </div>
      </motion.div>
    );
  }

  // Risk evolution summary
  const first = history[0];
  const last = history[history.length - 1];
  const delta = last.explanation.risk_score - first.explanation.risk_score;
  const criticalCount = history.filter(h => h.explanation.status === "CRITICAL").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <History className="w-3.5 h-3.5" />
          Prediction History
        </h3>
        <Badge variant="secondary" className="text-[9px]">
          {history.length} assessments
        </Badge>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-secondary/40 rounded-lg p-2 text-center">
          <span className="text-[9px] text-muted-foreground block">Start</span>
          <span className="text-xs font-mono font-semibold" style={{ color: statusColor(first.explanation.status) }}>
            {first.explanation.risk_score}%
          </span>
        </div>
        <div className="bg-secondary/40 rounded-lg p-2 text-center">
          <span className="text-[9px] text-muted-foreground block">Current</span>
          <span className="text-xs font-mono font-semibold" style={{ color: statusColor(last.explanation.status) }}>
            {last.explanation.risk_score}%
          </span>
        </div>
        <div className="bg-secondary/40 rounded-lg p-2 text-center">
          <span className="text-[9px] text-muted-foreground block">Critical hrs</span>
          <span className="text-xs font-mono font-semibold text-[hsl(var(--risk-critical))]">
            {criticalCount}
          </span>
        </div>
      </div>

      {/* Trajectory indicator */}
      <div className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1.5">
        {delta > 5 ? (
          <>
            <TrendingUp className="w-3 h-3 text-[hsl(var(--risk-critical))]" />
            <span>Risk increased by <strong className="text-[hsl(var(--risk-critical))]">+{delta} pts</strong> since admission</span>
          </>
        ) : delta < -5 ? (
          <>
            <TrendingUp className="w-3 h-3 rotate-180 text-[hsl(var(--risk-low))]" />
            <span>Risk decreased by <strong className="text-[hsl(var(--risk-low))]">{delta} pts</strong> since admission</span>
          </>
        ) : (
          <span>Risk has remained relatively stable since admission</span>
        )}
      </div>

      {/* Log entries */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-1.5 pr-2">
          {displayed.map((entry, i) => (
            <LogEntryCard key={entry.hour} entry={entry} index={i} />
          ))}
        </div>
      </ScrollArea>

      {sorted.length > 8 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-[10px] h-7"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show recent only" : `Show all ${sorted.length} entries`}
        </Button>
      )}
    </motion.div>
  );
}
