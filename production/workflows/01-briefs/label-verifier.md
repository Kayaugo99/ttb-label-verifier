# Brief: AI-Powered Alcohol Label Verification App

## Why we're building this

The TTB reviews ~150,000 alcohol label applications a year with ~47 agents. Most of the review is
**matching** — confirming the brand name, alcohol content, net contents, and the mandatory
Government Health Warning on the label artwork match what's in the application. Agents describe this
as "data entry verification" that eats half their day. The goal: a standalone prototype that
automates the routine matching so agents can focus on judgment calls.

## Who uses it

TTB compliance agents. Wide range of tech comfort — half the team is over 50; the benchmark user is
"my 73-year-old mother who just learned to video call." The UI must be obvious and forgiving.

## What it must do (core)

1. Take a **label image** + the **application data** (brand, alcohol content, net contents,
   class/type) and tell the agent whether they match.
2. Read the label with AI vision (handles real-world photos: angles, glare, imperfect lighting where
   feasible).
3. Check each required field and show a clear **pass / fail / needs-review** per field.
4. **Government Health Warning** check is the high-value, high-rigor one: it must be present and
   **exact** — correct wording, `GOVERNMENT WARNING:` in ALL CAPS and bold. People try to cheat it
   (title case, smaller font, reworded). Catch that.
5. **Batch upload** — agents get dumped 200–300 applications at once during peak season. Process a
   batch, not just one at a time.

## Hard constraints (from stakeholder interviews)

- **~5-second result per label.** A prior vendor took 30–40s and agents abandoned it. Slow = dead.
- **Dead-simple UI.** No hunting for buttons. Clean, obvious states.
- **Prototype only.** No COLA integration. No PII storage. Don't persist sensitive data.
- **Firewall caveat.** Their network blocks many outbound ML endpoints. This is an externally-hosted
  POC so cloud vision is acceptable, but the README must flag this for any future internal deployment.
- **Judgment, not brittle matching.** `STONE'S THROW` vs `Stone's Throw` is the *same* brand and must
  pass. Fuzzy where a human would; exact only where the law is exact (the warning).

## Out of scope (for the prototype)

- COLA system integration / federal auth
- Persistent storage, user accounts, audit logs
- Perfect handling of severely degraded images (best-effort + a clear "needs better image" result)

## Definition of done

A deployed, accessible web app that verifies single labels and batches against application data in
~5s each, with an obvious UI and a clear per-field verdict — plus a README documenting setup,
approach, tools, and trade-offs.
