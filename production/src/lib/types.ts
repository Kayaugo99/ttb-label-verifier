// Shared types for the label-verification pipeline.
// Keep this provider-agnostic: the vision layer fills `ExtractedLabel`,
// the pure logic in verify.ts turns it into `VerificationResult`.

/** The application data an agent is checking the label against. */
export interface ApplicationData {
  brandName: string;
  classType: string;
  alcoholContent: string; // raw as entered, e.g. "45% Alc./Vol. (90 Proof)"
  netContents: string; // raw as entered, e.g. "750 mL"
}

/** What the vision model reports it saw on the label. Nulls = couldn't read. */
export interface ExtractedLabel {
  brandName: string | null;
  classType: string | null;
  alcoholContent: string | null;
  netContents: string | null;
  producerNameAddress: string | null;
  governmentWarning: {
    /** Is any government warning visible on the label at all? */
    present: boolean;
    /**
     * The "GOVERNMENT WARNING" heading exactly as printed, with original casing
     * preserved (e.g. "GOVERNMENT WARNING:" or "Government Warning:"), or null if
     * there is no such heading. Casing is checked deterministically from this.
     */
    headingAsPrinted: string | null;
    /** Full warning text as printed (heading + body), or null if none found. */
    fullText: string | null;
    /** Is the heading bold relative to nearby text? Visual signal; null if unsure. */
    isBold: boolean | null;
    /** Could the warning be read clearly at all? */
    legible: boolean;
  };
  /** Model's note when the image is poor/ambiguous. */
  readabilityNotes: string | null;
}

export type Verdict = "PASS" | "FAIL" | "NEEDS_REVIEW";

export interface FieldResult {
  field: string; // machine key, e.g. "brandName"
  label: string; // human label, e.g. "Brand name"
  verdict: Verdict;
  expected: string | null; // from the application
  found: string | null; // from the label
  reason: string; // plain-language explanation
}

export interface VerificationResult {
  overall: Verdict;
  fields: FieldResult[];
  elapsedMs: number;
  /** Echoed so a batch row can show what was checked. */
  application: ApplicationData;
  /** Present when the whole verification failed (e.g. model error). */
  error?: string;
}
