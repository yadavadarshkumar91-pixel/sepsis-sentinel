import { useMemo } from "react";
import { motion } from "framer-motion";
import { getRiskLevel } from "@/lib/patient-data";

interface RiskGaugeProps {
  score: number;
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const risk = getRiskLevel(score);
  const percentage = Math.round(score * 100);

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score * 0.75 * circumference);

  const gradientId = useMemo(() => `gauge-gradient-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="glass-card p-5 flex flex-col items-center">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Sepsis Risk Score
      </h3>

      <div className="relative w-44 h-44">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-[135deg]">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--risk-low))" />
              <stop offset="40%" stopColor="hsl(var(--risk-medium))" />
              <stop offset="70%" stopColor="hsl(var(--risk-high))" />
              <stop offset="100%" stopColor="hsl(var(--risk-critical))" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="8"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />

          {/* Active arc */}
          <motion.circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={percentage}
            initial={{ scale: 1.15, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-mono font-bold"
            style={{ color: risk.color }}
          >
            {percentage}%
          </motion.span>
          <span
            className="text-[11px] font-semibold tracking-wider mt-1"
            style={{ color: risk.color }}
          >
            {risk.label}
          </span>
        </div>
      </div>

      {/* Risk bar */}
      <div className="w-full mt-4">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
          <span>Critical</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(var(--risk-low)), hsl(var(--risk-medium)), hsl(var(--risk-high)), hsl(var(--risk-critical)))`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
