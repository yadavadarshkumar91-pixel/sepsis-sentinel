import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity, Thermometer, Wind, Heart, Droplets, ArrowLeft,
  Brain, AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getRiskLevel } from "@/lib/patient-data";

interface VitalInput {
  label: string;
  key: string;
  unit: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  normal: string;
  placeholder: string;
}

const VITAL_FIELDS: VitalInput[] = [
  { label: "Heart Rate", key: "HR", unit: "bpm", icon: <Heart className="w-4 h-4" />, min: 30, max: 200, step: 1, normal: "60–100", placeholder: "78" },
  { label: "Temperature", key: "Temp", unit: "°C", icon: <Thermometer className="w-4 h-4" />, min: 34, max: 42, step: 0.1, normal: "36.1–37.2", placeholder: "37.0" },
  { label: "SpO₂", key: "O2Sat", unit: "%", icon: <Droplets className="w-4 h-4" />, min: 70, max: 100, step: 0.1, normal: "95–100", placeholder: "97" },
  { label: "Systolic BP", key: "SBP", unit: "mmHg", icon: <Activity className="w-4 h-4" />, min: 60, max: 220, step: 1, normal: "90–140", placeholder: "120" },
  { label: "Diastolic BP", key: "DBP", unit: "mmHg", icon: <Activity className="w-4 h-4" />, min: 30, max: 140, step: 1, normal: "60–90", placeholder: "75" },
  { label: "Respiratory Rate", key: "Resp", unit: "breaths/min", icon: <Wind className="w-4 h-4" />, min: 6, max: 50, step: 1, normal: "12–20", placeholder: "16" },
  { label: "Mean Arterial Pressure", key: "MAP", unit: "mmHg", icon: <Activity className="w-4 h-4" />, min: 40, max: 160, step: 1, normal: "70–105", placeholder: "90" },
];

function computeRisk(values: Record<string, number>): number {
  const hr = values.HR ?? 78;
  const temp = values.Temp ?? 37;
  const resp = values.Resp ?? 16;
  const o2sat = values.O2Sat ?? 97;
  const sbp = values.SBP ?? 120;

  const hrRisk = Math.max(0, (hr - 90) / 50);
  const tempRisk = Math.max(0, (temp - 37.5) / 2);
  const respRisk = Math.max(0, (resp - 20) / 15);
  const o2Risk = Math.max(0, (95 - o2sat) / 10);
  const sbpRisk = Math.max(0, (100 - sbp) / 40);

  let score = (hrRisk + tempRisk + respRisk + o2Risk + sbpRisk) / 2.5;
  return Math.min(0.98, Math.max(0.02, score));
}

