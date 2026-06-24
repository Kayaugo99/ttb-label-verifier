# Tech Standards

> The quality floor and the stack. Load this when building the API, UI, or deploying.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js (App Router, TypeScript)** | One deploy unit for UI + API; trivial Vercel deploy → satisfies "deployed URL". |
| Styling | **Tailwind CSS** | Fast, consistent, large accessible defaults. |
| Vision/LLM | **Claude vision via the Vercel AI Gateway** (AI SDK v6, `generateObject`) | Reads real-world label photos; structured output removes brittle parsing. |
| Hosting | **Vercel (Fluid Compute)** | Live URL, Node runtime for the vision call, 300s function ceiling (we target ~5s). |

**Model:** default to a fast vision-capable Claude (Sonnet tier) to hit the latency budget; the model
id is configurable via env so it can be tuned. Route via gateway model strings (`anthropic/…`).

## Performance budget — the 5-second rule

- **Single label result must return in ~5s.** This is a primary acceptance criterion, not a target.
- One vision call per label; no chained calls. Ask for everything in a single structured response.
- Send a reasonably downscaled image (labels are legible well under full camera resolution) to cut
  upload + inference time.
- Batch: bounded concurrency (e.g. 5–8 in flight) so each label still resolves ~5s and the batch
  streams results as they finish rather than blocking on the whole set.
- **Measure it.** Log/display per-label elapsed time; capture evidence in `04-output/`.

## Code quality

- TypeScript strict. No `any` on public boundaries; type the vision response with a schema (Zod).
- **Separation:** vision call (`lib/vision.ts`), comparison logic (`lib/verify.ts`, pure functions),
  API route (thin), UI (presentational). Matching logic is pure + unit-testable.
- Deterministic verdicts live in code, not the prompt (see `verification-logic.md`).
- Handle errors explicitly: unreadable image, model error, oversized file, wrong file type → a clear
  user-facing message and a NEEDS REVIEW / error state, never a crash or a silent PASS.

## Accessibility & UX (hard requirement)

- Target user: non-technical, possibly 70+. Large hit targets, high contrast, plain language.
- Obvious primary action. Verdicts use color **and** text/icon (not color alone — colorblind-safe).
- Keyboard accessible, semantic HTML, visible focus, alt text. Labels on every input.
- Forgiving: drag-drop *or* click to upload; clear loading + error states.

## Security / privacy (prototype)

- **No persistence.** Process images + application data in memory; don't write them to disk or a DB.
- Secrets (gateway/API key) in env vars only — never committed. `.env.local` gitignored.
- No PII, no logging of label contents beyond ephemeral request handling.
- README must note: for a real internal TTB deployment, the firewall blocks outbound ML endpoints,
  so production would need an approved/on-prem inference path.

## Testing

- Unit tests for the pure matching functions (brand fuzzy, ABV parse, volume normalize, warning
  checks) — these encode the compliance rules and must be correct.
- Manual end-to-end with real/generated sample labels (a clean pass, a brand mismatch, an ABV
  mismatch, a title-case warning, a missing warning) before deploy.
