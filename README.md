# obsidian-academic-cms

Obsidian Academic CMS — scaffold assignments inside your vault with correct frontmatter, folders, and optional external code symlink. Assignment-only MVP in public testing (see `CHANGELOG.md` for current version).

> Strangler Fig from Templater `00-meta/academic-cms` → Hexagonal plugin (`src/domain` pure → `src/ports` → `src/adapters/obsidian` → `src/plugin`). See `docs/architecture.md` and `docs/adr/001-strangler-obsidian-plugin.md`.

## Install

### Option A — BRAT (recommended for testing)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) in Obsidian.
2. `Command Palette → BRAT: Add a beta plugin for testing` → `https://github.com/estebanmatias92/obsidian-academic-cms`
3. Enable `Academic CMS` in `Settings → Community plugins`.
4. Restart Obsidian.

Requirement: BRAT needs `main.js` + `manifest.json` at repo root — satisfied (`esbuild.config.mjs:23` `outfile: 'main.js'`).

### Option B — Manual (GitHub Release)

1. Download `obsidian-academic-cms-<version>.zip` (or `main.js`+`manifest.json`+`versions.json`) from [Releases](https://github.com/estebanmatias92/obsidian-academic-cms/releases).
2. Unzip into `<vault>/.obsidian/plugins/obsidian-academic-cms/` (create folder if needed).
3. Enable `Academic CMS` in `Settings → Community plugins` and restart.

`minAppVersion: 1.5.0` (`manifest.json:5`), `isDesktopOnly: false`.

## Usage

Prereqs: vault has `subjects/<subject>/_course.md` and `<career>/_career.md` (see `docs/USER_GUIDE.md`). Open a file inside a subject.

- **Command:** `Ctrl+P → Create Assignment` — opens modal prefilled with next `unit`/`date`/`due_date` (today + 7d, scanned via `src/use_cases/assignment_number_service.ts`).
- **File Explorer:** Right-click folder `30-assignments` or `40-exams` inside `subjects/<name>/` → `New Assignment` (`src/plugin/main.ts:37`).
- Output: `30-assignments/<date>-<type>-<topic>/_assets/` + `deliverable/` + `code` (or symlink, see Settings) and `<date>-<student>-<code>-<type>-<n>-<topic>.md` with frontmatter/body (`src/use_cases/create_assignment_service.ts:41`).

If no subject is detected you'll see `No se detectó una materia — run this from inside a course folder` (`src/plugin/main.ts:120`).

## Settings

`Settings → Academic CMS`

- **External code base path** — absolute host path, e.g. `/home/user/Projects/isft151-analisis-sistemas`. When set and on desktop (`src/ports/file_system_port.ts:436` `isDesktop()`), creates `external/<subject>/<folder>` and symlinks `vault/.../code → external/...` (`src/use_cases/create_assignment_service.ts:88`). Mobile falls back to vault folder with warning (`src/use_cases/create_assignment_service.ts:99`).
- **Code folder path** — vault-relative, e.g. `50-code`. Used only when external is empty: creates `50-code/<folder>-code` (`src/use_cases/create_assignment_service.ts:103`).

## Dev

```bash
npm install
npm test          # vitest (assignment_domain, create_assignment_service, assignment_number_service, vault_adapter)
npm run build     # tsc + esbuild → main.js (root, for BRAT)
npm run check-versions  # version-sync guard
npm run release -- <version>  # bump + changelog + test + build + commit + tag (see CONTRIBUTING.md:Releases)
```

- Domain: `src/domain/assignment_types.ts` (10 canonical `practico` + 2 aliases `practica`/`trabajo-practico` → `practico`) + `src/domain/assignment_domain.ts` (`buildTitle`/`buildFilename`/`buildFolderName`/`buildExternalCodePath`).
- Ports: `src/ports/vault_port.ts:863`, `src/ports/modal_port.ts:854`, `src/ports/settings_port.ts:125`, `src/ports/file_system_port.ts:436`.
- Tests: `tests/` (`vitest.config.js`).

## Docs

- `docs/01-discovery/PRD.md` — living 1-page vision + MVP scope (assignment-only, `topics`/`classes`/`career` deferred).
- `docs/02-requirements/backlog/US-00*.md` + `docs/02-requirements/RTM.csv` + `docs/02-requirements/glossary.md`
- `docs/USER_GUIDE.md`, `docs/architecture.md`, `docs/adr/`, `docs/path-coupling.md` (history).

## License

MIT — see `LICENSE`.
