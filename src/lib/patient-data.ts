/**
 * Synthetic patient data generator for sepsis prediction dashboard.
 * Mimics PhysioNet Sepsis Challenge dataset format.
 */

export interface VitalReading {
  hour: number;
  HR: number;
  O2Sat: number;
  Temp: number;
  SBP: number;
  DBP: number;
  MAP: number;
  Resp: number;
  riskScore: number;
  sepsisLabel: boolean;
}

export interface ClinicalEvent {
  hour: number;
  type: "diagnosis" | "medication" | "procedure" | "lab" | "note";
  description: string;
  value?: string;
}

export interface Treatment {
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  startHour: number;
  status: "active" | "completed" | "discontinued";
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  admitTime: string;
  bed: string;
  weight: number;
  height: number;
  bloodType: string;
  admitDiagnosis: string;
  comorbidities: string[];
  allergies: string[];
  readings: VitalReading[];
  clinicalEvents: ClinicalEvent[];
  treatments: Treatment[];
}

const PATIENT_NAMES = [
  "James Wilson", "Maria Santos", "Robert Chen", "Emily Parker",
  "David Kim", "Sarah Johnson", "Michael Brown", "Lisa Wang",
  "Thomas Anderson", "Jennifer Lee"
];

const BEDS = ["ICU-1A", "ICU-1B", "ICU-2A", "ICU-2B", "ICU-3A",
              "ICU-3B", "ICU-4A", "ICU-4B", "ICU-5A", "ICU-5B"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function gaussianRandom(rng: () => number, mean: number, std: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

export function generatePatient(id: number, hours: number = 48): Patient {
  const rng = seededRandom(id * 1337 + 42);
  const isSepsisPatient = rng() < 0.4; // 40% for demo visibility
  const sepsisOnset = isSepsisPatient ? Math.floor(rng() * 18) + 24 : null;
  const age = Math.floor(rng() * 50) + 30;

  const readings: VitalReading[] = [];

  for (let hour = 0; hour < hours; hour++) {
    let hr = gaussianRandom(rng, 78, 10);
    let o2sat = Math.min(100, gaussianRandom(rng, 97, 1.5));
    let temp = gaussianRandom(rng, 37.0, 0.4);
    let sbp = gaussianRandom(rng, 120, 12);
    let dbp = gaussianRandom(rng, 72, 8);
    let resp = gaussianRandom(rng, 16, 2.5);

    // Deteriorate vitals approaching sepsis
    if (isSepsisPatient && sepsisOnset !== null && hour >= sepsisOnset - 12) {
      const severity = Math.min((hour - (sepsisOnset - 12)) / 12, 1.0);
      hr += severity * 30;
      temp += severity * 1.8;
      resp += severity * 10;
      sbp -= severity * 25;
      o2sat -= severity * 7;
    }

    const map = dbp + (sbp - dbp) / 3;

    // Compute risk score based on vital deviations
    const hrRisk = Math.max(0, (hr - 90) / 50);
    const tempRisk = Math.max(0, (temp - 37.5) / 2);
    const respRisk = Math.max(0, (resp - 20) / 15);
    const o2Risk = Math.max(0, (95 - o2sat) / 10);
    const sbpRisk = Math.max(0, (100 - sbp) / 40);
    let riskScore = Math.min(1, (hrRisk + tempRisk + respRisk + o2Risk + sbpRisk) / 2.5);
    riskScore = Math.max(0.02, riskScore + gaussianRandom(rng, 0, 0.03));
    riskScore = Math.min(0.98, riskScore);

    readings.push({
      hour: hour + 1,
      HR: Math.round(hr * 10) / 10,
      O2Sat: Math.round(Math.max(80, o2sat) * 10) / 10,
      Temp: Math.round(temp * 100) / 100,
      SBP: Math.round(sbp * 10) / 10,
      DBP: Math.round(dbp * 10) / 10,
      MAP: Math.round(map * 10) / 10,
      Resp: Math.round(resp * 10) / 10,
      riskScore: Math.round(riskScore * 10000) / 10000,
      sepsisLabel: isSepsisPatient && sepsisOnset !== null && hour >= sepsisOnset,
    });
  }

  return {
    id,
    name: PATIENT_NAMES[id % PATIENT_NAMES.length],
    age,
    gender: rng() > 0.5 ? "Male" : "Female",
    admitTime: `${Math.floor(rng() * 12) + 1}:${String(Math.floor(rng() * 60)).padStart(2, '0')} ${rng() > 0.5 ? 'AM' : 'PM'}`,
    bed: BEDS[id % BEDS.length],
    readings,
  };
}

export function generateAllPatients(count: number = 8): Patient[] {
  return Array.from({ length: count }, (_, i) => generatePatient(i));
}

export function getRiskLevel(score: number): { label: string; color: string; bgClass: string } {
  if (score >= 0.7) return { label: "CRITICAL", color: "hsl(var(--risk-critical))", bgClass: "bg-risk-critical" };
  if (score >= 0.5) return { label: "HIGH RISK", color: "hsl(var(--risk-high))", bgClass: "bg-risk-high" };
  if (score >= 0.3) return { label: "MODERATE", color: "hsl(var(--risk-medium))", bgClass: "bg-risk-medium" };
  return { label: "STABLE", color: "hsl(var(--risk-low))", bgClass: "bg-risk-low" };
}

export const FEATURE_IMPORTANCE = [
  { feature: "Temperature (6h trend)", importance: 0.182 },
  { feature: "Heart Rate (6h mean)", importance: 0.156 },
  { feature: "Respiratory Rate", importance: 0.134 },
  { feature: "SpO₂ Level", importance: 0.121 },
  { feature: "MAP", importance: 0.098 },
  { feature: "Systolic BP", importance: 0.087 },
  { feature: "WBC Count", importance: 0.065 },
  { feature: "Lactate", importance: 0.058 },
  { feature: "ICU Length of Stay", importance: 0.052 },
  { feature: "Age", importance: 0.047 },
];
