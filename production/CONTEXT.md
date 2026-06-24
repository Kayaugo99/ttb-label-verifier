# Production — The Build Shop

> **Layer 3: THE WORKSPACE.** Self-contained scope for building the app. Tells you exactly
> what to load per task — and what to skip.

## What This Workspace Is

Everything for building, verifying, and shipping the TTB Label Verifier. The brief becomes a
spec; the spec gets built into `src/`; the working app gets verified and deployed.

```
brief → spec → build (src/) → output (deployed URL)
```

---

## Where to Go

| You Want To... | Go Here |
|----------------|---------|
| **Understand the pipeline** | `workflows/CONTEXT.md` |
| **Read the brief** | `workflows/01-briefs/label-verifier.md` |
| **Read the spec (contract)** | `workflows/02-specs/label-verifier-spec.md` |
| **Look up the stack + perf budget** | `docs/tech-standards.md` |
| **Look up TTB label rules + warning text** | `docs/ttb-requirements.md` |
| **Understand the matching logic** | `docs/verification-logic.md` |
| **Work on app code** | `src/` |

**Don't read everything.** Identify your task, load only what you need.

---

## Folder Structure

```
production/
├── CONTEXT.md                  ← You are here
│
├── docs/                       ← Reference docs (load per-task)
│   ├── tech-standards.md       ← Stack, <5s perf budget, code quality, testing, security
│   ├── ttb-requirements.md     ← TTB required fields + the exact Government Warning text
│   └── verification-logic.md   ← How each field is compared (brand fuzzy / ABV / warning exact)
│
├── workflows/                  ← The build pipeline
│   ├── CONTEXT.md              ← Pipeline routing (READ THIS for builds)
│   ├── 01-briefs/              ← What to build
│   ├── 02-specs/               ← The contract
│   ├── 03-builds/              ← Build notes / scratch
│   └── 04-output/              ← Deploy notes, live URL, test evidence
│
└── src/                        ← THE APP (Next.js, App Router, TS, Tailwind)
```

---

## What to Load

| Task | Load These | Skip These |
|------|-----------|------------|
| Brief → Spec | the brief, `docs/ttb-requirements.md` | `src/`, tech-standards detail |
| Build matching logic | `docs/verification-logic.md`, `docs/ttb-requirements.md`, the spec | UI docs |
| Build the vision/API layer | the spec, `docs/tech-standards.md`, `docs/verification-logic.md` | deep TTB legal text |
| Build the UI | the spec, `docs/tech-standards.md` | TTB legal text, matching internals |
| Review / deploy | the spec (as acceptance criteria), `README.md` | docs/ unless checking a standard |

---

## Skills & Tools for This Workspace

| Skill / Tool | Stage | Purpose |
|-------------|-------|---------|
| Vercel AI Gateway | Build (API) | Route Claude vision calls from `src/app/api/verify` |
| `vercel:ai-sdk` | Build (API) | Correct AI SDK v6 patterns for vision + structured output |
| `/code-review` | Pre-output | Quality gate before anything is called "done" |
| `/verify` or `/run` | Pre-output | Launch the app, confirm a change works end-to-end |
| `vercel:deploy` | Output | Deploy for the live-URL deliverable |

---

## Hard Rules

1. **Specs are contracts, not blueprints.** The spec says WHAT + acceptance criteria. The builder
   owns HOW.
2. **The 5-second budget is a requirement, not a nice-to-have.** A label result must return in
   ~5s or the tool fails its primary stakeholder test. Measure it.
3. **The Government Warning check is exact.** Wording, ALL-CAPS `GOVERNMENT WARNING:`, and bold are
   pass/fail. Don't fuzzy-match the warning. (Do fuzzy-match the brand name — see
   `docs/verification-logic.md`.)
4. **Simple UI is a hard requirement.** Target user: a 73-year-old, non-technical agent. No hunting
   for buttons. Obvious states: pass / fail / needs-review.
5. **No PII storage.** Prototype only — process in memory, don't persist label images or applicant data.
6. **Nothing ships untested.** Verify with real sample labels before `04-output/`.
