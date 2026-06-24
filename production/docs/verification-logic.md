# Verification Logic

> How each field is compared after the vision model extracts it. The vision model **reads**; this
> logic **judges**. Keeping judgment in deterministic code (not the LLM) makes verdicts explainable,
> testable, and consistent.

## Pipeline

```
label image ──► Claude vision (structured extraction) ──► extracted fields + warning analysis
application data ─────────────────────────────────────►  field-by-field comparison (code)
                                                         └─► per-field verdict + overall verdict
```

The model returns **structured JSON** (not prose): each field's value, plus for the warning, the raw
text and booleans for `isAllCaps` / `isBold` / `isLegible`. All matching decisions happen in code.

## Verdict vocabulary

Every field resolves to one of:

- **PASS** — label matches the application.
- **FAIL** — clear mismatch or a required element is missing/wrong.
- **NEEDS REVIEW** — model couldn't read the field confidently, or it's a borderline fuzzy case.
  Surfaces to a human instead of guessing. (Maps to Jenny's "reject and ask for a better image" but
  softer — flag, don't auto-reject.)

Overall verdict = PASS only if every required field is PASS. Any FAIL ⇒ overall FAIL. Otherwise
NEEDS REVIEW.

## Per-field rules

### Brand name — FUZZY
Normalize both sides (lowercase, strip punctuation, collapse whitespace, trim) then compare.
- `STONE'S THROW` vs `Stone's Throw` → normalized equal → **PASS** (Dave's example).
- Allow small edit distance (e.g. Levenshtein ratio ≥ ~0.9) for OCR slips → **PASS**.
- Moderate difference → **NEEDS REVIEW**. Clearly different name → **FAIL**.

### Class / type — FUZZY
Same normalization. Meaning must match; case/spacing/ordering tolerated.
`Kentucky Straight Bourbon Whiskey` vs `KENTUCKY STRAIGHT BOURBON WHISKEY` → **PASS**.

### Alcohol content — NUMERIC
Extract the ABV percentage from both sides regardless of format
(`45% Alc./Vol. (90 Proof)`, `45% ABV`, `ALC 45% BY VOL`). Compare the number.
- Equal within a small tolerance (±0.0, configurable) → **PASS**.
- Proof is informational (proof = 2× ABV); ABV is the source of truth.
- Mismatch → **FAIL**. Unreadable → **NEEDS REVIEW**.

### Net contents — NORMALIZED VOLUME
Parse value + unit, convert to mL. `750 mL` == `75 cL` == `0.75 L` → **PASS**.
Mismatch → **FAIL**.

### Government Warning — EXACT (the strict one)
Three independent checks, all must pass:
1. **Presence + wording.** Normalize whitespace, then verify the warning contains the required
   two-part text. Use a tolerant-but-strict comparison: ignore whitespace/line-break differences,
   but reworded/abbreviated/missing clauses → **FAIL**.
2. **`GOVERNMENT WARNING:` is ALL CAPS.** From the model's `isAllCaps`. Title case → **FAIL**.
3. **`GOVERNMENT WARNING:` is BOLD.** From the model's `isBold`. Not bold → **FAIL**.

Any of the three failing ⇒ warning **FAIL** with a specific reason
("Warning present but 'Government Warning' is not in all caps"). If the model can't read it at all →
**NEEDS REVIEW** ("warning not legible — request a clearer image").

> Why code, not the LLM, makes the final call: the warning verdict is a compliance decision. We want
> it deterministic and explainable ("failed because not bold"), not a model's holistic vibe.

## Confidence → NEEDS REVIEW
The model returns a per-field confidence / "couldn't read" flag. Low confidence routes to NEEDS
REVIEW rather than a fabricated PASS/FAIL. Never invent a value the model didn't see.

## Batch
Each label runs the same single-label pipeline, concurrently (bounded pool) to respect the ~5s budget
per label. Results render in a table: row per label, overall verdict + expandable per-field detail.
