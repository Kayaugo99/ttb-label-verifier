# Sample test labels

Synthetic distilled-spirits labels for demoing the verifier, each exercising a different code path.
They were generated as SVG and rasterized to JPEG (see `production/workflows/03-builds/notes.md`).

All rows in `manifest.csv` use the same application data (brand entered in **title case** to show the
fuzzy brand match against the label's ALL-CAPS print).

| File | What it tests | Expected overall |
|------|---------------|------------------|
| `01-clean-pass.jpg` | Everything correct; bold all-caps warning | **PASS** |
| `02-warning-titlecase.jpg` | "Government Warning:" in title case | **FAIL** (warning not all caps) |
| `03-warning-notbold.jpg` | Warning heading not bold | **FAIL** (warning not bold) |
| `04-warning-missing.jpg` | No warning on the label | **FAIL** (warning missing) |
| `05-warning-reworded.jpg` | Paraphrased / non-compliant warning | **FAIL** (wording) |
| `06-abv-mismatch.jpg` | Label shows 40%, application says 45% | **FAIL** (alcohol content) |
| `07-brand-equivalent.jpg` | Net contents printed as `75 cL` vs `750 mL` | **PASS** (volume normalized) |

## How to use

**Single mode:** open the app, type the application data (see `manifest.csv`), drop in one image.

**Batch mode:** upload `manifest.csv`, then select all seven images. Results stream into the table;
export them as CSV.

> These are clean, straight-on renders. Real-world photos with glare/angles will more often land in
> **NEEDS REVIEW** — which is the intended safe behavior.
