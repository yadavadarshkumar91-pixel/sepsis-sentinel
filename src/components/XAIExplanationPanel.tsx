import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Activity, MessageSquare, Lightbulb, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { XAIExplanation, ExplanationFactor, TrendInsight } from "@/lib/xai-engine";

// ─── Severity colors using design tokens ─────────────────────────────────────

function severityColor(severity: "critical" | "warning" | "normal" | "info"): string {
  switch (severity) {
    case "critical": return "hsl(var(--risk-critical))";
    case "warning": return "hsl(var(--risk-medium))";
    default: return "hsl(var(--risk-low))";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "CRITICAL": return "hsl(var(--risk-critical))";
    case "HIGH": return "hsl(var(--risk-high))";
    case "MODERATE": return "hsl(var(--risk-medium))";
    default: return "hsl(var(--risk-low))";
  }
}

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "rising": return <ArrowUpRight className="w-3 h-3" />;
    case "falling": return <ArrowDownRight className="w-3 h-3" />;
    case "volatile": return <Activity className="w-3 h-3" />;
    default: return <Minus className="w-3 h-3" />;
  }
}

// ─── Factor Bar ──────────────────────────────────────────────────────────────

function FactorRow({ factor, index }: { factor: ExplanationFactor; index: number }) {
  const barColor = factor.severity === "critical"
    ? "hsl(var(--risk-critical))"
    : factor.severity === "warning"
      ? "hsl(var(--risk-medium))"
      : "hsl(var(--risk-low))";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="space-y-1"
    >
      <div className="flex items-center gap-2">
        {factor.direction !== "normal" && (
          <AlertTriangle
            className="w-3 h-3 shrink-0"
            style={{ color: barColor }}
          />
        )}
        {factor.direction === "normal" && (
          <CheckCircle2
            className="w-3 h-3 shrink-0 text-[hsl(var(--risk-low))]"
          />
        )}
        <span className="text-xs text-foreground font-medium flex-1 truncate">
          {factor.vital}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {factor.value}
        </span>
        <span
          className="text-[10px] font-mono font-semibold w-10 text-right"
          style={{ color: barColor }}
        >
          {(factor.contribution * 100).toFixed(0)}%
        </span>
      </div>

      {/* Contribution bar */}
      <div className="flex items-center gap-2 pl-5">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, factor.contribution * 100)}%` }}
            transition={{ duration: 0.5, delay: index * 0.06 }}
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Clinical text */}
      {factor.direction !== "normal" && (
        <p className="text-[10px] pl-5 leading-relaxed" style={{ color: barColor }}>
          {factor.clinical_text}
        </p>
      )}
    </motion.div>
  );
}

// ─── Trend Row ───────────────────────────────────────────────────────────────

function TrendRow({ insight, index }: { insight: TrendInsight; index: number }) {
  const color = severityColor(insight.severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      className="flex items-start gap-2 py-1.5"
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}20` }}
      >
        <TrendIcon trend={insight.trend} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{insight.vital}</span>
          <Badge
            className="text-[8px] px-1 py-0 border-0 uppercase"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {insight.trend}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
          {insight.description}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

interface XAIExplanationPanelProps {
  explanation: XAIExplanation;
  compact?: boolean;
}

export function XAIExplanationPanel({ explanation, compact = false }: XAIExplanationPanelProps) {
  const { risk_score, status, explanation: factors, clinical_narrative, trend_insights, recommended_actions } = explanation;
  const color = statusColor(status);
  const abnormalFactors = factors.filter(f => f.direction !== "normal");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Clinical Narrative */}
      <div className="glass-card p-4">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
          <MessageSquare className="w-3 h-3" />
          Clinical Assessment
        </h3>
        <div
          className="rounded-lg p-3 text-xs leading-relaxed"
          style={{ backgroundColor: `${color}08`, borderLeft: `3px solid ${color}` }}
        >
          <p className="text-foreground/90">{clinical_narrative}</p>
        </div>
      </div>

      {/* SHAP Contributions */}
      <div className="glass-card p-4">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Brain className="w-3 h-3" />
          Why This Risk Score — Feature Contributions
        </h3>
        <div className="space-y-3">
          {factors
            .filter(f => f.contribution > 0.01 || f.direction !== "normal")
            .slice(0, compact ? 5 : 7)
            .map((factor, i) => (
              <FactorRow key={factor.vital} factor={factor} index={i} />
            ))}
        </div>

        {abnormalFactors.length === 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-[hsl(var(--risk-low))]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All vitals within normal ranges
          </div>
        )}
      </div>

      {/* Trend Insights */}
      {trend_insights.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            Trend Analysis
          </h3>
          <div className="space-y-1">
            {trend_insights.slice(0, compact ? 3 : 5).map((insight, i) => (
              <TrendRow key={insight.vital} insight={insight} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {!compact && (
        <div className="glass-card p-4">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
            <Lightbulb className="w-3 h-3" />
            Recommended Actions
          </h3>
          <ul className="space-y-1.5">
            {recommended_actions.map((action, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex gap-2 text-xs text-foreground/80"
              >
                <span
                  className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {action}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

/** Compact inline version for the dashboard sidebar / bottom row */
export function XAICompactCard({ explanation }: { explanation: XAIExplanation }) {
  const { status, explanation: factors, clinical_narrative, trend_insights } = explanation;
  const color = statusColor(status);
  const abnormal = factors.filter(f => f.direction !== "normal").slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4 space-y-3"
    >
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <Brain className="w-3.5 h-3.5" />
        AI Explanation
      </h3>

      {/* Narrative */}
      <div
        className="rounded-lg p-2.5 text-[11px] leading-relaxed"
        style={{ backgroundColor: `${color}08`, borderLeft: `3px solid ${color}` }}
      >
        {clinical_narrative}
      </div>

      {/* Top factors */}
      {abnormal.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Key Drivers</span>
          {abnormal.map((f, i) => (
            <div key={f.vital} className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: severityColor(f.severity) }} />
              <span className="text-[11px] text-foreground flex-1">{f.clinical_text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trends */}
      {trend_insights.filter(t => t.severity !== "info").length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Trends</span>
          {trend_insights
            .filter(t => t.severity !== "info")
            .slice(0, 2)
            .map((t, i) => (
              <div key={t.vital} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <TrendIcon trend={t.trend} />
                {t.description}
              </div>
            ))}
        </div>
      )}
    </motion.div>
  );
}
