# Workflows — The Build Pipeline

> Four stages, forward-flow. Each stage's output feeds the next.

```
01-briefs/  →  02-specs/  →  03-builds/ (+ src/)  →  04-output/
  (what)        (contract)     (the work)             (shipped)
```

---

## Agent Routing

| Your Task | Input | Also Load | Output | Skills at This Stage |
|-----------|-------|-----------|--------|---------------------|
| Brief → Spec | `01-briefs/label-verifier.md` | `../docs/ttb-requirements.md` | `02-specs/label-verifier-spec.md` | — |
| Spec → Build (logic) | the spec | `../docs/verification-logic.md`, `../docs/ttb-requirements.md` | code in `../src/lib/` | `vercel:ai-sdk` |
| Spec → Build (API) | the spec | `../docs/tech-standards.md`, `../docs/verification-logic.md` | `../src/app/api/verify/route.ts` | AI Gateway, `vercel:ai-sdk` |
| Spec → Build (UI) | the spec | `../docs/tech-standards.md` | `../src/app/` | — |
| Build → Output | the working app | the spec (acceptance criteria) | `04-output/` evidence + live URL | `/code-review`, `/verify`, `vercel:deploy` |

---

## Stage Details

### 01-briefs/ — The Input
Plain-language statement of what to build and why, distilled from the take-home spec + stakeholder
interviews. **File:** `label-verifier.md`

### 02-specs/ — The Contract
Turns the brief into buildable, testable requirements: scope, acceptance criteria, the field-by-field
verification rules, perf budget, and what "done" looks like. Defines WHAT + WHEN, not line-by-line HOW.
**File:** `label-verifier-spec.md`

### 03-builds/ — The Work
Build notes, decisions, and scratch. The **app itself** lives in `../src/` (conventional Next.js
layout). Use this folder for anything that documents the build but isn't shipping code.

### 04-output/ — The Deliverable
Deploy notes, the live URL, and test evidence (sample labels run, timings proving the <5s budget).
Nothing lands here until it passes the spec's acceptance criteria.

---

## Pipeline Rules

1. **Flow is forward.** No skipping stages.
2. **Each agent loads only what it needs** (see routing table).
3. **Changes propagate forward.** Changed spec → rebuild the affected part.
4. **Builder has creative freedom within the spec + `docs/` standards.**
5. **Nothing ships untested.** Verify with real labels and measure latency before `04-output/`.
