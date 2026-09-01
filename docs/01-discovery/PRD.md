# PRD — obsidian-academic-cms (Living, Agile)

Status: Accepted — 0.2.0 assignment-only MVP in public testing (2026-09-01)
Owner: estebanmatias92
Source vault: `conocimiento` (subjects via `subjects/<name>/`)

## 1. Vision

Academic CMS inside Obsidian that scaffolds academic work without manual folder/file creation. Started as Templater user scripts (`00-meta/academic-cms`), now an Obsidian plugin via Strangler Fig (`src/` Hexagonal: `domain` pure → `ports` → `adapters/obsidian` → `plugin`).

## 2. Persona

- **Primary:** Systems student managing multiple subjects (`subjects/<subject>/30-assignments/` + `40-exams/`), needing repeatable assignment scaffolding with frontmatter and optional `code` project.
- **Secondary:** Testers installing via BRAT on a copy vault before marketplace.

## 3. Problem

- Duplicated type catalog across templates, coupled `tp.app.vault` + DOM modal I/O, no tests, fragile wildcard paths (`career_config.js` `*systems*`). Manual scaffolding error-prone and slow.

## 4. Scope

### 0.2.0 MVP (done, public testing) — Must

- Create assignment via command + File Explorer context menu, scaffolding `_assets`/`deliverable`/`code` with frontmatter/body (`src/use_cases/create_assignment_service.ts:41`).
- 10 canonical types (`practico` canonical, 2 aliases `practica`/`trabajo-practico` → `practico` for scan), pure domain `src/domain/assignment_types.ts` + `src/domain/assignment_domain.ts`.
- Vault detection from any file inside `subjects/<subject>/` (`src/plugin/main.ts:78` `findSubjectPathFromPath` + `src/plugin/main.ts:66` wildcard fallback), prefill `unit`/`date`/`due_date` via `src/use_cases/assignment_number_service.ts`.
- Settings: `External code base path` (absolute, desktop symlink `vault/code → external/<subject>/<folder>`) + `Code folder path` (vault-relative fallback) via `src/plugin/settings.ts` + `src/ports/settings_port.ts:125`/`src/ports/file_system_port.ts:436`.
- Hexagonal ports (`VaultPort`/`ModalPort`/`SettingsPort`/`FileSystemPort`) with fake-port `vitest` (49 tests).

### Deferred — Should / Could (post-MVP)

- `topics` / `classes` / `career` modules follow same ports pattern (see `docs/02-requirements/backlog/US-010.md` etc.).
- Deep-modules via `dependency-cruiser`, marketplace publish.

### Out of scope

- Templater dependency (dropped in 0.2.0, keep as fallback until 1.0).
- Mobile symlink (falls back to vault folder `src/use_cases/create_assignment_service.ts:99`).

## 5. KPIs

- Time to scaffold: <30s from trigger to file open.
- Zero manual `mkdir`/frontmatter errors on created assignment.
- Tests green: `npm test` 49 pass, `npm run build` produces `main.js` at repo root (BRAT requirement).

## 6. Constraints

- `manifest.json:10` `isDesktopOnly:false` — must run on mobile via vault fallback.
- `esbuild.config.mjs:23` `outfile: main.js` at repo root (BRAT).
- Public repo `github.com/estebanmatias92/obsidian-academic-cms`.

## 7. Open Questions

- Future vault layouts without `subjects/` — heuristic could walk up to `_course.md` instead. Deferred.

## 8. References

- `docs/architecture.md`, `docs/adr/001-strangler-obsidian-plugin.md`, `docs/path-coupling.md`.
