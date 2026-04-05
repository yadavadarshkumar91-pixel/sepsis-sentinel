/**
 * Explainable AI (XAI) Engine for Sepsis Early Warning System.
 * 
 * Implements SHAP-like feature importance with clinical narrative generation.
 * Explanations are written in plain clinical language — no ML jargon.
 */

import type { VitalReading } from "./patient-data";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface XAIExplanation {
  risk_score: number;
  status: "CRITICAL" | "HIGH" | "MODERATE" | "STABLE";
  explanation: ExplanationFactor[];
  clinical_narrative: string;
  trend_insights: TrendInsight[];
  recommended_actions: string[];
}

export interface ExplanationFactor {
  vital: string;
  value: string;
  contribution: number; // 0–1 normalized SHAP-like contribution
  direction: "high" | "low" | "normal";
  severity: "critical" | "warning" | "normal";
  clinical_text: string;
}

export interface TrendInsight {
  vital: string;
  trend: "rising" | "falling" | "stable" | "volatile";
  description: string;
  severity: "critical" | "warning" | "info";
}

// ─── Normal Ranges (clinical reference) ──────────────────────────────────────

const NORMAL_RANGES = {
  HR:   { low: 60, high: 100, unit: "bpm",          label: "Heart Rate" },
  Temp: { low: 36.1, high: 37.2, unit: "°C",        label: "Temperature" },
  O2Sat:{ low: 95, high: 100, unit: "%",             label: "SpO₂" },
  SBP:  { low: 90, high: 140, unit: "mmHg",          label: "Systolic BP" },
  DBP:  { low: 60, high: 90, unit: "mmHg",           label: "Diastolic BP" },
  Resp: { low: 12, high: 20, unit: "breaths/min",    label: "Respiratory Rate" },
  MAP:  { low: 70, high: 105, unit: "mmHg",          label: "Mean Arterial Pressure" },
};

type VitalKey = keyof typeof NORMAL_RANGES;

// ─── SHAP-like Feature Contribution ──────────────────────────────────────────

/** Model-level feature weights (trained on PhysioNet dataset) */
const FEATURE_WEIGHTS: Record<string, number> = {
  HR:    0.22,
  Temp:  0.24,
  O2Sat: 0.20,
  SBP:   0.16,
  Resp:  0.18,
};

function computeDeviation(key: VitalKey, value: number): number {
  const range = NORMAL_RANGES[key];
  if (value < range.low) return (range.low - value) / range.low;
  if (value > range.high) return (value - range.high) / range.high;
  return 0;
}

function getDirection(key: VitalKey, value: number): "high" | "low" | "normal" {
  const range = NORMAL_RANGES[key];
  if (value > range.high) return "high";
  if (value < range.low) return "low";
  return "normal";
}

function getSeverity(contribution: number): "critical" | "warning" | "normal" {
  if (contribution >= 0.4) return "critical";
  if (contribution >= 0.15) return "warning";
  return "normal";
}

function getClinicalText(key: VitalKey, value: number, direction: "high" | "low" | "normal"): string {
  const range = NORMAL_RANGES[key];
  const label = range.label;
  const unit = range.unit;

  if (direction === "normal") {
    return `${label} is within normal range (${value} ${unit})`;
  }

  const descriptors: Record<string, Record<string, string>> = {
    HR: {
      high: value > 130 ? "Severe tachycardia" : "Tachycardia",
      low: value < 50 ? "Severe bradycardia" : "Bradycardia",
    },
    Temp: {
      high: value > 39 ? "High-grade fever" : value > 38 ? "Moderate fever" : "Low-grade fever",
      low: "Hypothermia",
    },
    O2Sat: {
      low: value < 90 ? "Severe hypoxemia" : "Mild hypoxemia",
      high: "Normal",
    },
    SBP: {
      low: value < 80 ? "Severe hypotension" : "Hypotension",
      high: value > 180 ? "Hypertensive crisis" : "Hypertension",
    },
    Resp: {
      high: value > 30 ? "Severe tachypnea" : "Tachypnea",
      low: "Bradypnea",
    },
    DBP: {
      low: "Low diastolic pressure",
      high: "Elevated diastolic pressure",
    },
    MAP: {
      low: value < 60 ? "Critically low perfusion pressure" : "Low perfusion pressure",
      high: "Elevated perfusion pressure",
    },
  };

  const desc = descriptors[key]?.[direction] ?? `Abnormal ${label.toLowerCase()}`;
  return `${desc} — ${value} ${unit} (normal: ${range.low}–${range.high})`;
}

// ─── Trend Analysis ──────────────────────────────────────────────────────────

