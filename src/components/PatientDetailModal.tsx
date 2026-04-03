import { motion, AnimatePresence } from "framer-motion";
import {
  X, Download, User, Heart, Thermometer, Wind, Activity,
  Pill, Stethoscope, FileText, Clock, AlertTriangle, Droplets, Syringe,
  ClipboardList, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Patient, ClinicalEvent } from "@/lib/patient-data";
import { getRiskLevel } from "@/lib/patient-data";
import { downloadReport } from "@/lib/generate-report";

interface PatientDetailModalProps {
  patient: Patient;
  currentHour: number;
  open: boolean;
  onClose: () => void;
}

function EventIcon({ type }: { type: ClinicalEvent["type"] }) {
  const cls = "w-3.5 h-3.5";
  switch (type) {
    case "diagnosis": return <Stethoscope className={cls} />;
    case "medication": return <Pill className={cls} />;
    case "procedure": return <Syringe className={cls} />;
    case "lab": return <Droplets className={cls} />;
    case "note": return <FileText className={cls} />;
  }
}

function eventColor(type: ClinicalEvent["type"]) {
  switch (type) {
    case "diagnosis": return "hsl(var(--risk-critical))";
    case "medication": return "hsl(var(--primary))";
    case "procedure": return "hsl(var(--risk-high))";
    case "lab": return "hsl(var(--vital-spo2))";
    case "note": return "hsl(var(--muted-foreground))";
  }
}

