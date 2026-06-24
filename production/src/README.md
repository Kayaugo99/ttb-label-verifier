# production/src — the application

This is the Next.js app for the TTB Label Verifier. **See the [repository README](../../README.md)**
for the full overview, architecture, verification rules, assumptions, and deploy notes.

Quick start:

```bash
npm install
cp .env.example .env.local   # add your AI_GATEWAY_API_KEY
npm run dev                  # http://localhost:3000
npm test                     # unit tests for the matching logic (no API key needed)
```
