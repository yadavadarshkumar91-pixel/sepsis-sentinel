import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from "recharts";
import { motion } from "framer-motion";
import type { VitalReading } from "@/lib/patient-data";

interface VitalsChartProps {
  readings: VitalReading[];
  currentHour: number;
}

export function VitalsChart({ readings, currentHour }: VitalsChartProps) {
  const data = readings.slice(0, currentHour + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4"
    >
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Live Vital Signs Monitor
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
          <XAxis
            dataKey="hour"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
          />
          <Line type="monotone" dataKey="HR" stroke="hsl(var(--vital-hr))" strokeWidth={2} dot={false} name="Heart Rate" />
          <Line type="monotone" dataKey="O2Sat" stroke="hsl(var(--vital-spo2))" strokeWidth={2} dot={false} name="SpO₂" />
          <Line type="monotone" dataKey="Resp" stroke="hsl(var(--vital-resp))" strokeWidth={2} dot={false} name="Resp Rate" />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-2 justify-center">
        {[
          { label: "HR", color: "hsl(var(--vital-hr))" },
          { label: "SpO₂", color: "hsl(var(--vital-spo2))" },
          { label: "Resp", color: "hsl(var(--vital-resp))" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface RiskHistoryChartProps {
  readings: VitalReading[];
  currentHour: number;
}

export function RiskHistoryChart({ readings, currentHour }: RiskHistoryChartProps) {
  const data = readings.slice(0, currentHour + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4"
    >
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Risk Score History
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--risk-high))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--risk-high))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
          <XAxis
            dataKey="hour"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Risk"]}
          />
          <ReferenceLine y={0.5} stroke="hsl(var(--risk-high))" strokeDasharray="6 3" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="riskScore"
            stroke="hsl(var(--risk-high))"
            strokeWidth={2}
            fill="url(#riskGradient)"
            name="Risk Score"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