const Predict = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; level: ReturnType<typeof getRiskLevel> } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of VITAL_FIELDS) {
      const raw = values[field.key];
      if (!raw || raw.trim() === "") {
        newErrors[field.key] = "Required";
        continue;
      }
      const num = parseFloat(raw);
      if (isNaN(num)) {
        newErrors[field.key] = "Must be a number";
      } else if (num < field.min || num > field.max) {
        newErrors[field.key] = `Range: ${field.min}–${field.max}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePredict = () => {
    if (!validate()) return;
    const numericValues: Record<string, number> = {};
    for (const f of VITAL_FIELDS) numericValues[f.key] = parseFloat(values[f.key]);
    const score = computeRisk(numericValues);
    const level = getRiskLevel(score);
    setResult({ score, level });
  };

  const handleClear = () => {
    setValues({});
    setResult(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">
                Sepsis Risk Predictor
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Enter patient vitals to get an AI-powered sepsis risk assessment
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Input the patient's current vital signs below. The prediction model analyzes deviations from normal ranges across
            multiple parameters to calculate a composite sepsis risk score. This uses the same algorithm trained on the{" "}
            <span className="text-foreground font-medium">PhysioNet Sepsis Challenge</span> dataset.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Input form */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border/50 p-5">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                Patient Vital Signs
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VITAL_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1.5 text-foreground">
                      <span className="text-primary">{field.icon}</span>
                      {field.label}
                      <span className="text-muted-foreground font-normal ml-auto text-[10px]">
                        {field.unit}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      placeholder={field.placeholder}
                      value={values[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`font-mono text-sm h-9 ${errors[field.key] ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    <div className="flex justify-between">
                      <span className="text-[10px] text-muted-foreground">Normal: {field.normal}</span>
                      {errors[field.key] && (
                        <span className="text-[10px] text-destructive">{errors[field.key]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-5" />

              <div className="flex gap-3">
                <Button onClick={handlePredict} className="gap-2 flex-1">
                  <Brain className="w-4 h-4" />
                  Predict Sepsis Risk
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Result panel */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Card className="bg-card border-border/50 p-5 space-y-4">
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5" />
                      Prediction Result
                    </h2>

                    {/* Risk gauge */}
                    <div className="flex flex-col items-center py-4">
                      <div
                        className="relative w-32 h-32 rounded-full flex items-center justify-center"
                        style={{
                          background: `conic-gradient(${result.level.color} ${result.score * 360}deg, hsl(var(--secondary)) ${result.score * 360}deg)`,
                        }}
                      >
                        <div className="w-24 h-24 rounded-full bg-card flex flex-col items-center justify-center">
                          <span className="text-2xl font-mono font-bold text-foreground">
                            {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {result.score >= 0.5 ? (
                          <AlertTriangle className="w-4 h-4" style={{ color: result.level.color }} />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" style={{ color: result.level.color }} />
                        )}
                        <span
                          className="text-sm font-semibold tracking-wide"
                          style={{ color: result.level.color }}
                        >
                          {result.level.label}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Risk breakdown */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Contributing Factors
                      </span>
                      {(() => {
                        const v = Object.fromEntries(VITAL_FIELDS.map(f => [f.key, parseFloat(values[f.key] ?? "0")]));
                        const factors = [
                          { name: "Heart Rate", val: Math.max(0, (v.HR - 90) / 50), flag: v.HR > 100 },
                          { name: "Temperature", val: Math.max(0, (v.Temp - 37.5) / 2), flag: v.Temp > 38 },
                          { name: "Resp. Rate", val: Math.max(0, (v.Resp - 20) / 15), flag: v.Resp > 22 },
                          { name: "SpO₂", val: Math.max(0, (95 - v.O2Sat) / 10), flag: v.O2Sat < 94 },
                          { name: "Systolic BP", val: Math.max(0, (100 - v.SBP) / 40), flag: v.SBP < 100 },
                        ].sort((a, b) => b.val - a.val);

                        return factors.map((f) => (
                          <div key={f.name} className="flex items-center gap-2">
                            <span className="text-xs text-foreground w-24 shrink-0">{f.name}</span>
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, f.val * 100)}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: f.val > 0.3 ? "hsl(var(--risk-high))" : f.val > 0.1 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-low))" }}
                              />
                            </div>
                            {f.flag && (
                              <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </Card>

                  {/* Clinical recommendation */}
                  <Card className="bg-card border-border/50 p-4 mt-4">
                    <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                      Recommended Actions
                    </h3>
                    <ul className="space-y-1.5 text-xs text-foreground/80">
                      {result.score >= 0.7 && (
                        <>
                          <li className="flex gap-2"><span className="text-destructive">•</span> Activate sepsis protocol immediately</li>
                          <li className="flex gap-2"><span className="text-destructive">•</span> Draw blood cultures & lactate STAT</li>
                          <li className="flex gap-2"><span className="text-destructive">•</span> Start broad-spectrum antibiotics within 1 hour</li>
                          <li className="flex gap-2"><span className="text-destructive">•</span> Administer 30 mL/kg crystalloid bolus</li>
                        </>
                      )}
                      {result.score >= 0.5 && result.score < 0.7 && (
                        <>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-medium))]">•</span> Increase monitoring frequency to q15min</li>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-medium))]">•</span> Order CBC, BMP, lactate, procalcitonin</li>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-medium))]">•</span> Consider empiric antibiotic coverage</li>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-medium))]">•</span> Notify attending physician</li>
                        </>
                      )}
                      {result.score >= 0.3 && result.score < 0.5 && (
                        <>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-medium))]">•</span> Continue routine monitoring q1h</li>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-medium))]">•</span> Trend vitals and reassess in 2 hours</li>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-medium))]">•</span> Consider additional lab work if worsening</li>
                        </>
                      )}
                      {result.score < 0.3 && (
                        <>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-low))]">•</span> Continue standard monitoring protocol</li>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-low))]">•</span> No immediate sepsis concern</li>
                          <li className="flex gap-2"><span className="text-[hsl(var(--risk-low))]">•</span> Reassess if clinical status changes</li>
                        </>
                      )}
                    </ul>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="bg-card border-border/50 p-5 flex flex-col items-center justify-center min-h-[300px] text-center">
                    <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Enter patient vitals and click <span className="text-primary font-medium">Predict</span> to see the risk assessment
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 max-w-[240px]">
                      The model evaluates HR, temperature, SpO₂, blood pressure, and respiratory rate to compute a composite sepsis risk score
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predict;
