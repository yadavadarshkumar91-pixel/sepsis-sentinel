import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, ShieldAlert, Siren } from "lucide-react";
import { getRiskLevel } from "@/lib/patient-data";

interface AlertBannerProps {
  score: number;
  patientName: string;
}

export function AlertBanner({ score, patientName }: AlertBannerProps) {
  const risk = getRiskLevel(score);
  const percentage = Math.round(score * 100);

  const config = score >= 0.7
    ? { icon: Siren, text: "CRITICAL — Immediate clinical review required", glowClass: "glow-danger" }
    : score >= 0.5
    ? { icon: ShieldAlert, text: "HIGH RISK — Escalate monitoring protocol", glowClass: "glow-danger" }
    : score >= 0.3
    ? { icon: AlertTriangle, text: "ELEVATED — Continue close observation", glowClass: "" }
    : { icon: Shield, text: "STABLE — Vitals within normal range", glowClass: "glow-primary" };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={risk.label}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className={`rounded-xl px-5 py-3 flex items-center gap-4 border ${config.glowClass}`}
        style={{
          backgroundColor: `${risk.color}10`,
          borderColor: `${risk.color}30`,
        }}
      >
        <config.icon className="w-5 h-5 shrink-0" style={{ color: risk.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: risk.color }}>
              {risk.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {patientName} — Risk: {percentage}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{config.text}</p>
        </div>
        {score >= 0.5 && (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: risk.color }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: risk.color }}
            />
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
