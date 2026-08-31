# obsidian-academic-cms

Obsidian Academic CMS — Strangler from Templater (`00-meta/academic-cms`) → Plugin (pure domain `assignment_types`/`assignment_domain`, `VaultPort`/`ModalPort`/`SettingsPort`, Obsidian API only, no hardcode `fs` symlink).

Vault integration: separate repo, built artifact deployed to `conocimiento/.obsidian/plugins/obsidian-academic-cms` (`manifest.json`+`main.js`).

## Dev

```bash
npm install
npm test          # vitest 27 tests (assignment_domain)
```

## Architecture

See `docs/architecture.md` and `docs/adr/001-strangler-obsidian-plugin.md` (Phase 3 regrouped: 3a repo → 3b ports vault-only → 3c plugin at `.obsidian/plugins`).
