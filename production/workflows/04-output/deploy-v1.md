# Output: Deployment v1

## Deliverables

- **Live app:** https://ttb-label-verifier-beta.vercel.app  (public, Vercel personal account)
- **Source repo:** https://github.com/Kayaugo99/ttb-label-verifier  (private)

## How it's deployed

- Vercel project `ttb-label-verifier`, deployed via CLI from `production/src` (that folder is the
  Next.js root). `AI_GATEWAY_API_KEY` set as an encrypted env var in Production/Preview/Development.
- The per-deployment URL is behind Vercel deployment protection (SSO); the **production alias**
  (`…-beta.vercel.app`) is public — that's the URL to share.

## Verification evidence

### Acceptance — sample labels (live deployment)

| Sample | Overall | Warning | Time | Expected | Match |
|--------|---------|---------|------|----------|-------|
| 01 clean | PASS | PASS | 4.7s | PASS | ✓ |
| 02 title-case warning | FAIL | FAIL | 4.3s | FAIL | ✓ |
| 03 not-bold warning | PASS | PASS | ~4s | FAIL | ✗ (bold limitation) |
| 04 missing warning | FAIL | FAIL | 3.6s | FAIL | ✓ |
| 05 reworded warning | FAIL | FAIL | ~4.8s | FAIL | ✓ |
| 06 ABV mismatch | FAIL | — | ~4.1s | FAIL | ✓ |
| 07 brand/volume equivalence | PASS | PASS | ~4.2s | PASS | ✓ |

**6/7 correct.** The one miss (03, a subtly-not-bold heading) is the documented bold-detection
limitation — caps is checked deterministically (textual) and is reliable; bold is a best-effort
visual signal on the free-tier Haiku model. Mitigation: `VISION_MODEL` → paid Sonnet/Opus, and the
NEEDS-REVIEW path catches uncertain cases.

### Quality gates (all green)
- `npm test` — 19 unit tests on the matching logic.
- `npm run lint` — clean.
- `npm run build` — production build succeeds (Next 16, Turbopack).
- `tsc --noEmit` — clean.

### Performance
- Single-label warm latency ~3.6–4.8s end-to-end on the live deployment — within the ~5s budget.
- First (cold) call ~8s; warms quickly under Fluid Compute.

## Known limitations / next steps
- Bold detection (see above) — strongest fix is a paid model tier.
- Free-tier rate limits apply to premium models; Haiku 4.5 is the default to stay on free credit.
- For a real internal TTB rollout: the agency firewall blocks outbound ML endpoints, so production
  would need an approved/on-prem inference path (noted in the README).
