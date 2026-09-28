# Contributing — obsidian-academic-cms

## Quick start

```bash
npm install
npm test          # vitest 49 tests
npm run build     # tsc + esbuild → main.js (root, for BRAT)
npm run check-versions  # fail fast if manifest/package/versions/CHANGELOG drift
```

- Node ≥20, `npm ci` in CI (`.github/workflows/ci.yml`).
- Hexagonal layout: `src/domain` pure (test with fakes), `src/ports`, `src/use_cases`, `src/adapters/obsidian`, `src/plugin` — see `docs/architecture.md`.

## Testing the plugin in Obsidian

- **With BRAT:** install your fork via `BRAT: Add a beta plugin for testing`. BRAT only picks up **tagged releases** — pushing to `main` alone changes nothing in Obsidian until you cut a release (see `Releases` below).
- **Manual:** `npm run build` then copy `main.js` + `manifest.json` + `versions.json` to `<vault>/.obsidian/plugins/obsidian-academic-cms/` and restart. See `docs/USER_GUIDE.md`.

## Backlog

- Assignment-only MVP `0.2.0` done (`docs/01-discovery/PRD.md:Scope`). `topics`/`classes`/`career` deferred (`docs/02-requirements/backlog/US-010.md` etc.).
- For new issues use `.github/ISSUE_TEMPLATE/` and `gh issue create` per `docs/agents/issue-tracker.md`.

## Releases

Workflow is batching: push work to `main` freely, then cut a release deliberately when you want BRAT to move. Pushing to `main` alone never updates BRAT — only a pushed tag fires `release.yml`.

```bash
npm run release -- 0.2.2              # bump + changelog stub + test + build + commit + tag
npm run release -- 0.2.2 --notes "…"  # with changelog body
npm run release -- 0.2.2 --dry-run    # preview without writing anything
git push origin main 0.2.2            # tag push fires release.yml (or pass --push)
```

- `scripts/release.mjs` syncs `manifest.json` + `package.json` + `versions.json` (+ `package-lock.json`), prepends the CHANGELOG entry, runs `npm test && npm run build && npm run check-versions`, then commits `chore(release): X` and tags `X`. Refuses on dirty tree / existing tag / bad semver.
- Tag drives release: pushing tag `X` → `.github/workflows/release.yml` runs `npm test && npm run build`, zips `main.js`+`manifest.json`+`versions.json` and publishes the GitHub Release BRAT consumes.
- Guards: `npm run check-versions` (`scripts/check-versions.mjs`, also first CI step) fails on drift between the three version files or a missing CHANGELOG heading. `.github/workflows/unreleased.yml` warns (never fails) when `main` is ≥1 commit ahead of the latest tag with changes under `src/`, `manifest.json`, `package.json`, `versions.json`, `esbuild.config.mjs`.

## Assignment template — where to edit

Single source of truth is TypeScript, not markdown:

- Frontmatter → `src/use_cases/create_assignment_service.ts` `buildFrontmatter()`
- Body → same file, `buildBody()`
- Title/filename/folder/scaffold → `src/domain/assignment_domain.ts` (pure, tested)

The legacy Templater `assignments/assignment.md` was removed — the plugin never read it and BRAT never shipped it. `topics/`/`classes`/`career` are still Templater (deferred `US-010..012`), so those `.md` templates remain live until ported.

## Style

- English docs (historical `ACOPLAMIENTO_CAREER_CONFIG.md` kept but canonical is `docs/path-coupling.md`).
- Commits: conventional (`feat(plugin): ...`, `docs: ...`, `fix: ...`).
