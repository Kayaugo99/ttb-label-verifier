// Verdict presentation. Conveys status with icon + text + color (never color
// alone) for colorblind safety and at-a-glance clarity.

import type { Verdict } from "@/lib/types";

const STYLE: Record<
  Verdict,
  { label: string; icon: string; chip: string; text: string; ring: string; bar: string }
> = {
  PASS: {
    label: "Pass",
    icon: "✓",
    chip: "bg-green-100 text-green-900",
    text: "text-green-900",
    ring: "ring-green-300",
    bar: "bg-green-600",
  },
  FAIL: {
    label: "Fail",
    icon: "✗",
    chip: "bg-red-100 text-red-900",
    text: "text-red-900",
    ring: "ring-red-300",
    bar: "bg-red-600",
  },
  NEEDS_REVIEW: {
    label: "Needs review",
    icon: "!",
    chip: "bg-amber-100 text-amber-900",
    text: "text-amber-900",
    ring: "ring-amber-300",
    bar: "bg-amber-500",
  },
};

export function verdictStyle(v: Verdict) {
  return STYLE[v];
}

/** Small inline pill used in tables and field rows. */
export function VerdictBadge({ verdict, large = false }: { verdict: Verdict; large?: boolean }) {
  const s = STYLE[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${s.chip} ${
        large ? "px-3.5 py-1 text-base" : "px-2.5 py-0.5 text-sm"
      }`}
    >
      <span aria-hidden className="font-bold">
        {s.icon}
      </span>
      {s.label}
    </span>
  );
}
