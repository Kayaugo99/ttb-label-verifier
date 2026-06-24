// Single-label result: a big obvious overall banner + a per-field breakdown.

import type { VerificationResult } from "@/lib/types";
import { VerdictBadge, verdictStyle } from "./Verdict";

const OVERALL_HEADLINE = {
  PASS: "This label matches the application.",
  FAIL: "This label does not match — see the issues below.",
  NEEDS_REVIEW: "A person should review this label.",
} as const;

export function ResultCard({ result }: { result: VerificationResult }) {
  const s = verdictStyle(result.overall);

  return (
    <section aria-label="Verification result" className="space-y-4">
      <div className={`rounded-xl bg-white p-5 shadow-sm ring-2 ${s.ring}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <VerdictBadge verdict={result.overall} large />
            <p className={`text-lg font-semibold ${s.text}`}>
              {OVERALL_HEADLINE[result.overall]}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Checked in {(result.elapsedMs / 1000).toFixed(1)}s
          </p>
        </div>

        {result.error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{result.error}</p>
        )}
      </div>

      {result.fields.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          {result.fields.map((f) => (
            <li key={f.field} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{f.label}</h3>
                  <VerdictBadge verdict={f.verdict} />
                </div>
                <p className="mt-1 text-sm text-slate-600">{f.reason}</p>
                <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-500">Application:</dt>
                    <dd className="text-slate-800">{f.expected ?? "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-500">On label:</dt>
                    <dd className="text-slate-800">{f.found ?? "Not found"}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
