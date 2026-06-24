# TTB Label Requirements (Reference)

> Domain reference for what we verify. Sourced from TTB public guidance (ttb.gov) and 27 CFR.
> This is a prototype: we verify the high-value common fields, not every edge case in the CFR.

## Required label fields (common across beer / wine / distilled spirits)

| Field | Notes | How strict |
|-------|-------|------------|
| **Brand name** | The name the product is marketed under. | Fuzzy — case/punctuation/spacing differences are the *same* brand. |
| **Class / type designation** | e.g. "Kentucky Straight Bourbon Whiskey", "Cabernet Sauvignon". | Fuzzy — normalize case/spacing; meaning must match. |
| **Alcohol content** | e.g. "45% Alc./Vol. (90 Proof)". Some wine/beer exceptions. | Numeric — compare the ABV %, tolerant of format. |
| **Net contents** | e.g. "750 mL", "75 cL", "1 L". | Normalized volume — `750 mL` == `75 cL`. |
| **Name & address of bottler/producer** | Present on the label. | Presence check (fuzzy text). |
| **Country of origin** | Imports only. | Presence check when applicable. |
| **Government Health Warning** | Mandatory on ALL alcohol beverages. | **EXACT** — see below. |

## The Government Health Warning (the strict one)

Per **27 CFR 16.21**, the mandatory statement is, verbatim:

> **GOVERNMENT WARNING:** (1) According to the Surgeon General, women should not drink alcoholic
> beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic
> beverages impairs your ability to drive a car or operate machinery, and may cause health problems.

### Rules that make it pass/fail (not fuzzy)

1. **The words `GOVERNMENT WARNING:` must appear in CAPITAL LETTERS and BOLD.** Title case
   ("Government Warning") or non-bold is a **FAIL** — this is a real rejection reason agents cite.
2. **The wording must match**, including the "(1) … (2) …" two-part structure and the key phrases:
   - "According to the Surgeon General, women should not drink alcoholic beverages during pregnancy
     because of the risk of birth defects."
   - "Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery,
     and may cause health problems."
3. **It must be legible / not buried.** Reworded, abbreviated, or paraphrased warnings FAIL.

> Because bold/caps are **visual** properties, the vision model must report them explicitly:
> what the warning text says, whether `GOVERNMENT WARNING:` is rendered in all-caps, and whether it
> appears bold relative to surrounding text. See `verification-logic.md`.

## Example label (distilled spirits)

| Field | Value |
|-------|-------|
| Brand Name | OLD TOM DISTILLERY |
| Class/Type | Kentucky Straight Bourbon Whiskey |
| Alcohol Content | 45% Alc./Vol. (90 Proof) |
| Net Contents | 750 mL |
| Government Warning | [standard text above] |

## What we intentionally do NOT verify (prototype scope)

- Type size / placement measurements in points (CFR specifies minimums by container size) — we check
  presence, caps, bold, and wording, not millimeter type-height.
- Allergen/sulfite declarations, vintage rules, appellation rules.
- Anything requiring the actual COLA application record beyond the fields the agent enters.
