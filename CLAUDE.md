# TTB Label Verifier — Workspace Map

> **Layer 1: THE MAP.** Always loaded. Folder structure, naming, and what-not-to-load.
> Detailed instructions live in workspace `CONTEXT.md` files, not here. Keep this under 200 lines.

## What This Is

An **AI-powered alcohol label verification app** for TTB compliance agents. An agent uploads
label artwork + the application data; the app uses Claude vision to read the label and checks
that it matches the application — brand name, alcohol content, net contents, class/type, and the
mandatory **Government Health Warning** (exact wording, ALL-CAPS + bold `GOVERNMENT WARNING:`).

This repo is an **agent-native workspace** (the [ProjectBlueprint](https://github.com/) 3-layer
pattern). The deliverable app lives in `production/src/`. The blueprint layers around it keep the
build organized: brief → spec → build → output.

**CONTEXT.md** (top-level) routes you to the right work. This file is the map.

---

## Folder Structure

```
ttb-label-verifier/
├── CLAUDE.md                       ← You are here (always loaded — the map)
├── CONTEXT.md                      ← Task router
├── README.md                       ← Deliverable README (setup, run, approach, assumptions)
│
└── production/                     ← The build shop (only workspace — this is a single app)
    ├── CONTEXT.md                  ← Workspace entry point
    │
    ├── docs/                       ← Reference docs (load per-task, stable knowledge)
    │   ├── tech-standards.md       ← Stack, code quality, perf budget (<5s), testing
    │   ├── ttb-requirements.md     ← Domain: TTB label rules + exact warning text
    │   └── verification-logic.md   ← How matching works (brand fuzzy / ABV / warning exact)
    │
    ├── workflows/                  ← The build pipeline
    │   ├── CONTEXT.md              ← Pipeline routing (READ THIS for builds)
    │   ├── 01-briefs/              ← What to build (from the take-home spec)
    │   ├── 02-specs/               ← The contract: scope + acceptance criteria
    │   ├── 03-builds/              ← Build notes / scratch (the app itself is in src/)
    │   └── 04-output/              ← Deploy notes, deliverable URLs, test evidence
    │
    └── src/                        ← THE APP — Next.js (App Router, TS, Tailwind)
```

---

## Quick Navigation

| Want to... | Go here |
|------------|---------|
| **Understand the build pipeline** | `production/workflows/CONTEXT.md` |
| **Read the brief (what to build)** | `production/workflows/01-briefs/label-verifier.md` |
| **Read the spec (the contract)** | `production/workflows/02-specs/label-verifier-spec.md` |
| **Look up TTB label rules / warning text** | `production/docs/ttb-requirements.md` |
| **Understand the matching logic** | `production/docs/verification-logic.md` |
| **Look up stack / perf / quality standards** | `production/docs/tech-standards.md` |
| **Work on the app code** | `production/src/` |
| **Run / deploy the app** | `README.md` |

---

## Build Flow (one-way)

```
01-briefs (what + why)
    ↓ turns into a contract
02-specs (scope + acceptance criteria)
    ↓ builder implements against the spec
03-builds + src/ (the working app)
    ↓ verified, deployed
04-output (live URL + test evidence)
```

Changes propagate **forward**: changed brief → regenerate spec → rebuild. No skipping stages.

---

## Naming Conventions

| Thing | Pattern | Example |
|-------|---------|---------|
| Brief | `[slug].md` | `label-verifier.md` |
| Spec | `[slug]-spec.md` | `label-verifier-spec.md` |
| Build notes | `[slug]/` folder under `03-builds/` | `03-builds/notes.md` |
| Output / evidence | `[slug]-v[n].[ext]` | `deploy-v1.md` |
| App code | conventional Next.js layout inside `src/` | `src/app/api/verify/route.ts` |

---

## Token Management

This is a single-app repo, so there's one workspace (`production/`). Still, **don't load everything**:

- **Speccing?** → Load the brief + `docs/ttb-requirements.md`. Skip the app source.
- **Building matching logic?** → Load `docs/verification-logic.md` + `docs/ttb-requirements.md`.
- **Building UI?** → Load the spec + `docs/tech-standards.md`. Skip the deep TTB legal text.
- **Deploying?** → Load `README.md` + `docs/tech-standards.md`.

The `CONTEXT.md` files tell you exactly what to load per task. Trust them.

---

## Skills & Tools Available

| Tool | Type | Used In |
|------|------|---------|
| `/code-review` | Skill | Quality gate before `04-output` |
| `vercel:deploy` | Skill | Deploy the app for the live URL deliverable |
| `vercel:ai-sdk` | Skill | Wiring Claude vision via the AI SDK |
| Vercel AI Gateway | MCP/Platform | Routing Claude vision calls in `src/app/api/verify` |
| `/verify` or `/run` | Skill | Launch the app and confirm a change works end-to-end |

See `production/CONTEXT.md` and `production/workflows/CONTEXT.md` for when each is invoked.
