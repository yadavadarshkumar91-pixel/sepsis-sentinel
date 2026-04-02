import { motion } from "framer-motion";
import { Activity, Thermometer, Wind, Heart, Droplets } from "lucide-react";
import { getRiskLevel } from "@/lib/patient-data";
import type { VitalReading } from "@/lib/patient-data";

interface VitalCardProps {
  reading: VitalReading;
}

const vitals = [
  { key: "HR" as const, label: "Heart Rate", unit: "bpm", icon: Heart, colorClass: "text-vital-hr", normal: [60, 100] },
  { key: "Temp" as const, label: "Temperature", unit: "°C", icon: Thermometer, colorClass: "text-vital-temp", normal: [36.5, 37.5] },
  { key: "O2Sat" as const, label: "SpO₂", unit: "%", icon: Droplets, colorClass: "text-vital-spo2", normal: [94, 100] },
  { key: "SBP" as const, label: "Blood Pressure", unit: "mmHg", icon: Activity, colorClass: "text-vital-bp", normal: [90, 140] },
  { key: "Resp" as const, label: "Resp Rate", unit: "/min", icon: Wind, colorClass: "text-vital-resp", normal: [12, 20] },
];

export function VitalCards({ reading }: VitalCardProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {vitals.map((v, i) => {
        const value = reading[v.key];
        const isAbnormal = value < v.normal[0] || value > v.normal[1];

        return (
          <motion.div
            key={v.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-3 ${isAbnormal ? "border-destructive/40 glow-danger" : "border-border/30"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{v.label}</span>
              <v.icon className={`w-3.5 h-3.5 ${v.colorClass}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={`text-xl font-mono font-semibold ${isAbnormal ? "text-destructive" : v.colorClass}`}
              >
                {v.key === "Temp" ? value.toFixed(1) : Math.round(value)}
              </motion.span>
              <span className="text-[10px] text-muted-foreground">{v.unit}</span>
            </div>
            {v.key === "SBP" && (
              <span className="text-[10px] text-muted-foreground font-mono">
                /{Math.round(reading.DBP)}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

interface RiskBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export function RiskBadge({ score, size = "sm" }: RiskBadgeProps) {
  const risk = getRiskLevel(score);
  return (
    <span
      className={`vital-badge ${size === "lg" ? "text-sm px-3 py-1.5" : ""}`}
      style={{ backgroundColor: `${risk.color}20`, color: risk.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: risk.color }}
      />
      {risk.label}
    </span>
  );
}