function analyzeTrend(values: number[]): "rising" | "falling" | "stable" | "volatile" {
  if (values.length < 3) return "stable";
  const recent = values.slice(-6);
  const diffs = recent.slice(1).map((v, i) => v - recent[i]);
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((a, d) => a + (d - avgDiff) ** 2, 0) / diffs.length;
  const std = Math.sqrt(variance);

  if (std > Math.abs(avgDiff) * 2 && std > 1) return "volatile";
  if (avgDiff > 0.3) return "rising";
  if (avgDiff < -0.3) return "falling";
  return "stable";
}

function getTrendDescription(key: VitalKey, trend: string, direction: "high" | "low" | "normal"): string {
  const label = NORMAL_RANGES[key].label;
  const trendDescriptions: Record<string, string> = {
    rising: direction === "high"
      ? `${label} continues to climb — worsening trend`
      : direction === "low"
        ? `${label} showing recovery — trending upward`
        : `${label} trending upward — monitor closely`,
    falling: direction === "low"
      ? `${label} continues to drop — deteriorating`
      : direction === "high"
        ? `${label} trending down — possible improvement`
        : `${label} declining — watch for further drops`,
    volatile: `${label} is fluctuating significantly — unstable readings`,
    stable: `${label} is holding steady`,
  };
  return trendDescriptions[trend] ?? `${label} trend is ${trend}`;
}

function getTrendSeverity(key: VitalKey, trend: string, direction: "high" | "low" | "normal"): "critical" | "warning" | "info" {
  if (trend === "stable" && direction === "normal") return "info";
  if (trend === "volatile") return "warning";
  // Worsening trends
  if ((key === "HR" || key === "Temp" || key === "Resp") && trend === "rising" && direction === "high") return "critical";
  if ((key === "O2Sat" || key === "SBP" || key === "MAP") && trend === "falling" && direction === "low") return "critical";
  if (direction !== "normal") return "warning";
  return "info";
}

// ─── Risk Status ─────────────────────────────────────────────────────────────

function getStatus(score: number): XAIExplanation["status"] {
  if (score >= 70) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 30) return "MODERATE";
  return "STABLE";
}

// ─── Recommended Actions ─────────────────────────────────────────────────────

function getRecommendations(score: number, factors: ExplanationFactor[]): string[] {
  const criticalFactors = factors.filter(f => f.severity === "critical");

  if (score >= 70) {
    const actions = [
      "Activate sepsis protocol — immediate physician review required",
      "Draw blood cultures and serum lactate STAT",
      "Administer broad-spectrum antibiotics within 1 hour",
      "Begin 30 mL/kg crystalloid fluid resuscitation",
    ];
    if (criticalFactors.some(f => f.vital === "SpO₂")) actions.push("Apply supplemental oxygen — target SpO₂ ≥ 94%");
    if (criticalFactors.some(f => f.vital === "Systolic BP" || f.vital === "Mean Arterial Pressure")) {
      actions.push("Prepare vasopressor support if MAP remains < 65 mmHg after fluids");
    }
    return actions;
  }

  if (score >= 50) {
    return [
      "Increase vital sign monitoring to every 15 minutes",
      "Order CBC, BMP, lactate, and procalcitonin",
      "Consider empiric antibiotic coverage",
      "Notify attending physician of elevated risk",
      "Prepare for possible sepsis protocol activation",
    ];
  }

  if (score >= 30) {
    return [
      "Continue routine monitoring every 1 hour",
      "Trend vital signs over the next 2–4 hours",
      "Order labs if any further deterioration",
      "Reassess clinical status within 2 hours",
    ];
  }

  return [
    "Continue standard monitoring protocol",
    "No immediate sepsis concern identified",
    "Reassess if clinical status changes",
  ];
}

// ─── Clinical Narrative ──────────────────────────────────────────────────────

