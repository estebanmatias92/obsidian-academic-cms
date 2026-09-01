# Contributing — obsidian-academic-cms

## Quick start

```bash
npm install
npm test          # vitest 49 tests
npm run build     # tsc + esbuild → main.js (root, for BRAT)
```

- Node ≥20, `npm ci` in CI (`.github/workflows/ci.yml`).
- Hexagonal layout: `src/domain` pure (test with fakes), `src/ports`, `src/use_cases`, `src/adapters/obsidian`, `src/plugin` — see `docs/architecture.md`.

## Testing the plugin in Obsidian

- **With BRAT:** push to `main` or install your fork via `BRAT: Add a beta plugin for testing`.
- **Manual:** `npm run build` then copy `main.js` + `manifest.json` + `versions.json` to `<vault>/.obsidian/plugins/obsidian-academic-cms/` and restart. See `docs/USER_GUIDE.md`.

## Backlog

- Assignment-only MVP `0.2.0` done (`docs/01-discovery/PRD.md:Scope`). `topics`/`classes`/`career` deferred (`docs/02-requirements/backlog/US-010.md` etc.).
- For new issues use `.github/ISSUE_TEMPLATE/` and `gh issue create` per `docs/agents/issue-tracker.md`.

## Releases

- Tag drives release: `git tag 0.2.0 && git push origin 0.2.0` → `.github/workflows/release.yml` runs `npm test && npm run build`, zips `main.js`+`manifest.json`+`versions.json` and publishes GitHub Release. Keep `manifest.json`/`versions.json`/`package.json` versions in sync.

## Style

- English docs (historical `ACOPLAMIENTO_CAREER_CONFIG.md` kept but canonical is `docs/path-coupling.md`).
- Commits: conventional (`feat(plugin): ...`, `docs: ...`, `fix: ...`).
