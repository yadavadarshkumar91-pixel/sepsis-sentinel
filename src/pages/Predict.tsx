import { useState, useMemo } from "react";
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
import { explainPrediction } from "@/lib/xai-engine";
import { XAIExplanationPanel } from "@/components/XAIExplanationPanel";

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

const Predict = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof explainPrediction> | null>(null);
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
    const explanation = explainPrediction(numericValues);
    setResult(explanation);
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
                Sepsis Risk Predictor — Explainable AI
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Enter patient vitals to get an AI-powered sepsis risk assessment with clinical explanations
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            This module uses <span className="text-foreground font-medium">Explainable AI (XAI)</span> to provide 
            transparent clinical reasoning alongside risk predictions. Each assessment includes SHAP-based feature contributions, 
            trend analysis, and plain-language explanations written for clinicians — not data scientists.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
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
                  Predict & Explain
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Result panel — now XAI-powered */}
          <div>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-4"
                >
                  {/* Risk Score Header */}
                  <Card className="bg-card border-border/50 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5" />
                        XAI Prediction
                      </h2>
                      <div className="flex items-center gap-1">
                        {result.status === "CRITICAL" || result.status === "HIGH" ? (
                          <AlertTriangle className="w-4 h-4" style={{ color: result.status === "CRITICAL" ? "hsl(var(--risk-critical))" : "hsl(var(--risk-high))" }} />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" style={{ color: result.status === "MODERATE" ? "hsl(var(--risk-medium))" : "hsl(var(--risk-low))" }} />
                        )}
                        <span
                          className="text-sm font-bold tracking-wide"
                          style={{
                            color: result.status === "CRITICAL" ? "hsl(var(--risk-critical))"
                              : result.status === "HIGH" ? "hsl(var(--risk-high))"
                                : result.status === "MODERATE" ? "hsl(var(--risk-medium))"
                                  : "hsl(var(--risk-low))"
                          }}
                        >
                          {result.status}
                        </span>
                      </div>
                    </div>

                    {/* Circular gauge */}
                    <div className="flex justify-center py-2">
                      <div
                        className="relative w-28 h-28 rounded-full flex items-center justify-center"
                        style={{
                          background: `conic-gradient(${
                            result.status === "CRITICAL" ? "hsl(var(--risk-critical))"
                              : result.status === "HIGH" ? "hsl(var(--risk-high))"
                                : result.status === "MODERATE" ? "hsl(var(--risk-medium))"
                                  : "hsl(var(--risk-low))"
                          } ${result.risk_score * 3.6}deg, hsl(var(--secondary)) ${result.risk_score * 3.6}deg)`,
                        }}
                      >
                        <div className="w-20 h-20 rounded-full bg-card flex flex-col items-center justify-center">
                          <span className="text-xl font-mono font-bold text-foreground">
                            {result.risk_score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Full XAI Explanation */}
                  <XAIExplanationPanel explanation={result} />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="bg-card border-border/50 p-5 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <Brain className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Enter patient vitals and click <span className="text-primary font-medium">Predict & Explain</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 max-w-[260px]">
                      The XAI module will show you exactly <em>why</em> the patient is at risk, 
                      with SHAP-based feature contributions and clinical narratives
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
