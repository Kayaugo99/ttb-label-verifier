"use client";

// Accurate single-label progress: shows the REAL current phase, the two ordered
// steps with checkmarks as they complete, and a live elapsed timer. No fake
// percentage — every piece reflects something true about the request.

import { useEffect, useRef, useState } from "react";
import type { VerifyPhase } from "@/lib/client";
import { Spinner } from "./Spinner";

const STEPS: { phase: VerifyPhase; label: string }[] = [
  { phase: "optimizing", label: "Optimizing the image" },
  { phase: "analyzing", label: "Reading the label with AI" },
];

export function AnalyzingPanel({ phase }: { phase: VerifyPhase }) {
  const [elapsed, setElapsed] = useState(0);
  // Monotonic elapsed time from mount using performance.now (accurate, no drift).
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = performance.now();
    const id = setInterval(() => {
      if (startRef.current != null) {
        setElapsed((performance.now() - startRef.current) / 1000);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  const activeIndex = STEPS.findIndex((s) => s.phase === phase);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="font-medium text-slate-800">Checking this label…</span>
        </div>
        <span className="tabular-nums text-sm text-slate-500" aria-label="time elapsed">
          {elapsed.toFixed(1)}s
        </span>
      </div>

      <ol className="mt-4 space-y-2">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={step.phase} className="flex items-center gap-2.5 text-sm">
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={done ? "text-slate-500" : active ? "font-medium text-slate-900" : "text-slate-400"}>
                {step.label}
                {active && <span className="text-slate-400">…</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {elapsed > 8 && (
        <p className="mt-3 text-xs text-slate-400">
          Taking a little longer than usual — still working, please wait.
        </p>
      )}
    </div>
  );
}