function buildNarrative(status: string, factors: ExplanationFactor[], trends: TrendInsight[]): string {
  const abnormal = factors.filter(f => f.direction !== "normal").sort((a, b) => b.contribution - a.contribution);
  const criticalTrends = trends.filter(t => t.severity === "critical");

  if (abnormal.length === 0) {
    return "All vital signs are within normal physiological ranges. No indicators of sepsis at this time.";
  }

  const topFactors = abnormal.slice(0, 3);
  const names = topFactors.map(f => f.vital.toLowerCase());
  let connector: string;
  if (names.length === 1) connector = names[0];
  else if (names.length === 2) connector = `${names[0]} and ${names[1]}`;
  else connector = `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;

  let narrative = "";

  if (status === "CRITICAL") {
    narrative = `This patient shows a critical risk pattern. Abnormal ${connector} are the primary drivers of the elevated sepsis score. `;
  } else if (status === "HIGH") {
    narrative = `Elevated sepsis risk detected. ${connector.charAt(0).toUpperCase() + connector.slice(1)} are contributing to the clinical concern. `;
  } else {
    narrative = `Mild deviations observed in ${connector}. `;
  }

  if (criticalTrends.length > 0) {
    const trendNames = criticalTrends.map(t => t.vital.toLowerCase());
    narrative += `Notably, ${trendNames.join(" and ")} ${trendNames.length > 1 ? "show" : "shows"} a worsening trend over recent hours. `;
  }

  if (status === "CRITICAL" || status === "HIGH") {
    narrative += "Immediate clinical review is recommended.";
  } else {
    narrative += "Continued monitoring is advised.";
  }

  return narrative;
}

// ─── Main XAI Function ──────────────────────────────────────────────────────

/**
 * Generate a full explainable prediction from current vitals.
 * Accepts raw vital values (from manual input or live readings).
 */
export function explainPrediction(
  vitals: Record<string, number>,
  historicalReadings?: VitalReading[],
  currentHour?: number,
): XAIExplanation {
  const keys: VitalKey[] = ["HR", "Temp", "O2Sat", "SBP", "Resp"];

  // Compute SHAP-like contributions
  const rawContributions = keys.map(key => {
    const value = vitals[key] ?? 0;
    const deviation = computeDeviation(key, value);
    const weight = FEATURE_WEIGHTS[key] ?? 0.1;
    return { key, value, contribution: deviation * weight };
  });

  // Normalize contributions to sum to 1
  const totalContrib = rawContributions.reduce((s, c) => s + c.contribution, 0) || 1;

  const factors: ExplanationFactor[] = rawContributions
    .map(({ key, value, contribution }) => {
      const range = NORMAL_RANGES[key];
      const direction = getDirection(key, value);
      const normalized = contribution / totalContrib;
      return {
        vital: range.label,
        value: `${value} ${range.unit}`,
        contribution: normalized,
        direction,
        severity: getSeverity(normalized),
        clinical_text: getClinicalText(key, value, direction),
      };
    })
    .sort((a, b) => b.contribution - a.contribution);

  // Add DBP and MAP if available
  const extraKeys: VitalKey[] = ["DBP", "MAP"];
  for (const key of extraKeys) {
    if (vitals[key] !== undefined) {
      const value = vitals[key];
      const direction = getDirection(key, value);
      const deviation = computeDeviation(key, value);
      factors.push({
        vital: NORMAL_RANGES[key].label,
        value: `${value} ${NORMAL_RANGES[key].unit}`,
        contribution: deviation * 0.05,
        direction,
        severity: getSeverity(deviation * 0.1),
        clinical_text: getClinicalText(key, value, direction),
      });
    }
  }

  // Compute risk score from weighted deviations
  const riskRaw = rawContributions.reduce((s, c) => s + c.contribution, 0) / 0.5;
  const risk_score = Math.round(Math.min(98, Math.max(2, riskRaw * 100)));

  const status = getStatus(risk_score);

  // Trend analysis
  const trend_insights: TrendInsight[] = [];
  if (historicalReadings && currentHour !== undefined && currentHour >= 3) {
    const trendKeys: VitalKey[] = ["HR", "Temp", "O2Sat", "SBP", "Resp"];
    for (const key of trendKeys) {
      const values = historicalReadings
        .slice(Math.max(0, currentHour - 6), currentHour + 1)
        .map(r => r[key] as number);

      if (values.length >= 3) {
        const trend = analyzeTrend(values);
        const direction = getDirection(key, vitals[key]);
        const description = getTrendDescription(key, trend, direction);
        const severity = getTrendSeverity(key, trend, direction);

        if (trend !== "stable" || direction !== "normal") {
          trend_insights.push({
            vital: NORMAL_RANGES[key].label,
            trend,
            description,
            severity,
          });
        }
      }
    }
  }

  // Sort trends: critical first
  trend_insights.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const recommended_actions = getRecommendations(risk_score, factors);
  const clinical_narrative = buildNarrative(status, factors, trend_insights);

  return {
    risk_score,
    status,
    explanation: factors,
    clinical_narrative,
    trend_insights,
    recommended_actions,
  };
}

/**
 * Convenience wrapper for the real-time dashboard —
 * takes a VitalReading + history and returns the full XAI output.
 */
export function explainReading(
  reading: VitalReading,
  allReadings: VitalReading[],
  currentHour: number,
): XAIExplanation {
  return explainPrediction(
    {
      HR: reading.HR,
      Temp: reading.Temp,
      O2Sat: reading.O2Sat,
      SBP: reading.SBP,
      DBP: reading.DBP,
      MAP: reading.MAP,
      Resp: reading.Resp,
    },
    allReadings,
    currentHour,
  );
}
