import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, Pause, RotateCcw, Zap, Monitor, Brain, BellRing, BellOff, FileText, Stethoscope } from "lucide-react";
import { useAlertNotifications } from "@/hooks/use-alert-notifications";
import { generateAllPatients } from "@/lib/patient-data";
import type { Patient } from "@/lib/patient-data";
import { REAL_CASE_PATIENT } from "@/lib/real-patient-data";
import { VitalCards } from "@/components/VitalCards";
import { RiskGauge } from "@/components/RiskGauge";
import { AlertBanner } from "@/components/AlertBanner";
import { VitalsChart, RiskHistoryChart } from "@/components/VitalsChart";
import { PatientSidebar } from "@/components/PatientSidebar";
import { FeatureImportance } from "@/components/FeatureImportance";
import { PatientDetailModal } from "@/components/PatientDetailModal";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const patients = [REAL_CASE_PATIENT, ...generateAllPatients(8)];

const Dashboard = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(100);
  const [currentHours, setCurrentHours] = useState<Record<number, number>>(
    Object.fromEntries(patients.map((p) => [p.id, 0]))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [patientNotes, setPatientNotes] = useState<Record<number, Array<{ text: string; author: string; timestamp: string }>>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? patients[0];
  const currentHour = currentHours[selectedPatientId] ?? 0;
  const currentReading = selectedPatient.readings[currentHour];

  useAlertNotifications(selectedPatient.name, currentReading.riskScore, alertsEnabled);

  const advanceHour = useCallback(() => {
    setCurrentHours((prev) => {
      const hour = prev[selectedPatientId] ?? 0;
      if (hour >= selectedPatient.readings.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return { ...prev, [selectedPatientId]: hour + 1 };
    });
  }, [selectedPatientId, selectedPatient.readings.length]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(advanceHour, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, advanceHour]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentHours((prev) => ({ ...prev, [selectedPatientId]: 0 }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">
                Sepsis Early Warning System
              </h1>
              <p className="text-[10px] text-muted-foreground">
                AI-powered prediction • 6–12 hour advance warning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Playback controls */}
            <div className="flex items-center gap-2 glass-card px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={handleReset}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <div className="flex items-center gap-2 ml-2">
                <Zap className="w-3 h-3 text-muted-foreground" />
                <Slider
                  value={[1200 - speed]}
                  onValueChange={([v]) => setSpeed(1200 - v)}
                  max={1100}
                  min={0}
                  step={100}
                  className="w-20"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              title={alertsEnabled ? "Mute alerts" : "Enable alerts"}
            >
              {alertsEnabled ? <BellRing className="w-3.5 h-3.5 text-primary" /> : <BellOff className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>

            <div className="text-right">
              <span className="text-xs font-mono text-muted-foreground">
                Hour {currentHour + 1} / {selectedPatient.readings.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-72 border-r border-border/50 p-3 shrink-0 overflow-hidden">
          <PatientSidebar
            patients={patients}
            selectedId={selectedPatientId}
            currentHours={currentHours}
            onSelect={(id) => {
              setSelectedPatientId(id);
              setIsPlaying(false);
            }}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <AlertBanner score={currentReading.riskScore} patientName={selectedPatient.name} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2 text-xs"
              onClick={() => setModalOpen(true)}
            >
              <FileText className="w-3.5 h-3.5" />
              Patient Details
            </Button>
          </div>

          {/* Top row: vitals + gauge */}
          <div className="grid grid-cols-[1fr_220px] gap-4">
            <VitalCards reading={currentReading} />
            <RiskGauge score={currentReading.riskScore} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-4">
            <VitalsChart readings={selectedPatient.readings} currentHour={currentHour} />
            <RiskHistoryChart readings={selectedPatient.readings} currentHour={currentHour} />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4">
            <FeatureImportance />

            {/* Model info card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4"
            >
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5" />
                Model Performance
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Accuracy", rf: "99.65%", xgb: "99.60%" },
                  { label: "Precision", rf: "94.47%", xgb: "93.10%" },
                  { label: "Recall", rf: "96.91%", xgb: "97.42%" },
                  { label: "F1 Score", rf: "95.67%", xgb: "95.21%" },
                  { label: "AUC-ROC", rf: "99.97%", xgb: "99.98%" },
                ].map((m) => (
                  <div key={m.label} className="bg-secondary/40 rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground block">{m.label}</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-mono font-semibold text-primary">{m.rf}</span>
                      <span className="text-[9px] text-muted-foreground">RF</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-mono text-foreground/70">{m.xgb}</span>
                      <span className="text-[9px] text-muted-foreground">XGB</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hour slider */}
              <div className="mt-4">
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Timeline — Hour {currentHour + 1}
                </label>
                <Slider
                  value={[currentHour]}
                  onValueChange={([v]) => {
                    setIsPlaying(false);
                    setCurrentHours((prev) => ({ ...prev, [selectedPatientId]: v }));
                  }}
                  max={selectedPatient.readings.length - 1}
                  min={0}
                  step={1}
                />
              </div>
            </motion.div>
          </div>
        </main>
      </div>
      <PatientDetailModal
        patient={selectedPatient}
        currentHour={currentHour}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        notes={patientNotes[selectedPatientId] ?? []}
        onAddNote={(note) => setPatientNotes(prev => ({
          ...prev,
          [selectedPatientId]: [...(prev[selectedPatientId] ?? []), note]
        }))}
      />
    </div>
  );
};

export default Dashboard;