export function PatientDetailModal({ patient, currentHour, open, onClose }: PatientDetailModalProps) {
  const reading = patient.readings[currentHour];
  const risk = getRiskLevel(reading.riskScore);
  const riskPct = Math.round(reading.riskScore * 100);
  const visibleEvents = patient.clinicalEvents.filter(e => e.hour <= currentHour + 1);
  const activeTreatments = patient.treatments.filter(t => t.startHour <= currentHour + 1);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex flex-col glass-card border border-border/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{patient.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {patient.age}y {patient.gender} • {patient.bed} • Admitted {patient.admitTime}
                  </p>
                </div>
                <Badge
                  className="ml-2 text-[10px] font-bold border-0"
                  style={{ backgroundColor: `${risk.color}20`, color: risk.color }}
                >
                  {risk.label} — {riskPct}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => downloadReport(patient, currentHour)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Report
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-3 w-fit bg-secondary/40">
                <TabsTrigger value="overview" className="text-xs gap-1.5">
                  <ClipboardList className="w-3 h-3" /> Overview
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs gap-1.5">
                  <Clock className="w-3 h-3" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="treatments" className="text-xs gap-1.5">
                  <Pill className="w-3 h-3" /> Treatments
                </TabsTrigger>
                <TabsTrigger value="vitals" className="text-xs gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Vital Trends
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                {/* Overview Tab */}
                <TabsContent value="overview" className="h-full mt-0 p-6 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Demographics card */}
                    <div className="glass-card p-4 col-span-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                        Demographics
                      </h4>
                      <div className="space-y-2 text-sm">
                        {[
                          ["Age", `${patient.age} years`],
                          ["Gender", patient.gender],
                          ["Weight", `${patient.weight} kg`],
                          ["Height", `${patient.height} cm`],
                          ["Blood Type", patient.bloodType],
                          ["BMI", (patient.weight / ((patient.height / 100) ** 2)).toFixed(1)],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium text-foreground">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinical info card */}
                    <div className="glass-card p-4 col-span-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                        Clinical Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase">Admit Diagnosis</span>
                          <p className="text-sm font-medium text-foreground mt-0.5">{patient.admitDiagnosis}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase">Comorbidities</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {patient.comorbidities.map(c => (
                              <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase">Allergies</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {patient.allergies.map(a => (
                              <Badge
                                key={a}
                                variant="outline"
                                className="text-[10px]"
                                style={a !== "NKDA" ? { borderColor: "hsl(var(--risk-critical))", color: "hsl(var(--risk-critical))" } : {}}
                              >
                                {a !== "NKDA" && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
                                {a}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real-time vitals card */}
                    <div className="glass-card p-4 col-span-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                        Current Vitals — Hour {currentHour + 1}
                      </h4>
                      <div className="space-y-2.5">
                        {[
                          { icon: Heart, label: "Heart Rate", value: `${reading.HR} bpm`, color: "var(--vital-hr)" },
                          { icon: Thermometer, label: "Temperature", value: `${reading.Temp} °C`, color: "var(--vital-temp)" },
                          { icon: Activity, label: "SpO₂", value: `${reading.O2Sat}%`, color: "var(--vital-spo2)" },
                          { icon: TrendingUp, label: "Blood Pressure", value: `${reading.SBP}/${reading.DBP}`, color: "var(--vital-bp)" },
                          { icon: Wind, label: "Resp Rate", value: `${reading.Resp} /min`, color: "var(--vital-resp)" },
                        ].map(v => (
                          <div key={v.label} className="flex items-center gap-3 bg-secondary/30 rounded-lg px-3 py-2">
                            <v.icon className="w-3.5 h-3.5 shrink-0" style={{ color: `hsl(${v.color})` }} />
                            <span className="text-xs text-muted-foreground flex-1">{v.label}</span>
                            <span className="text-sm font-mono font-semibold text-foreground">{v.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="h-full mt-0 overflow-hidden">
                  <ScrollArea className="h-full px-6 py-4">
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
                      <div className="space-y-4">
                        {visibleEvents.map((event, i) => (
                          <motion.div
                            key={`${event.hour}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-4 pl-1"
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                              style={{ backgroundColor: `${eventColor(event.type)}20` }}
                            >
                              <EventIcon type={event.type} />
                            </div>
                            <div className="flex-1 glass-card p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                  Hr {event.hour}
                                </Badge>
                                <Badge
                                  className="text-[9px] px-1.5 py-0 border-0"
                                  style={{ backgroundColor: `${eventColor(event.type)}20`, color: eventColor(event.type) }}
                                >
                                  {event.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground">{event.description}</p>
                              {event.value && (
                                <p className="text-xs text-muted-foreground mt-1">{event.value}</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Treatments Tab */}
                <TabsContent value="treatments" className="h-full mt-0 p-6 overflow-y-auto">
                  <div className="space-y-3">
                    {activeTreatments.map((t, i) => (
                      <motion.div
                        key={`${t.name}-${i}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-4 rounded-lg flex items-center gap-4"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Pill className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{t.name}</span>
                            <Badge
                              variant="outline"
                              className="text-[9px]"
                              style={
                                t.status === "active"
                                  ? { borderColor: "hsl(var(--risk-low))", color: "hsl(var(--risk-low))" }
                                  : t.status === "discontinued"
                                  ? { borderColor: "hsl(var(--risk-critical))", color: "hsl(var(--risk-critical))" }
                                  : {}
                              }
                            >
                              {t.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.dosage} • {t.route} • {t.frequency}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-muted-foreground">Started</span>
                          <p className="text-xs font-mono text-foreground">Hour {t.startHour}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* Vital Trends Tab */}
                <TabsContent value="vitals" className="h-full mt-0 p-6 overflow-y-auto">
                  <div className="glass-card p-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                      Hourly Vital Sign Log (up to current hour)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left py-2 px-2 text-muted-foreground font-medium">Hour</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">HR</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">Temp</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">SpO₂</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">SBP/DBP</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">Resp</th>
                            <th className="text-right py-2 px-2 text-muted-foreground font-medium">Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.readings.slice(0, currentHour + 1).map((r, i) => {
                            const rowRisk = getRiskLevel(r.riskScore);
                            return (
                              <tr
                                key={i}
                                className={`border-b border-border/10 ${i === currentHour ? "bg-primary/5" : ""}`}
                              >
                                <td className="py-1.5 px-2 font-mono">{r.hour}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{r.HR}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{r.Temp}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{r.O2Sat}%</td>
                                <td className="py-1.5 px-2 text-right font-mono">{r.SBP}/{r.DBP}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{r.Resp}</td>
                                <td className="py-1.5 px-2 text-right">
                                  <span
                                    className="font-mono font-semibold"
                                    style={{ color: rowRisk.color }}
                                  >
                                    {Math.round(r.riskScore * 100)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
