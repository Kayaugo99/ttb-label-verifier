# Spec: TTB Label Verifier (Contract)

> Defines WHAT to build and the acceptance criteria. The builder owns HOW. Derived from
> `01-briefs/label-verifier.md` + `docs/ttb-requirements.md` + `docs/verification-logic.md`.

## Scope

A deployed web app where a TTB agent provides **(a)** label artwork and **(b)** the application
data, and gets back a clear per-field verdict plus an overall PASS / FAIL / NEEDS REVIEW. Supports a
**single label** flow and a **batch** flow.

In scope: brand, class/type, alcohol content, net contents, and the Government Health Warning
(presence + caps + bold + wording). Single + batch. Simple, accessible UI. ~5s/label. Deployed URL.

Out of scope: COLA integration, auth, persistence, audit logs, pixel-level type-size measurement.

## User flows

### Single label
1. Agent enters application data: brand name, class/type, alcohol content (ABV), net contents.
2. Agent uploads/drag-drops the label image.
3. Clicks **Verify**.
4. Within ~5s: overall verdict banner + a per-field table (PASS/FAIL/NEEDS REVIEW, the value found
   on the label vs the application value, and a reason on anything not-PASS). Elapsed time shown.

### Batch
1. Agent uploads many label images at once (target 200–300 capability; demoable with a handful).
2. Provides application data per label. **Default mechanism: a CSV** (filename → brand, class/type,
   ABV, net contents) matched to uploaded files by filename, so 300 rows don't require 300 forms.
3. Results stream into a table as each label finishes: row = filename + overall verdict, expandable
   to per-field detail. Summary counts (PASS / FAIL / NEEDS REVIEW). Export results as CSV.

## Functional acceptance criteria

| # | Criterion |
|---|-----------|
| F1 | Vision model extracts brand, class/type, ABV, net contents, and the full warning text from a label image, returning **structured JSON** (schema-validated). |
| F2 | Brand & class/type compared **fuzzily** — `STONE'S THROW` vs `Stone's Throw` ⇒ PASS. |
| F3 | ABV compared **numerically** across formats (`45% Alc./Vol. (90 Proof)` vs `45% ABV` ⇒ PASS). |
| F4 | Net contents compared by **normalized volume** (`750 mL` == `75 cL` ⇒ PASS). |
| F5 | Warning **present + correct wording** (two-part text) or it FAILs with a specific reason. |
| F6 | Warning `GOVERNMENT WARNING:` **not ALL CAPS ⇒ FAIL**; **not BOLD ⇒ FAIL** (distinct reasons). |
| F7 | Unreadable/low-confidence field ⇒ **NEEDS REVIEW**, never a fabricated PASS/FAIL. |
| F8 | Overall verdict = PASS iff all required fields PASS; any FAIL ⇒ FAIL; else NEEDS REVIEW. |
| F9 | Batch: multiple labels processed, results in a table with summary counts + CSV export. |
| F10 | Errors (bad file type, oversized, model error, no image) ⇒ clear message, no crash. |

## Non-functional acceptance criteria

| # | Criterion |
|---|-----------|
| N1 | **Single-label result in ~5s** under normal conditions; elapsed time displayed. |
| N2 | UI usable by a non-technical 70+ user: obvious primary action, plain language, large targets. |
| N3 | Verdicts conveyed by **text + icon + color** (colorblind-safe), not color alone. |
| N4 | Keyboard accessible, semantic HTML, labeled inputs, visible focus. |
| N5 | **No persistence** of images or application data; secrets in env only. |
| N6 | Deployed to a public URL that the evaluator can open and use. |

## Verification rules
Authoritative source: `docs/verification-logic.md`. The spec defers field-by-field algorithm detail
to that doc; this spec fixes the *acceptance criteria* (above), that doc fixes the *method*.

## "Done" looks like
- All F + N criteria demonstrably met with sample labels covering: clean PASS, brand mismatch, ABV
  mismatch, title-case warning (FAIL), missing warning (FAIL), and a NEEDS-REVIEW image.
- Unit tests pass for the matching functions.
- Live URL works. README documents setup, approach, tools, assumptions, trade-offs.
- Evidence (sample runs + timings) recorded in `04-output/`.

## Key assumptions (fill-the-gaps, documented per the take-home)
- Application data is **entered by the agent** (single) or supplied via **CSV** (batch). We don't
  read it from COLA — the prototype is standalone.
- Cloud Claude vision is acceptable for an externally-hosted POC; internal deployment would need an
  approved inference path (firewall caveat noted in README).
- "Bold/caps" detection relies on the vision model's visual assessment, reported as explicit
  booleans; we treat those as the compliance signal.
