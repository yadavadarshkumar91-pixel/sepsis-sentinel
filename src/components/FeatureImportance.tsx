import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { FEATURE_IMPORTANCE } from "@/lib/patient-data";

export function FeatureImportance() {
  const data = [...FEATURE_IMPORTANCE].reverse();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4"
    >
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        SHAP Feature Importance
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => [value.toFixed(3), "Importance"]}
          />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={`hsl(173 ${60 + index * 3}% ${35 + index * 2}%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
