"use client";

import { useMemo, useState } from "react";
import type { VerificationResult } from "@/lib/types";
import { verifyOne, runPool } from "@/lib/client";
import { parseManifest, resultsToCsv, MANIFEST_TEMPLATE, type BatchRow } from "@/lib/csv";
import { VerdictBadge } from "./Verdict";

type RowState = {
  row: BatchRow;
  file: File | null;
  status: "pending" | "running" | "done" | "error";
  result?: VerificationResult;
  error?: string;
};

const CONCURRENCY = 6;

export function BatchVerify() {
  const [rows, setRows] = useState<RowState[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [files, setFiles] = useState<Map<string, File>>(new Map());
  const [busy, setBusy] = useState(false);

  function onManifest(file: File) {
    file.text().then((text) => {
      const { rows: parsed, errors } = parseManifest(text);
      setParseErrors(errors);
      setRows(
        parsed.map((row) => ({
          row,
          file: files.get(row.filename.toLowerCase()) ?? null,
          status: "pending",
        })),
      );
    });
  }

  function onImages(fileList: FileList) {
    const map = new Map(files);
    Array.from(fileList).forEach((f) => map.set(f.name.toLowerCase(), f));
    setFiles(map);
    setRows((rs) =>
      rs.map((r) => ({ ...r, file: r.file ?? map.get(r.row.filename.toLowerCase()) ?? null })),
    );
  }

  async function runBatch() {
    setBusy(true);
    const runnable = rows.filter((r) => r.file);
    setRows((rs) => rs.map((r) => (r.file ? { ...r, status: "running" } : r)));
    await runPool(
      runnable,
      async (r) => {
        try {
          const result = await verifyOne(r.row, r.file!);
          return { ok: true as const, result };
        } catch (e) {
          return { ok: false as const, error: e instanceof Error ? e.message : "Error" };
        }
      },
      CONCURRENCY,
      (i, out) => {
        const target = runnable[i];
        setRows((rs) =>
          rs.map((r) =>
            r === target || r.row.filename === target.row.filename
              ? out.ok
                ? { ...r, status: "done", result: out.result }
                : { ...r, status: "error", error: out.error }
              : r,
          ),
        );
      },
    );
    setBusy(false);
  }

  const summary = useMemo(() => {
    const s = { PASS: 0, FAIL: 0, NEEDS_REVIEW: 0, missing: 0 };
    rows.forEach((r) => {
      if (!r.file) s.missing++;
      else if (r.result) s[r.result.overall]++;
    });
    return s;
  }, [rows]);

  const matched = rows.filter((r) => r.file).length;
  const completed = rows.filter((r) => r.status === "done" || r.status === "error").length;

  function exportCsv() {
    const records = rows
      .filter((r) => r.result)
      .map((r) => ({
        filename: r.row.filename,
        overall: r.result!.overall,
        elapsedMs: r.result!.elapsedMs,
        details: r.result!.fields
          .filter((f) => f.verdict !== "PASS")
          .map((f) => `${f.label}: ${f.verdict}`)
          .join("; "),
      }));
    download("verification-results.csv", resultsToCsv(records), "text/csv");
  }

  return (
    <div className="space-y-6">
      <ol className="grid gap-4 sm:grid-cols-3">
        <Step n={1} title="Upload a manifest CSV">
          <p className="mb-2 text-sm text-slate-600">
            One row per label: filename, brand, class/type, alcohol content, net contents.
          </p>
          <button
            type="button"
            onClick={() => download("manifest-template.csv", MANIFEST_TEMPLATE, "text/csv")}
            className="text-sm font-medium text-blue-700 underline"
          >
            Download template
          </button>
          <UploadButton label="Choose CSV" accept=".csv,text/csv" onFiles={(fl) => onManifest(fl[0])} />
        </Step>
        <Step n={2} title="Upload the label images">
          <p className="mb-2 text-sm text-slate-600">
            Select all photos. They’re matched to rows by filename.
          </p>
          <UploadButton label="Choose images" accept="image/*" multiple onFiles={onImages} />
        </Step>
        <Step n={3} title="Run the batch">
          <p className="mb-2 text-sm text-slate-600">
            {matched} of {rows.length || 0} rows have a matching image.
          </p>
          <button
            type="button"
            onClick={runBatch}
            disabled={busy || matched === 0}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            {busy ? `Checking ${completed}/${matched}…` : `Verify ${matched} labels`}
          </button>
        </Step>
      </ol>

      {parseErrors.length > 0 && (
        <ul className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {parseErrors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Count label="Pass" n={summary.PASS} cls="bg-green-100 text-green-900" />
            <Count label="Fail" n={summary.FAIL} cls="bg-red-100 text-red-900" />
            <Count label="Needs review" n={summary.NEEDS_REVIEW} cls="bg-amber-100 text-amber-900" />
            {summary.missing > 0 && (
              <Count label="No image" n={summary.missing} cls="bg-slate-200 text-slate-700" />
            )}
            <div className="ml-auto">
              <button
                type="button"
                onClick={exportCsv}
                disabled={completed === 0}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Export results CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">File</th>
                  <th className="px-4 py-2 font-medium">Brand</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">{r.row.filename}</td>
                    <td className="px-4 py-2 text-slate-800">{r.row.brandName}</td>
                    <td className="px-4 py-2">
                      {!r.file ? (
                        <span className="text-slate-400">No image</span>
                      ) : r.status === "running" ? (
                        <span className="animate-pulse text-slate-500">Checking…</span>
                      ) : r.status === "error" ? (
                        <span className="text-red-700">Error</span>
                      ) : r.result ? (
                        <VerdictBadge verdict={r.result.overall} />
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {r.error
                        ? r.error
                        : r.result?.fields
                            .filter((f) => f.verdict !== "PASS")
                            .map((f) => f.label)
                            .join(", ") || (r.result ? "—" : "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {n}
        </span>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </li>
  );
}

function Count({ label, n, cls }: { label: string; n: number; cls: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>
      {label}: {n}
    </span>
  );
}

function UploadButton({
  label,
  accept,
  multiple,
  onFiles,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
}) {
  return (
    <label className="mt-3 inline-block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100">
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => e.target.files && e.target.files.length > 0 && onFiles(e.target.files)}
      />
    </label>
  );
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
