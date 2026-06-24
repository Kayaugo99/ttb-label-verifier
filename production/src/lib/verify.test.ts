import { describe, it, expect } from "vitest";
import {
  normalize,
  similarity,
  parseAbv,
  parseVolumeToMl,
  checkWarning,
  verifyLabel,
  WARNING_CLAUSE_1,
  WARNING_CLAUSE_2,
} from "./verify";
import type { ApplicationData, ExtractedLabel } from "./types";

const CANONICAL_WARNING =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

describe("text normalization & similarity", () => {
  it("treats case/punctuation/spacing as equal", () => {
    expect(normalize("STONE'S THROW")).toBe(normalize("Stone's Throw"));
  });
  it("similarity is 1 for the Dave example", () => {
    expect(similarity("STONE'S THROW", "Stone's Throw")).toBe(1);
  });
  it("similarity is low for different names", () => {
    expect(similarity("Old Tom Distillery", "Blue Ridge Vineyards")).toBeLessThan(0.5);
  });
});

describe("parseAbv", () => {
  it("reads various formats", () => {
    expect(parseAbv("45% Alc./Vol. (90 Proof)")).toBe(45);
    expect(parseAbv("45% ABV")).toBe(45);
    expect(parseAbv("ALC 45% BY VOL")).toBe(45);
    expect(parseAbv("13.5% alc/vol")).toBe(13.5);
  });
  it("returns null when absent", () => {
    expect(parseAbv("no numbers here")).toBeNull();
    expect(parseAbv(null)).toBeNull();
  });
});

describe("parseVolumeToMl", () => {
  it("normalizes units to mL", () => {
    expect(parseVolumeToMl("750 mL")).toBe(750);
    expect(parseVolumeToMl("75 cL")).toBe(750);
    expect(parseVolumeToMl("0.75 L")).toBe(750);
  });
});

function warning(over: Partial<ExtractedLabel["governmentWarning"]> = {}) {
  return checkWarning({
    present: true,
    headingAsPrinted: "GOVERNMENT WARNING:",
    fullText: CANONICAL_WARNING,
    isBold: true,
    legible: true,
    ...over,
  });
}

describe("government warning (the strict one)", () => {
  it("PASS when present, worded right, bold + all caps", () => {
    expect(warning().verdict).toBe("PASS");
  });
  it("FAIL when the heading is title case (not all caps)", () => {
    const r = warning({ headingAsPrinted: "Government Warning:" });
    expect(r.verdict).toBe("FAIL");
    expect(r.reason).toMatch(/capital/i);
  });
  it("FAIL when not bold", () => {
    const r = warning({ isBold: false });
    expect(r.verdict).toBe("FAIL");
    expect(r.reason).toMatch(/bold/i);
  });
  it("FAIL when the warning is absent entirely", () => {
    const r = warning({ present: false, headingAsPrinted: null, fullText: null });
    expect(r.verdict).toBe("FAIL");
    expect(r.reason).toMatch(/mandatory|no government warning/i);
  });
  it("FAIL when a required clause is missing", () => {
    const r = warning({
      fullText:
        "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink during pregnancy.",
    });
    expect(r.verdict).toBe("FAIL");
  });
  it("FAIL when the heading is missing but body present", () => {
    const r = warning({ headingAsPrinted: null });
    expect(r.verdict).toBe("FAIL");
    expect(r.reason).toMatch(/heading is missing/i);
  });
  it("NEEDS_REVIEW when present but illegible", () => {
    expect(warning({ legible: false, fullText: null }).verdict).toBe("NEEDS_REVIEW");
  });
  it("NEEDS_REVIEW when bold unknown but wording + caps correct", () => {
    expect(warning({ isBold: null }).verdict).toBe("NEEDS_REVIEW");
  });
  it("canonical clauses are substrings of the normalized warning", () => {
    expect(normalize(CANONICAL_WARNING)).toContain(WARNING_CLAUSE_1);
    expect(normalize(CANONICAL_WARNING)).toContain(WARNING_CLAUSE_2);
  });
});

describe("verifyLabel end-to-end (pure)", () => {
  const app: ApplicationData = {
    brandName: "Old Tom Distillery",
    classType: "Kentucky Straight Bourbon Whiskey",
    alcoholContent: "45% Alc./Vol. (90 Proof)",
    netContents: "750 mL",
  };
  const goodLabel: ExtractedLabel = {
    brandName: "OLD TOM DISTILLERY",
    classType: "Kentucky Straight Bourbon Whiskey",
    alcoholContent: "45% ALC./VOL.",
    netContents: "75 cL",
    producerNameAddress: "Old Tom Distillery, Bardstown, KY",
    governmentWarning: {
      present: true,
      headingAsPrinted: "GOVERNMENT WARNING:",
      fullText: CANONICAL_WARNING,
      isBold: true,
      legible: true,
    },
    readabilityNotes: null,
  };

  it("PASS overall when every field matches (fuzzy/numeric/volume)", () => {
    const r = verifyLabel(app, goodLabel, 1234);
    expect(r.overall).toBe("PASS");
    expect(r.elapsedMs).toBe(1234);
  });

  it("FAIL overall when ABV mismatches", () => {
    const r = verifyLabel(app, { ...goodLabel, alcoholContent: "40% ALC./VOL." }, 0);
    expect(r.overall).toBe("FAIL");
    expect(r.fields.find((f) => f.field === "alcoholContent")?.verdict).toBe("FAIL");
  });

  it("FAIL overall when brand is clearly different", () => {
    const r = verifyLabel(app, { ...goodLabel, brandName: "Blue Ridge Vineyards" }, 0);
    expect(r.overall).toBe("FAIL");
  });

  it("NEEDS_REVIEW overall when a field is unreadable but nothing fails", () => {
    const r = verifyLabel(app, { ...goodLabel, netContents: null }, 0);
    expect(r.overall).toBe("NEEDS_REVIEW");
  });
});
