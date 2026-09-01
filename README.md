# obsidian-academic-cms

Obsidian Academic CMS — Strangler from Templater (`00-meta/academic-cms`) → Plugin (pure domain `assignment_types`/`assignment_domain`, `VaultPort`/`ModalPort`/`SettingsPort`/`FileSystemPort`).

Vault integration: separate repo, built artifact deployed to `conocimiento/.obsidian/plugins/obsidian-academic-cms` (`manifest.json`+`main.js`).

## Features

- **Create Assignment**: Command (`Ctrl+P` → `Create Assignment`) + File Navigation context menu (`Right-click 30-assignments/40-exams` → `New Assignment`) scaffold `_assets`/`deliverable`/`code` with frontmatter.
- **External code base**: Absolute host path (e.g. `/home/matt/Projects/.../isft151-analisis-sistemas`) in Settings → `External code base path` creates external `<subject>/<folderName>/` and symlinks `vault/.../code → external/...` (desktop only, fallback to vault folder).

## Dev

```bash
npm install
npm test          # vitest 46 tests (assignment_domain, create_assignment_service, assignment_number_service)
npm run build     # tsc + esbuild → main.js
```

## Settings

- `Code folder path` — vault-relative (e.g. `50-code`) for custom code location when assignment type includes `code`.
- `External code base path` — absolute filesystem path for `code` symlink. Auto-append `<subject>/<folderName>` (from `assignment_domain.buildExternalCodePath`). Leave empty for default vault folder structure.

## Architecture

See `docs/architecture.md` and `docs/adr/001-strangler-obsidian-plugin.md` (Phase 3 regrouped: 3a repo → 3b ports → 3c plugin at `.obsidian/plugins`).
