import { motion } from "framer-motion";
import { User, Bed, Clock, Calendar, FlaskConical } from "lucide-react";
import { RiskBadge } from "./VitalCards";
import type { Patient } from "@/lib/patient-data";

interface PatientSidebarProps {
  patients: Patient[];
  selectedId: number;
  currentHours: Record<number, number>;
  onSelect: (id: number) => void;
}

export function PatientSidebar({ patients, selectedId, currentHours, onSelect }: PatientSidebarProps) {
  return (
    <div className="glass-card p-3 h-full overflow-y-auto">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-2 mb-3">
        ICU Patients
      </h3>
      <div className="mb-3 px-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium">
          <FlaskConical className="w-3 h-3" />
          Real case data patient highlighted below
        </span>
      </div>
      <div className="space-y-1.5">
        {patients.map((patient) => {
          const hour = currentHours[patient.id] ?? 0;
          const reading = patient.readings[hour];
          const isSelected = patient.id === selectedId;

          return (
            <motion.button
              key={patient.id}
              onClick={() => onSelect(patient.id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                isSelected
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-secondary/60 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{patient.name}</span>
                </div>
                <RiskBadge score={reading?.riskScore ?? 0} />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Bed className="w-3 h-3" />
                  {patient.bed}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {patient.age}y {patient.gender[0]}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Hr {hour + 1}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
