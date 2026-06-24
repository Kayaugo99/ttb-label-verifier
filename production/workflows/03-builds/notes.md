# Build notes

The shipping application lives in `../../src` (conventional Next.js layout). This file records
build-time decisions that aren't obvious from the code.

## Key decisions

- **Vision reads, code judges.** The Claude vision call (`lib/vision.ts`) only transcribes what's on
  the label into a typed schema. Every PASS/FAIL/NEEDS-REVIEW decision is made by pure functions in
  `lib/verify.ts`. This keeps verdicts deterministic, explainable, and unit-testable (the warning
  rule is a compliance decision — it shouldn't depend on a model's holistic judgment).
- **Structured output via AI SDK v6.** Used `generateText` + `Output.object({ schema })` (the v6
  replacement for the deprecated `generateObject`) with a Zod schema. `strictJsonSchema` is on by
  default in v6, so the model returns schema-valid JSON.
- **Model:** `anthropic/claude-sonnet-4.6` through the Vercel AI Gateway — newest Sonnet, fast enough
  for the ~5s budget. Overridable via `VISION_MODEL`.
- **Client-side downscale** to ≤1600px before upload (`lib/client.ts`) — cuts upload + inference time
  to protect the 5s budget, and keeps requests well under the 12 MB server limit.
- **Batch concurrency = 6** with streaming results, so a 300-label batch doesn't block on the whole
  set and each label still resolves ~5s.
- **No persistence**: images/app data live only for the request.

## Sample label generation

`samples/images/*.jpg` were generated with a throwaway script (`sharp`, SVG → JPEG) covering each
verdict path — clean pass, the four warning failure modes, an ABV mismatch, and a unit-normalization
pass (`75 cL` vs `750 mL`). The generator isn't part of the app; it produced fixtures only. See
`samples/README.md`.

## Verified before output

- `npm test` — 17 unit tests for the matching logic (green).
- `npm run lint` — clean.
- `npm run build` — production build succeeds (Next 16, Turbopack).
- Typecheck (`tsc --noEmit`) — clean.
