// Tiny CSV reader/writer for the batch flow. Maps each row to a filename +
// application data. Header names are matched flexibly so agents don't have to
// remember exact casing.

import type { ApplicationData } from "./types";

export interface BatchRow extends ApplicationData {
  filename: string;
}

/** Parse a CSV string into records (handles quoted fields with commas). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  return rows;
}

const ALIASES: Record<keyof BatchRow, string[]> = {
  filename: ["filename", "file", "image", "imagename", "file name"],
  brandName: ["brandname", "brand", "brand name"],
  classType: ["classtype", "class", "type", "class/type", "class type", "classtypedesignation"],
  alcoholContent: ["alcoholcontent", "alcohol", "abv", "alc", "alcohol content"],
  netContents: ["netcontents", "net", "netcontent", "volume", "net contents", "contents"],
};

function headerIndex(headers: string[]): Record<keyof BatchRow, number> {
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const idx = {} as Record<keyof BatchRow, number>;
  (Object.keys(ALIASES) as (keyof BatchRow)[]).forEach((key) => {
    idx[key] = norm.findIndex((h) =>
      ALIASES[key].some((a) => h === a.replace(/[^a-z]/g, "")),
    );
  });
  return idx;
}

export interface ParsedBatch {
  rows: BatchRow[];
  errors: string[];
}

/** Parse a manifest CSV into rows. Returns parse errors for missing columns. */
export function parseManifest(text: string): ParsedBatch {
  const grid = parseCsv(text);
  if (grid.length < 2) {
    return { rows: [], errors: ["CSV needs a header row and at least one data row."] };
  }
  const idx = headerIndex(grid[0]);
  const missing = (Object.keys(idx) as (keyof BatchRow)[]).filter((k) => idx[k] < 0);
  if (missing.length) {
    return { rows: [], errors: [`CSV is missing column(s): ${missing.join(", ")}.`] };
  }
  const rows: BatchRow[] = [];
  const errors: string[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const row: BatchRow = {
      filename: (cells[idx.filename] ?? "").trim(),
      brandName: (cells[idx.brandName] ?? "").trim(),
      classType: (cells[idx.classType] ?? "").trim(),
      alcoholContent: (cells[idx.alcoholContent] ?? "").trim(),
      netContents: (cells[idx.netContents] ?? "").trim(),
    };
    if (!row.filename) {
      errors.push(`Row ${r + 1}: missing filename.`);
      continue;
    }
    rows.push(row);
  }
  return { rows, errors };
}

function esc(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Build a results CSV for export. */
export function resultsToCsv(
  records: { filename: string; overall: string; details: string; elapsedMs: number }[],
): string {
  const head = ["filename", "overall", "elapsed_seconds", "details"];
  const lines = records.map((r) =>
    [r.filename, r.overall, (r.elapsedMs / 1000).toFixed(1), r.details].map(esc).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

/** The downloadable template shown to users. */
export const MANIFEST_TEMPLATE =
  "filename,brandName,classType,alcoholContent,netContents\n" +
  "old-tom.jpg,Old Tom Distillery,Kentucky Straight Bourbon Whiskey,45% Alc./Vol. (90 Proof),750 mL\n";
