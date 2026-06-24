// Pure verification logic. No I/O, no LLM — deterministic and unit-testable.
// The vision model READS the label; this module JUDGES it. Keeping the verdict
// in plain code makes every result explainable ("failed because not bold").
//
// Rules reference: production/docs/verification-logic.md + ttb-requirements.md

import type {
  ApplicationData,
  ExtractedLabel,
  FieldResult,
  Verdict,
  VerificationResult,
} from "./types";

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Lowercase, strip punctuation, collapse whitespace. For fuzzy text compares. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’']/g, "") // smart + straight apostrophes
    .replace(/[^a-z0-9]+/g, " ") // any other punctuation -> space
    .trim()
    .replace(/\s+/g, " ");
}

/** Levenshtein distance (iterative, O(n*m)). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Similarity ratio in [0,1]; 1 = identical after normalization. */
export function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

// ---------------------------------------------------------------------------
// Field comparators — each returns a FieldResult
// ---------------------------------------------------------------------------

/** Fuzzy text match used for brand name and class/type. */
function compareFuzzyText(
  field: string,
  label: string,
  expected: string,
  found: string | null,
): FieldResult {
  if (found == null || normalize(found) === "") {
    return {
      field,
      label,
      verdict: "NEEDS_REVIEW",
      expected,
      found,
      reason: `Could not read the ${label.toLowerCase()} on the label — request a clearer image.`,
    };
  }
  const ratio = similarity(expected, found);
  let verdict: Verdict;
  let reason: string;
  if (normalize(expected) === normalize(found) || ratio >= 0.9) {
    verdict = "PASS";
    reason =
      normalize(expected) === normalize(found)
        ? "Matches the application (ignoring case, spacing, and punctuation)."
        : "Matches the application closely enough to be the same value.";
  } else if (ratio >= 0.7) {
    verdict = "NEEDS_REVIEW";
    reason = "Close but not an exact match — a human should confirm.";
  } else {
    verdict = "FAIL";
    reason = "Does not match the application.";
  }
  return { field, label, verdict, expected, found, reason };
}

/** Extract the first ABV percentage as a number, e.g. "45% Alc./Vol." -> 45. */
export function parseAbv(s: string | null): number | null {
  if (!s) return null;
  // Prefer a number immediately followed by % ; fall back to "alc 45".
  const pct = s.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return parseFloat(pct[1]);
  const alc = s.match(/alc[^0-9]*(\d+(?:\.\d+)?)/i);
  if (alc) return parseFloat(alc[1]);
  return null;
}

function compareAbv(expected: string, found: string | null): FieldResult {
  const base = { field: "alcoholContent", label: "Alcohol content", expected, found };
  const want = parseAbv(expected);
  const got = parseAbv(found);
  if (got == null) {
    return {
      ...base,
      verdict: "NEEDS_REVIEW",
      reason: "Could not read the alcohol content on the label — request a clearer image.",
    };
  }
  if (want == null) {
    return {
      ...base,
      verdict: "NEEDS_REVIEW",
      reason: "Could not parse the alcohol content entered in the application.",
    };
  }
  if (Math.abs(want - got) < 0.05) {
    return {
      ...base,
      verdict: "PASS",
      reason: `Label shows ${got}% ABV, matching the application.`,
    };
  }
  return {
    ...base,
    verdict: "FAIL",
    reason: `Label shows ${got}% ABV but the application says ${want}%.`,
  };
}

/** Parse a net-contents string to milliliters. Supports mL, cL, L, fl oz. */
export function parseVolumeToMl(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(ml|milliliters?|millilitres?|cl|l|liters?|litres?|fl\s*oz|oz)/i);
  if (!m) return null;
  const value = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase().replace(/\s+/g, "");
  switch (true) {
    case unit.startsWith("ml") || unit.startsWith("millilit"):
      return value;
    case unit === "cl":
      return value * 10;
    case unit === "l" || unit.startsWith("lit"):
      return value * 1000;
    case unit.startsWith("floz") || unit === "oz":
      return value * 29.5735;
    default:
      return null;
  }
}

function compareNetContents(expected: string, found: string | null): FieldResult {
  const base = { field: "netContents", label: "Net contents", expected, found };
  const want = parseVolumeToMl(expected);
  const got = parseVolumeToMl(found);
  if (got == null) {
    return {
      ...base,
      verdict: "NEEDS_REVIEW",
      reason: "Could not read the net contents on the label — request a clearer image.",
    };
  }
  if (want == null) {
    return {
      ...base,
      verdict: "NEEDS_REVIEW",
      reason: "Could not parse the net contents entered in the application.",
    };
  }
  // Tolerate <0.5% rounding (e.g. 750 mL vs 75 cL vs 0.75 L).
  if (Math.abs(want - got) <= Math.max(1, want * 0.005)) {
    return {
      ...base,
      verdict: "PASS",
      reason: "Matches the application after unit conversion.",
    };
  }
  return {
    ...base,
    verdict: "FAIL",
    reason: `Label volume (~${Math.round(got)} mL) does not match the application (~${Math.round(
      want,
    )} mL).`,
  };
}

