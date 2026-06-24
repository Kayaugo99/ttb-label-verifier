# TTB Label Verifier

An AI-powered prototype that helps TTB compliance agents verify alcohol-beverage labels against
their applications. Upload a label photo + the application data; the app reads the label with Claude
vision and returns a clear **per-field verdict** — brand name, class/type, alcohol content, net
contents, and the mandatory **Government Health Warning** (presence, exact wording, ALL-CAPS, bold).

> Built for a take-home. The repository is organized as an **agent-native workspace** (a 3-layer
> context blueprint); the application itself lives in [`production/src/`](production/src).

---

## What it does

- **Single label** — enter the four application fields, drop in a label photo, get a result in ~5s.
- **Batch** — upload a manifest CSV (one row per label) plus all the images; results stream into a
  table with PASS / FAIL / NEEDS-REVIEW counts and a CSV export. Built for the peak-season case where
  a big importer dumps 200–300 applications at once.
- **Per-field verdicts** with plain-language reasons and what was found on the label vs. the
  application — so an agent can act without guessing.

### Verification rules (the interesting part)

| Field | How it's checked |
|-------|------------------|
| Brand name | **Fuzzy** — `STONE'S THROW` vs `Stone's Throw` passes (case/punctuation/spacing ignored). |
| Class / type | **Fuzzy** — same normalization. |
| Alcohol content | **Numeric** — ABV extracted from any format (`45% Alc./Vol. (90 Proof)` == `45% ABV`). |
| Net contents | **Normalized volume** — `750 mL` == `75 cL` == `0.75 L`. |
| Government Warning | **Strict** — required two-part wording **and** `GOVERNMENT WARNING:` in ALL CAPS **and** bold. Title case or non-bold = **FAIL** (a real rejection reason agents cite). |

Anything the model can't read confidently becomes **NEEDS REVIEW** rather than a fabricated verdict.
The vision model only *reads* the label; all pass/fail logic is deterministic code
([`lib/verify.ts`](production/src/lib/verify.ts)), so every verdict is explainable and unit-tested.

---

## Architecture

```
Browser (Next.js client)                      Server (Route Handler)
─────────────────────────                     ───────────────────────────
1. Agent enters app data + image              4. /api/verify (multipart)
2. Image downscaled in-browser (≤1600px)  ──► 5. Claude vision → structured JSON   (lib/vision.ts)
3. POST to /api/verify                        6. Deterministic field matching       (lib/verify.ts)
                                              7. JSON verdict back  ◄───────────────
```

- **Framework:** Next.js (App Router, TypeScript) + Tailwind CSS — one deploy unit for UI + API.
- **Vision:** Claude (`anthropic/claude-haiku-4.5` by default) via the **Vercel AI Gateway**, using
  the AI SDK v6 `generateText` + `Output.object` for schema-validated extraction. Haiku is fast
  (fits the ~5s budget) and runs on the Gateway free tier; set `VISION_MODEL` to a Sonnet/Opus tier
  for tougher photos or stricter bold-detection.
- **No persistence:** images and application data are processed in memory and never stored.

### How the Government Warning check stays reliable

Capitalization is **textual**, not just visual — so the model transcribes the `GOVERNMENT WARNING`
heading *verbatim* and the code checks `heading === heading.toUpperCase()` deterministically (this
catches "Government Warning" in title case every time). A `present` flag distinguishes a genuinely
**missing** warning (FAIL) from one that's merely **unreadable** (NEEDS REVIEW). **Bold** is the one
inherently-visual signal: it's a best-effort model judgment and the weakest link — on the free-tier
Haiku model a subtle bold difference can be missed. The deterministic wording + caps checks are the
reliable guardrail; bold enforcement improves with a paid Sonnet/Opus tier, and anything uncertain
falls to NEEDS REVIEW rather than a false pass.

```
production/src/
├── app/
│   ├── page.tsx                # mode tabs (single / batch)
│   ├── layout.tsx              # header, footer, theme
│   └── api/verify/route.ts     # the verification endpoint
├── components/                 # SingleVerify, BatchVerify, ResultCard, ImageDrop, …
└── lib/
    ├── vision.ts               # Claude vision extraction (reads the label)
    ├── verify.ts               # pure matching logic (judges the label) — unit-tested
    ├── verify.test.ts          # 17 tests covering the compliance rules
    ├── csv.ts                  # batch manifest parse + results export
    ├── client.ts               # in-browser downscale + API call + concurrency pool
    └── types.ts
```

---

## Run it locally

```bash
cd production/src
npm install
cp .env.example .env.local      # then add your AI Gateway API key
npm run dev                     # http://localhost:3000
```

You need a **Vercel AI Gateway API key** (`AI_GATEWAY_API_KEY`) for the Claude vision call. Get one
at <https://vercel.com/dashboard> → AI Gateway → API Keys. (On a Vercel deployment this is wired
automatically via OIDC — no key needed there.)

```bash
npm test          # run the unit tests (no API key required)
npm run build     # production build
```

---

## Deploy

The app deploys to Vercel as-is. Because the Next app lives in `production/src`, set that as the
**Root Directory** in the Vercel project settings (or deploy from inside that folder).

```bash
cd production/src
vercel            # preview
vercel --prod     # production
```

On Vercel, the AI Gateway authenticates through OIDC automatically, so no API key env var is
required for the deployed app.

---

## Assumptions & trade-offs

- **Application data is supplied by the agent** (single) or via **CSV** (batch). The prototype is
  standalone — it does not integrate with COLA (out of scope per the brief).
- **Cloud vision is acceptable for this externally-hosted POC.** The IT stakeholder noted the
  internal TTB network blocks many outbound ML endpoints — so a real internal deployment would need
  an approved or on-prem inference path. Flagged here intentionally.
- **Caps detection is deterministic** (from the verbatim-transcribed heading); **bold detection** is
  a best-effort visual judgment by the model and the known weak spot — see the box above. On a
  sample set, the default Haiku model correctly handled 6/7 cases, missing only a subtly-not-bold
  heading; the textual caps and wording checks were reliable.
- **Image quality:** images are downscaled client-side to keep within the ~5s budget. Severely
  degraded photos resolve to NEEDS REVIEW ("request a clearer image") rather than a false verdict.
- **Scope:** we verify presence + wording + caps + bold for the warning, not millimeter type-height
  rules from the CFR; and the common required fields, not every beverage-class edge case.
- **Performance:** one vision call per label, no chained calls; batches run with bounded concurrency
  (6) and stream results as they finish.

## Project layout note

This repo doubles as a demonstration of an **agent-native workspace**. Start at
[`CLAUDE.md`](CLAUDE.md) (the map) → [`CONTEXT.md`](CONTEXT.md) (the router) →
[`production/CONTEXT.md`](production/CONTEXT.md). The brief and spec that drove the build are in
[`production/workflows/01-briefs`](production/workflows/01-briefs) and
[`02-specs`](production/workflows/02-specs); the domain rules are in
[`production/docs`](production/docs). If you just want the app, it's all in `production/src`.
