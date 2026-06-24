# TTB Label Verifier — Task Router

> **Layer 2: THE ROUTER.** One job: send you to the right place with the right context.
> Folder map + naming rules live in `CLAUDE.md` (always loaded). This file routes tasks.

## What This Is

A single-app build: the **AI-Powered Alcohol Label Verification App**. Because it's one app, there's
one workspace — `production/` — running a brief → spec → build → output pipeline.

---

## Task Routing

| Your Task | Go Here | You'll Also Need |
|-----------|---------|-----------------|
| **Understand what we're building** | `production/workflows/01-briefs/label-verifier.md` | — |
| **Understand the contract / acceptance criteria** | `production/workflows/02-specs/label-verifier-spec.md` | the brief |
| **Write/adjust the verification rules** | `production/docs/verification-logic.md` | `production/docs/ttb-requirements.md` |
| **Look up TTB rules or the exact warning text** | `production/docs/ttb-requirements.md` | — |
| **Build a feature (API, UI, logic)** | `production/CONTEXT.md` → then `production/src/` | the spec + relevant `docs/` |
| **Check stack / perf budget / standards** | `production/docs/tech-standards.md` | — |
| **Run, test, or deploy** | `README.md` | `production/docs/tech-standards.md` |

---

## Workspace Summary

| Workspace | Purpose | Skills & Tools |
|-----------|---------|---------------|
| `production/` | Brief → spec → built, deployed app. The whole build lives here. | `/code-review`, `vercel:deploy`, `vercel:ai-sdk`, AI Gateway |

Full details in `production/CONTEXT.md`. Read that when working in the workspace, not this file.

---

## Build Flow

```
01-briefs (what + why)
    ↓ contract
02-specs (scope + acceptance criteria)
    ↓ implement
03-builds + src/ (working app)
    ↓ verified + deployed
04-output (live URL + evidence)
```
