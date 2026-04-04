/**
 * Real-world clinical case study patient data.
 * Based on published sepsis case patterns from medical literature.
 * Data reflects a 72-hour ICU stay with progressive sepsis deterioration.
 *
 * Case: 58-year-old male admitted post-abdominal surgery who develops
 * hospital-acquired pneumonia progressing to septic shock.
 * Reference pattern: MIMIC-III / PhysioNet Sepsis Challenge datasets.
 */

import type { Patient, VitalReading, ClinicalEvent, Treatment } from "./patient-data";

// Hourly vital signs based on real ICU deterioration patterns
const REAL_VITALS: Omit<VitalReading, "riskScore">[] = [
  // Phase 1: Post-op stable (Hours 1–12)
  { hour: 1,  HR: 82,  O2Sat: 97, Temp: 36.8, SBP: 128, DBP: 76, MAP: 93,  Resp: 14, sepsisLabel: false },
  { hour: 2,  HR: 78,  O2Sat: 98, Temp: 36.7, SBP: 132, DBP: 78, MAP: 96,  Resp: 15, sepsisLabel: false },
  { hour: 3,  HR: 80,  O2Sat: 97, Temp: 36.9, SBP: 126, DBP: 74, MAP: 91,  Resp: 14, sepsisLabel: false },
  { hour: 4,  HR: 84,  O2Sat: 97, Temp: 37.0, SBP: 130, DBP: 76, MAP: 94,  Resp: 16, sepsisLabel: false },
  { hour: 5,  HR: 79,  O2Sat: 98, Temp: 36.8, SBP: 134, DBP: 80, MAP: 98,  Resp: 15, sepsisLabel: false },
  { hour: 6,  HR: 81,  O2Sat: 97, Temp: 37.0, SBP: 128, DBP: 74, MAP: 92,  Resp: 14, sepsisLabel: false },
  { hour: 7,  HR: 83,  O2Sat: 96, Temp: 37.1, SBP: 126, DBP: 72, MAP: 90,  Resp: 16, sepsisLabel: false },
  { hour: 8,  HR: 86,  O2Sat: 96, Temp: 37.2, SBP: 124, DBP: 72, MAP: 89,  Resp: 16, sepsisLabel: false },
  { hour: 9,  HR: 85,  O2Sat: 97, Temp: 37.1, SBP: 128, DBP: 76, MAP: 93,  Resp: 15, sepsisLabel: false },
  { hour: 10, HR: 82,  O2Sat: 97, Temp: 37.0, SBP: 130, DBP: 78, MAP: 95,  Resp: 14, sepsisLabel: false },
  { hour: 11, HR: 84,  O2Sat: 96, Temp: 37.2, SBP: 126, DBP: 74, MAP: 91,  Resp: 16, sepsisLabel: false },
  { hour: 12, HR: 88,  O2Sat: 96, Temp: 37.3, SBP: 122, DBP: 72, MAP: 89,  Resp: 17, sepsisLabel: false },

  // Phase 2: Early warning signs (Hours 13–24) — subtle deterioration
  { hour: 13, HR: 90,  O2Sat: 96, Temp: 37.4, SBP: 120, DBP: 70, MAP: 87,  Resp: 18, sepsisLabel: false },
  { hour: 14, HR: 92,  O2Sat: 95, Temp: 37.6, SBP: 118, DBP: 68, MAP: 85,  Resp: 18, sepsisLabel: false },
  { hour: 15, HR: 88,  O2Sat: 96, Temp: 37.5, SBP: 122, DBP: 72, MAP: 89,  Resp: 17, sepsisLabel: false },
  { hour: 16, HR: 94,  O2Sat: 95, Temp: 37.7, SBP: 116, DBP: 68, MAP: 84,  Resp: 19, sepsisLabel: false },
  { hour: 17, HR: 96,  O2Sat: 95, Temp: 37.8, SBP: 114, DBP: 66, MAP: 82,  Resp: 19, sepsisLabel: false },
  { hour: 18, HR: 93,  O2Sat: 95, Temp: 37.6, SBP: 118, DBP: 70, MAP: 86,  Resp: 18, sepsisLabel: false },
  { hour: 19, HR: 98,  O2Sat: 94, Temp: 37.9, SBP: 112, DBP: 64, MAP: 80,  Resp: 20, sepsisLabel: false },
  { hour: 20, HR: 100, O2Sat: 94, Temp: 38.0, SBP: 110, DBP: 64, MAP: 79,  Resp: 20, sepsisLabel: false },
  { hour: 21, HR: 96,  O2Sat: 95, Temp: 37.8, SBP: 114, DBP: 66, MAP: 82,  Resp: 19, sepsisLabel: false },
  { hour: 22, HR: 102, O2Sat: 94, Temp: 38.1, SBP: 108, DBP: 62, MAP: 77,  Resp: 21, sepsisLabel: false },
  { hour: 23, HR: 104, O2Sat: 93, Temp: 38.3, SBP: 106, DBP: 60, MAP: 75,  Resp: 22, sepsisLabel: false },
  { hour: 24, HR: 106, O2Sat: 93, Temp: 38.4, SBP: 104, DBP: 58, MAP: 73,  Resp: 22, sepsisLabel: false },

  // Phase 3: AI alert window — model predicts sepsis 6h early (Hours 25–30)
  { hour: 25, HR: 108, O2Sat: 93, Temp: 38.5, SBP: 102, DBP: 58, MAP: 73,  Resp: 23, sepsisLabel: false },
  { hour: 26, HR: 110, O2Sat: 92, Temp: 38.6, SBP: 100, DBP: 56, MAP: 71,  Resp: 24, sepsisLabel: false },
  { hour: 27, HR: 112, O2Sat: 92, Temp: 38.8, SBP: 98,  DBP: 54, MAP: 69,  Resp: 24, sepsisLabel: false },
  { hour: 28, HR: 114, O2Sat: 91, Temp: 38.9, SBP: 96,  DBP: 54, MAP: 68,  Resp: 25, sepsisLabel: false },
  { hour: 29, HR: 116, O2Sat: 91, Temp: 39.0, SBP: 94,  DBP: 52, MAP: 66,  Resp: 26, sepsisLabel: false },
  { hour: 30, HR: 118, O2Sat: 90, Temp: 39.1, SBP: 92,  DBP: 50, MAP: 64,  Resp: 26, sepsisLabel: false },

  // Phase 4: Sepsis onset — clinical criteria met (Hours 31–36)
  { hour: 31, HR: 120, O2Sat: 90, Temp: 39.2, SBP: 90,  DBP: 50, MAP: 63,  Resp: 28, sepsisLabel: true },
  { hour: 32, HR: 124, O2Sat: 89, Temp: 39.4, SBP: 86,  DBP: 48, MAP: 61,  Resp: 28, sepsisLabel: true },
  { hour: 33, HR: 126, O2Sat: 88, Temp: 39.5, SBP: 84,  DBP: 46, MAP: 59,  Resp: 30, sepsisLabel: true },
  { hour: 34, HR: 128, O2Sat: 88, Temp: 39.6, SBP: 82,  DBP: 44, MAP: 57,  Resp: 30, sepsisLabel: true },
  { hour: 35, HR: 130, O2Sat: 87, Temp: 39.7, SBP: 80,  DBP: 44, MAP: 56,  Resp: 32, sepsisLabel: true },
  { hour: 36, HR: 132, O2Sat: 86, Temp: 39.8, SBP: 78,  DBP: 42, MAP: 54,  Resp: 32, sepsisLabel: true },

  // Phase 5: Septic shock + treatment response (Hours 37–48)
  { hour: 37, HR: 134, O2Sat: 86, Temp: 39.9, SBP: 76,  DBP: 40, MAP: 52,  Resp: 34, sepsisLabel: true },
  { hour: 38, HR: 136, O2Sat: 85, Temp: 40.0, SBP: 74,  DBP: 40, MAP: 51,  Resp: 34, sepsisLabel: true },
  { hour: 39, HR: 132, O2Sat: 86, Temp: 39.8, SBP: 78,  DBP: 42, MAP: 54,  Resp: 32, sepsisLabel: true },
  { hour: 40, HR: 128, O2Sat: 87, Temp: 39.6, SBP: 82,  DBP: 46, MAP: 58,  Resp: 30, sepsisLabel: true },
  { hour: 41, HR: 124, O2Sat: 88, Temp: 39.4, SBP: 86,  DBP: 48, MAP: 61,  Resp: 28, sepsisLabel: true },
  { hour: 42, HR: 120, O2Sat: 89, Temp: 39.2, SBP: 88,  DBP: 50, MAP: 63,  Resp: 26, sepsisLabel: true },
  { hour: 43, HR: 116, O2Sat: 90, Temp: 39.0, SBP: 92,  DBP: 52, MAP: 65,  Resp: 24, sepsisLabel: true },
  { hour: 44, HR: 112, O2Sat: 91, Temp: 38.8, SBP: 96,  DBP: 56, MAP: 69,  Resp: 22, sepsisLabel: true },
  { hour: 45, HR: 108, O2Sat: 92, Temp: 38.5, SBP: 100, DBP: 58, MAP: 72,  Resp: 20, sepsisLabel: true },
  { hour: 46, HR: 104, O2Sat: 93, Temp: 38.3, SBP: 104, DBP: 62, MAP: 76,  Resp: 20, sepsisLabel: false },
  { hour: 47, HR: 100, O2Sat: 94, Temp: 38.1, SBP: 108, DBP: 64, MAP: 79,  Resp: 18, sepsisLabel: false },
  { hour: 48, HR: 96,  O2Sat: 95, Temp: 37.8, SBP: 112, DBP: 68, MAP: 83,  Resp: 18, sepsisLabel: false },
];