// ---------------------------------------------------------------------------
// Government Health Warning — the strict one (27 CFR 16.21)
// ---------------------------------------------------------------------------

/** Canonical clauses. Matched after normalization (whitespace/case/punct removed). */
export const WARNING_CLAUSE_1 =
  "according to the surgeon general women should not drink alcoholic beverages during pregnancy because of the risk of birth defects";
export const WARNING_CLAUSE_2 =
  "consumption of alcoholic beverages impairs your ability to drive a car or operate machinery and may cause health problems";

/** Best-overlap ratio of `needle` appearing within `haystack` (normalized). */
function clausePresence(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (h.includes(n)) return 1;
  // token-overlap fallback to distinguish "close" (OCR slip) from "absent".
  const nTokens = n.split(" ");
  const hSet = new Set(h.split(" "));
  const hit = nTokens.filter((t) => hSet.has(t)).length;
  return hit / nTokens.length;
}

export function checkWarning(w: ExtractedLabel["governmentWarning"]): FieldResult {
  const base = {
    field: "governmentWarning",
    label: "Government Health Warning",
    expected: "Exact TTB warning, “GOVERNMENT WARNING:” in bold ALL CAPS",
    found: w.text,
  };

  if (!w.legible || !w.text || normalize(w.text) === "") {
    return {
      ...base,
      verdict: "NEEDS_REVIEW",
      reason: "Warning not legible — request a clearer image.",
    };
  }

  // 1. Wording (the two required clauses).
  const c1 = clausePresence(w.text, WARNING_CLAUSE_1);
  const c2 = clausePresence(w.text, WARNING_CLAUSE_2);
  const hasPrefix = normalize(w.text).includes("government warning");

  if (c1 === 1 && c2 === 1 && hasPrefix) {
    // Wording is correct — now the visual rules.
    const reasons: string[] = [];
    if (w.isAllCaps === false) reasons.push("“GOVERNMENT WARNING” is not in all capital letters");
    if (w.isBold === false) reasons.push("“GOVERNMENT WARNING” is not bold");
    if (reasons.length > 0) {
      return {
        ...base,
        verdict: "FAIL",
        reason: `Warning text is correct, but ${reasons.join(" and ")} — both are required by TTB.`,
      };
    }
    if (w.isAllCaps == null || w.isBold == null) {
      return {
        ...base,
        verdict: "NEEDS_REVIEW",
        reason:
          "Warning text is correct, but the caps/bold styling could not be confirmed from the image — a human should verify.",
      };
    }
    return {
      ...base,
      verdict: "PASS",
      reason: "Present, correctly worded, and “GOVERNMENT WARNING:” is bold and all caps.",
    };
  }

  // Wording is off. Distinguish "close" (review) from "wrong/missing" (fail).
  if (c1 >= 0.85 && c2 >= 0.85) {
    return {
      ...base,
      verdict: "NEEDS_REVIEW",
      reason: "Warning is close to the required text but not exact — a human should verify the wording.",
    };
  }
  const missing: string[] = [];
  if (!hasPrefix) missing.push("the “GOVERNMENT WARNING:” heading");
  if (c1 < 0.85) missing.push("the Surgeon General / pregnancy clause");
  if (c2 < 0.85) missing.push("the impairment / health-problems clause");
  return {
    ...base,
    verdict: "FAIL",
    reason: `Warning is missing or incorrectly worded — ${missing.join(", ")} not found as required.`,
  };
}

// ---------------------------------------------------------------------------
// Top-level
// ---------------------------------------------------------------------------

function rollUp(fields: FieldResult[]): Verdict {
  if (fields.some((f) => f.verdict === "FAIL")) return "FAIL";
  if (fields.some((f) => f.verdict === "NEEDS_REVIEW")) return "NEEDS_REVIEW";
  return "PASS";
}

/** Compare an extracted label against the application data. Pure function. */
export function verifyLabel(
  app: ApplicationData,
  extracted: ExtractedLabel,
  elapsedMs: number,
): VerificationResult {
  const fields: FieldResult[] = [
    compareFuzzyText("brandName", "Brand name", app.brandName, extracted.brandName),
    compareFuzzyText("classType", "Class / type", app.classType, extracted.classType),
    compareAbv(app.alcoholContent, extracted.alcoholContent),
    compareNetContents(app.netContents, extracted.netContents),
    checkWarning(extracted.governmentWarning),
  ];
  return { overall: rollUp(fields), fields, elapsedMs, application: app };
}
