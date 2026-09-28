# Changelog

## Unreleased

### Changed

- Release tooling (`CONTRIBUTING.md:Releases` is canonical): `npm run release -- <version>` bumps `manifest.json`/`package.json`/`versions.json`, prepends the changelog entry, runs test+build, commits and tags. `npm run check-versions` (also first CI step) fails on version drift; `unreleased.yml` warns when `main` moves ≥1 commit ahead of the latest tag with plugin-relevant changes. Pushing to `main` alone never updates BRAT — only a pushed tag does.
- Removed legacy Templater `assignments/assignment.md` (the plugin never read it, BRAT never shipped it) and its `assignment`/`exam` routes in `career/entrypoint.md` — a blank note created in `30-assignments/`/`40-exams/` now fails closed with "No matching template found". Assignment template source of truth: `buildFrontmatter()`/`buildBody()` in `src/use_cases/create_assignment_service.ts`, pure helpers in `src/domain/assignment_domain.ts`.

## 0.2.1 — 2026-09-28 — Frontmatter `block-headings` parity (Templater + plugin)

### Fixed

- `assignments/assignment.md`: restored Templater syntax corrupted in `076c6c4` (escaped `\_` vars, `<%\*` tags, flattened YAML indent broke `course.name`/`grading`/`tags` nesting); re-applied intended `block-headings: true` with correct indent.
- `src/use_cases/create_assignment_service.ts:211` `buildFrontmatter()`: added `block-headings: true` after `toc: false` so plugin-created notes match Templater output. Covered by `tests/create_assignment_service.test.ts` (`block-headings: true` assertion).

## 0.2.0 — 2026-09-01 — Assignment-only MVP, public testing (BRAT + GitHub Release)

### Added

- Obsidian plugin scaffold `src/` Hexagonal (domain pure `src/domain/assignment_types.ts` 10 canonical `practico` + 2 aliases, `src/domain/assignment_domain.ts` `buildTitle`/`buildFilename`/`buildFolderName`/`buildExternalCodePath` + `src/domain/slugify.ts`).
- Ports `VaultPort`/`ModalPort`/`SettingsPort`/`FileSystemPort`/`ClockPort` (`src/ports/`) + Obsidian adapters (`src/adapters/obsidian/`).
- Use cases: `CreateAssignmentService` (`src/use_cases/create_assignment_service.ts:41` scaffold + frontmatter/body + external symlink) + `AssignmentNumberService` (`src/use_cases/assignment_number_service.ts` alias-aware scan).
- Commands: `Create Assignment` (`checkCallback` `src/plugin/main.ts:25`) + File Explorer `New Assignment` on `30-assignments`/`40-exams` (`src/plugin/main.ts:37`).
- Settings GUI `External code base path` (absolute) + `Code folder path` (vault-relative) `src/plugin/settings.ts` + `FileSystemPort` symlink `vault/code → external/<subject>/<folder>` desktop only, vault fallback on mobile (`src/use_cases/create_assignment_service.ts:88`).
- Build `esbuild.config.mjs:23` `outfile: main.js` at repo root (BRAT-compatible), `manifest.json:5` `0.2.0` `minAppVersion 1.5.0`.
- Tests `49 pass` (`tests/assignment_domain.test.js` 27, `tests/create_assignment_service.test.ts` 7, `tests/assignment_number_service.test.ts` 12, `tests/vault_adapter.test.ts` 3).

### Changed

- Dropped Templater hardcode `fs` symlink `~/Projects/...` → `SettingsPort`/`FileSystemPort` with user-provided absolute path.
- Context detection now vault-agnostic: `subjects/` walk-up (`src/plugin/main.ts:78`) + wildcard fallback (`src/plugin/main.ts:66`), superseding `career_config.js` wildcard — see `docs/path-coupling.md`.

### Docs

- Added `docs/01-discovery/PRD.md` (1-page living), `docs/02-requirements/backlog/US-001..004` (Done) + `US-010..012` (deferred `topics`/`classes`/`career`), `docs/02-requirements/RTM.csv` + `glossary.md`, `docs/USER_GUIDE.md`, `.github/workflows/ci.yml` + `release.yml`, `LICENSE` (MIT).
- Rewrote `README.md` (English, BRAT + manual), updated `docs/architecture.md` + `docs/adr/001-strangler-obsidian-plugin.md` to `0.2.0` public testing.

### Deferred

- `topics`/`classes`/`career` remain Templater (see `US-010..012`), to follow same ports pattern post-MVP.

## 0.1.0 — 2026-08-31

- Repo extraction from `00-meta/academic-cms` via `filter-repo`, `assignment_types`/`assignment_domain` pure extraction, `27 pass` `vitest`.