function computeRiskScore(v: Omit<VitalReading, "riskScore">): number {
  const hrRisk = Math.max(0, (v.HR - 90) / 50);
  const tempRisk = Math.max(0, (v.Temp - 37.5) / 2);
  const respRisk = Math.max(0, (v.Resp - 20) / 15);
  const o2Risk = Math.max(0, (95 - v.O2Sat) / 10);
  const sbpRisk = Math.max(0, (100 - v.SBP) / 40);
  const raw = Math.min(1, (hrRisk + tempRisk + respRisk + o2Risk + sbpRisk) / 2.5);
  return Math.round(Math.max(0.02, Math.min(0.98, raw)) * 10000) / 10000;
}

const readings: VitalReading[] = REAL_VITALS.map((v) => ({
  ...v,
  riskScore: computeRiskScore(v),
}));

const clinicalEvents: ClinicalEvent[] = [
  { hour: 1,  type: "diagnosis",  description: "Admitted post-op day 1, exploratory laparotomy for perforated appendix", value: "Post-surgical sepsis risk" },
  { hour: 1,  type: "lab",        description: "Admission labs — CBC", value: "WBC 12.8, Hgb 11.2, Plt 198" },
  { hour: 1,  type: "lab",        description: "BMP", value: "Na 140, K 3.8, Cr 1.1, Glucose 142" },
  { hour: 2,  type: "medication", description: "Post-op antibiotics started", value: "Ceftriaxone 2g IV q24h + Metronidazole 500mg IV q8h" },
  { hour: 4,  type: "lab",        description: "Lactate", value: "1.6 mmol/L (normal)" },
  { hour: 6,  type: "note",       description: "Nurse: Patient resting, wound dry and intact, drain output 50mL serous" },
  { hour: 8,  type: "lab",        description: "ABG", value: "pH 7.38, pCO2 40, pO2 88, HCO3 24" },
  { hour: 12, type: "lab",        description: "CBC recheck", value: "WBC 14.2 ↑, Bands 8% ↑" },
  { hour: 12, type: "note",       description: "Intern note: WBC trending up, monitoring" },
  { hour: 16, type: "lab",        description: "Procalcitonin", value: "0.8 ng/mL (borderline)" },
  { hour: 18, type: "note",       description: "RN: Patient reports feeling warm, mild rigors noted" },
  { hour: 20, type: "lab",        description: "Blood cultures × 2 drawn", value: "Pending" },
  { hour: 20, type: "lab",        description: "Lactate repeat", value: "2.4 mmol/L ↑" },
  { hour: 22, type: "lab",        description: "CBC", value: "WBC 18.6 ↑↑, Bands 15% ↑↑, Plt 156 ↓" },
  { hour: 24, type: "lab",        description: "CRP", value: "186 mg/L (HIGH)" },
  { hour: 24, type: "lab",        description: "Procalcitonin", value: "4.2 ng/mL ↑↑ (HIGH)" },
  { hour: 25, type: "note",       description: "⚠️ AI ALERT: Sepsis risk score crossing 50% — 6-hour early warning", value: "Model confidence: 87%" },
  { hour: 26, type: "medication", description: "Antibiotics broadened per AI alert", value: "Piperacillin-Tazobactam 4.5g IV q6h" },
  { hour: 27, type: "lab",        description: "Lactate", value: "3.8 mmol/L ↑↑" },
  { hour: 28, type: "procedure",  description: "Central venous catheter placed", value: "Right IJ, 7Fr triple lumen" },
  { hour: 29, type: "note",       description: "⚠️ AI ALERT: Sepsis risk critical — immediate intervention recommended", value: "Model confidence: 94%" },
  { hour: 30, type: "lab",        description: "Blood culture preliminary", value: "Gram-negative rods — E. coli" },
  { hour: 31, type: "diagnosis",  description: "Sepsis criteria met — qSOFA ≥ 2 (HR>100, RR>22, SBP<100)", value: "Sepsis-3 criteria fulfilled" },
  { hour: 31, type: "medication", description: "Sepsis bundle initiated", value: "30 mL/kg crystalloid bolus, Meropenem 1g IV q8h" },
  { hour: 32, type: "lab",        description: "Lactate", value: "5.2 mmol/L ↑↑↑" },
  { hour: 33, type: "procedure",  description: "Arterial line placed", value: "Left radial, for continuous BP monitoring" },
  { hour: 34, type: "medication", description: "Vasopressor initiated", value: "Norepinephrine 0.08 mcg/kg/min" },
  { hour: 36, type: "lab",        description: "CBC critical", value: "WBC 24.1, Plt 98 ↓↓, INR 1.6 ↑" },
  { hour: 37, type: "diagnosis",  description: "Septic shock — persistent hypotension despite fluid resuscitation", value: "MAP <65 despite 2L crystalloid" },
  { hour: 38, type: "medication", description: "Vasopressin added", value: "0.04 units/min" },
  { hour: 38, type: "medication", description: "Hydrocortisone stress dose", value: "100mg IV q8h" },
  { hour: 39, type: "note",       description: "Attending: Responding to vasopressors, urine output improving" },
  { hour: 40, type: "lab",        description: "Lactate clearance", value: "4.1 mmol/L (improving)" },
  { hour: 42, type: "lab",        description: "Blood culture final", value: "E. coli — sensitive to Meropenem ✓" },
  { hour: 42, type: "note",       description: "ID consult: Continue Meropenem, de-escalate when able" },
  { hour: 44, type: "lab",        description: "Lactate", value: "2.8 mmol/L (trending down)" },
  { hour: 44, type: "medication", description: "Norepinephrine weaning", value: "0.04 mcg/kg/min (↓ from 0.08)" },
  { hour: 46, type: "note",       description: "RN: Patient more alert, hemodynamically improving" },
  { hour: 48, type: "lab",        description: "Lactate", value: "1.9 mmol/L (near normal)" },
  { hour: 48, type: "note",       description: "Attending: Sepsis resolving. Vasopressors being weaned. AI prediction confirmed 6h early detection." },
];

