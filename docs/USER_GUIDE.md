# User Guide — obsidian-academic-cms `0.2.0` (assignment-only MVP)

## Prerequisites

- Obsidian `≥1.5.0` (`manifest.json:5` `minAppVersion`).
- Vault has `subjects/<subject>/_course.md` with frontmatter `course` + `code`, and `../_career.md` (or `<vault>/04-projects/.../subjects/<x>/`) with frontmatter `student`. Plugin reads them via `src/plugin/main.ts:94` + `src/plugin/main.ts:101` — no wildcard config.
- Plugin installed via BRAT or manual zip (see `README.md:Install`).

## Settings

`Settings → Academic CMS`

- **External code base path** — absolute path, e.g. `/home/matt/Projects/isft151-analisis-sistemas`. If set **and** on desktop (`src/ports/file_system_port.ts:436` `isDesktop()`), plugin creates `externalBase/<subject>/<folderName>` (`src/domain/assignment_domain.ts:buildExternalCodePath`) and symlinks `vault/<coursePath>/<assignDir>/<folder>/code → external/...` (`src/use_cases/create_assignment_service.ts:88`). Path must exist and be absolute (no `~/`).
- **Code folder path** — vault-relative, e.g. `50-code`. Only used when external is empty: creates `vault/<codeFolderPath>/<folder>-code` (`src/use_cases/create_assignment_service.ts:103`).
- Leave both empty → default `code/` inside assignment folder.

## Creating an assignment

1. Open any file inside `subjects/<subject>/` (e.g. `subjects/analisis/30-assignments/old.md`) or navigate to `30-assignments`/`40-exams`.
2. `Ctrl+P → Create Assignment` or right-click `30-assignments`/`40-exams` → `New Assignment` (`src/plugin/main.ts:25`/`src/plugin/main.ts:37`).
3. Fill modal (type, unit, topic, due date, etc.). Prefill `unit`/`date`/`due_date` (today +7d) comes from `src/use_cases/assignment_number_service.ts` (`scanLastOfType` alias-aware, 10 canonical `practico` etc.).
4. Submit → plugin creates `subjects/<subject>/30-assignments/YYYY-MM-DD-<type>-<topic>/{_assets,deliverable,code}` + file `YYYY-MM-DD-<student>-<code>-<type>-<n>-<topic>.md` with frontmatter (`src/use_cases/create_assignment_service.ts:143` `buildFrontmatter` + `buildBody`) then opens it (`src/plugin/main.ts:186`).

## What gets created

- Folder `YYYY-MM-DD-<type>-<topic>` under `30-assignments` (or `40-exams` if triggered from exams — `src/plugin/main.ts:91`).
- Subfolders `_assets`, `deliverable`, `code` (or symlink/custom per Settings).
- Markdown file `<filename>.md` (`src/domain/assignment_domain.ts:buildFilename` uses `student`/`courseCode`/`type`/`assignmentNumber`/`topic`).

## Troubleshooting

- `No se detectó una materia — run this from inside a course folder` (`src/plugin/main.ts:120`): active file is outside `subjects/<x>/`. Open a file inside the subject or right-click its `30-assignments`.
- `Academic CMS: missing course or career metadata` (`src/plugin/main.ts:139`): `_course.md` or `_career.md` not found / frontmatter missing `course`/`student`.
- External symlink not created:
  - Ensure `External code base path` is **absolute** and exists; plugin calls `fs.mkdir -p` + `fs.symlink`.
  - On mobile (`isDesktop() === false`) it falls back to vault `code` with console warning (`src/use_cases/create_assignment_service.ts:99`).
  - Check dev console `Ctrl+Shift+I` for `Academic CMS error:` (`src/plugin/main.ts:189`).
- Vault detection fallback: plugin first tries `*/*systems*/subjects/*/` wildcard then `subjects/` walk-up (`src/plugin/main.ts:86`). Vaults without `subjects/` will be disabled — see `docs/path-coupling.md`.

## Uninstall / Disable

Disable in `Settings → Community plugins`. Templater fallback for assignments stays available until `1.0` if plugin is disabled.
