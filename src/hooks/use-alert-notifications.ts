import { useEffect, useRef, useCallback } from "react";

const CRITICAL_THRESHOLD = 0.7;
const HIGH_THRESHOLD = 0.5;

function playAlertSound(level: "critical" | "high") {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (level === "critical") {
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.45);
  } else {
    osc.frequency.value = 600;
    gain.gain.value = 0.2;
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  osc.onended = () => ctx.close();
}

function sendBrowserNotification(patientName: string, score: number, level: string) {
  if (Notification.permission !== "granted") return;
  new Notification(`⚠️ Sepsis Alert — ${patientName}`, {
    body: `Risk: ${Math.round(score * 100)}% (${level}). Immediate review recommended.`,
    icon: "/placeholder.svg",
    tag: `sepsis-${patientName}`,
  });
}

export function useAlertNotifications(
  patientName: string,
  riskScore: number,
  enabled: boolean = true
) {
  const prevLevelRef = useRef<string | null>(null);

  const requestPermission = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!enabled) return;

    const currentLevel =
      riskScore >= CRITICAL_THRESHOLD ? "critical" : riskScore >= HIGH_THRESHOLD ? "high" : "normal";
    const prevLevel = prevLevelRef.current;

    // Only fire when crossing INTO a danger zone, not every tick
    if (currentLevel !== "normal" && prevLevel !== currentLevel) {
      playAlertSound(currentLevel as "critical" | "high");
      sendBrowserNotification(
        patientName,
        riskScore,
        currentLevel === "critical" ? "CRITICAL" : "HIGH RISK"
      );
    }

    prevLevelRef.current = currentLevel;
  }, [riskScore, patientName, enabled]);
}