const treatments: Treatment[] = [
  { name: "Ceftriaxone", dosage: "2 g", route: "IV", frequency: "Q24H", startHour: 2, status: "discontinued" },
  { name: "Metronidazole", dosage: "500 mg", route: "IV", frequency: "Q8H", startHour: 2, status: "discontinued" },
  { name: "Normal Saline 0.9%", dosage: "125 mL/hr", route: "IV", frequency: "Continuous", startHour: 1, status: "active" },
  { name: "Morphine PCA", dosage: "1 mg demand / 6 min lockout", route: "IV", frequency: "PRN", startHour: 1, status: "active" },
  { name: "Enoxaparin", dosage: "40 mg", route: "SubQ", frequency: "Daily", startHour: 3, status: "active" },
  { name: "Pantoprazole", dosage: "40 mg", route: "IV", frequency: "Daily", startHour: 1, status: "active" },
  { name: "Piperacillin-Tazobactam", dosage: "4.5 g", route: "IV", frequency: "Q6H", startHour: 26, status: "discontinued" },
  { name: "Meropenem", dosage: "1 g", route: "IV", frequency: "Q8H", startHour: 31, status: "active" },
  { name: "Norepinephrine", dosage: "0.08 mcg/kg/min", route: "IV", frequency: "Continuous", startHour: 34, status: "active" },
  { name: "Vasopressin", dosage: "0.04 units/min", route: "IV", frequency: "Continuous", startHour: 38, status: "active" },
  { name: "Hydrocortisone", dosage: "100 mg", route: "IV", frequency: "Q8H", startHour: 38, status: "active" },
  { name: "Crystalloid Bolus (LR)", dosage: "30 mL/kg", route: "IV", frequency: "Once", startHour: 31, status: "completed" },
];

export const REAL_CASE_PATIENT: Patient = {
  id: 100,
  name: "John Mitchell",
  age: 58,
  gender: "Male",
  admitTime: "2:35 AM",
  bed: "ICU-R1",
  weight: 84,
  height: 178,
  bloodType: "O+",
  admitDiagnosis: "Post-op perforated appendix — sepsis surveillance",
  comorbidities: ["Type 2 Diabetes", "Hypertension", "Obesity (BMI 26.5)"],
  allergies: ["Sulfa drugs"],
  readings,
  clinicalEvents,
  treatments,
};
