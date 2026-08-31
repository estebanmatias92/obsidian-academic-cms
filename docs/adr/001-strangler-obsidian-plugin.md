# ADR 001 — Incremental Migration to Obsidian Plugin via Strangler Fig

* Status: Accepted (Phase 1-2 done, Phase 3 regrouped)
* Date: 2026-08-31 (updated 2026-08-31 — repo `obsidian-academic-cms`, vault-only paths)
* Deciders: academic-cms owner
* Scope: `00-meta/academic-cms/` → `obsidian-academic-cms` Plugin (`github.com/estebanmatias92/obsidian-academic-cms` `public`) at `.obsidian/plugins/obsidian-academic-cms`
* Relates to: `docs/architecture.md`, `docs/ACOPLAMIENTO_CAREER_CONFIG.md`

## Context

`academic-cms` runs as Templater user scripts (`templater-obsidian/data.json:14` `user_scripts_folder: 00-meta`). Key pain is the duplicated assignment type catalog:

* `assignments/assignment.md:10` `typeDisplayNames`
* `assignments/assignment_form_modal.js:11` `typeDisplayNames`
* `assignments/assignment_form_modal.js:47` `fieldGroups` options (near-duplicate without aliases)

Collateral coupling: `assignments/assignment.md:26` `scaffoldTemplates` vs `assignments/assignment_form_modal.js:25` `codeTypes` / `assignments/assignment_form_modal.js:27` `typeAliases` encode the same domain. Pure rules (title `assignments/assignment.md:83` ↔ `assignments/assignment_form_modal.js:530`, filename `assignments/assignment.md:84` ↔ `assignments/assignment_form_modal.js:534`) are duplicated and untestable; I/O (`tp.app.vault`, DOM modal `assignments/assignment_form_modal.js:245`) is interleaved with domain — hardcode `fs` symlink `assignment.md:140` `~/Projects/.../isft151-analisis-sistemas` + `os.homedir` dropped for vault-only agnostic paths.

Goal is an **Obsidian Plugin** that reuses the same scaffolding logic, migrates one refactor at a time without breaking the vault, and leaves each `main` commit green.

## Decision

Adopt **Strangler Fig, evolutionary design, YAGNI**:

1. **Now:** apply only `SRP + DRY + Module/Registry` (Type Object). Cheap, low-risk, immediately useful for Plugin.
2. **Later:** apply `DIP/Adapter/Ports & Adapters` only at I/O boundaries when the Plugin needs them. Apply `Strategy/Factory` only if a type diverges beyond the current uniform `scaffoldTemplates`/`codeTypes`.
3. **Pilot:** `assignments/` first; replicate to `topics/`, `classes/`, `career/` after validation.

A pattern is introduced only if it **reduces coupling to `tp/vault/dom`** or **cheapens the next Plugin step**.

## Plan — Phases (each is a mergeable PR) — regrouped 2026-08-31 for `obsidian-academic-cms` isolated repo

### Phase 1 — DRY: Centralize Assignment Types (done)

* Created `assignments/assignment_types.js` exporting `canonicalTypes` (10 `practico` canonical), `aliasMap` (2 read-only), `typeDisplayNames`, `typeOptions`, `typeAliases`, `scaffoldTemplates`, `codeTypes`, `getDisplayName`/`resolveType` alias-aware. Exposes `tp.user.assignment_types` + `require` fallback. Refactored `assignment.md:10-39` + `assignment_form_modal.js:11-28`/`47-58` to `typeOptions`/`getDisplayName`.
* Validation: `practico`/`parcial` writes `practico` only, legacy `05-trabajo-practico-*` scans as `practico`, `code/` gated by `codeTypes`, title/filename unchanged — done.

### Phase 2 — Extract Pure Domain (done)

* Extracted `buildTitle()`, `buildFilename()`, `getScaffoldDirs()`, `buildFolderName`, `buildBasePath`, `normalizeUnit/Number` into `assignments/assignment_domain.js` (pure, zero `tp`/`app`, imports `shared/slugify.js:21`). 1:1 with `assignment.md:83-84`/`77` and `modal:522-536`.
* Added `tests/assignment_domain.test.js` (`vitest` `globals:true`, guard `if (typeof app !== 'undefined' && app.vault)` vs Templater `user_scripts_folder: 00-meta` scan, `27 pass`). Self-contained `package.json`/`node_modules` inside module.
* Validation: vault creation via domain + `vitest` pass — done.

### Phase 3 — Regrouped: Own Repo `obsidian-academic-cms` + Vault-only Ports + Plugin at `.obsidian/plugins/obsidian-academic-cms`

**Phase 3a — Repo extraction (this week, unblocks Templater scan)**

* `github.com/estebanmatias92/obsidian-academic-cms` `public` (`https://github.com/estebanmatias92/obsidian-academic-cms.git`) — created 2026-08-31 from `00-meta/academic-cms` via `filter-repo`/`rsync`, `self-contained` `package.json:1` (`obsidian-academic-cms` `0.1.0`)/`vitest.config.js:1`/`node_modules`/`tests` inside repo, own `.gitignore` (`node_modules/`, `dist/`, `coverage/`). Vault `conocimiento/.gitignore:40` already `node_modules/` but `!00-meta/` tracked `00-meta/academic-cms`; after extraction add `00-meta/academic-cms/` ignore (or `git submodule` vs separate clone `~/Projects/.../obsidian-academic-cms` + build deploy) — `00-meta/academic-cms` removed when not functional (your `remove academic-cms from 00-meta when is no longer functional`).
* Drop hardcode `assignment.md:140` `fs` symlink `~/Projects/.../isft151-analisis-sistemas` + `os.homedir` — vault-only `Vault.createFolder` for `code/` (real vault folder), no `fs`/`adapter.getFullPath`.

**Phase 3b — Decouple I/O: Ports (Obsidian-only, agnostic, no `fs` symlink)**

* Introduce `VaultPort` (`createFolder`, `getAbstractFileByPath`, `read`, `move`, `getMatchedPath`), `ModalPort` (`openAssignmentForm` → `obsidian.Modal` not `document.createElement` `modal:245-495`), `SettingsPort` (`getCodePath(): string|undefined` from `data.json` GUI user-configured, fallback vault-relative `coursePath/assignDir/folderName/code` via `VaultPort`, never hardcode `~/Projects/...`), `ClockPort` (`moment` vs `tp.date.now`). No `FileSystemPort` `symlink` — agnostic `Vault` API only, `isDesktopOnly: false`.
* Refactor `scanLastOfType`/`scanLastOverall` (`modal:184-243` regex `^\d{4}-\d{2}-\d{2}-(.+?)-`) + scaffold `assignment.md:136-155` to `CreateAssignmentService.execute(formData, VaultPort, SettingsPort)` injected, not `tp.app.vault`/`fs` directly.
* Validation: fake in-memory `Map<string,TFile>` vault tests, no `tp`/`document`/`fs`.

**Phase 3c — Plugin Skeleton at `.obsidian/plugins/obsidian-academic-cms` (isolation complete, drop Templater)**

* Init `obsidian-academic-cms/src/` as `TypeScript` Plugin (`manifest.json` `id: obsidian-academic-cms`, `version: 0.1.0`, `minAppVersion: 1.5.0`), `src/plugin/main.ts` (`onload: addCommand Create Assignment + vault.on('create')` hook replacing `templater-obsidian/data.json:16` `folder_templates: 04-projects/prj-systems-analyst`), `settings.ts` (`SettingsTab` for optional code path), `esbuild` → `dist/main.js` → deploy `cp` to `conocimiento/.obsidian/plugins/obsidian-academic-cms/` (vault ignores `main.js` per `conocimiento/.gitignore:17` intentionally, source in `obsidian-academic-cms` repo). Remove `00-meta/academic-cms` when thin `assignment.md` wrapper (`tp.user.*` delegate to `app.plugins.plugins['obsidian-academic-cms']`) not functional on `main` green. Keep `Templater` dependency (`almost just new note hook`) dropped — hook via `Obsidian API` directly.
* Validation: Plugin dev vault creates identical `30-assignments/<date>-practico-<topic>/_assets/deliverable/code` via `VaultPort` (vault folder, agnostic, no `fs`); rollback keep `Templater` until `1.0`.

## Alternatives Considered

* **Big Bang rewrite as Plugin** — rejected: blocks vault usage, high risk, no incremental validation.
* **Full SOLID/GoF upfront** (`Factory/Strategy` for 10 canonical types) — rejected: `BDUF`, adds indirection Templater doesn't need. `YAGNI`.
* **Deep modules via `dependency-cruiser` now** — deferred to Phase 3; value appears once ports exist.

## Consequences

* Positive: single source for type catalog; pure domain becomes testable and reusable 1:1 in Plugin; Templater stays usable each phase.
* Negative: temporary dual maintenance (Templater + Plugin adapters); need to verify `tp.user` basename flattening for new files.
* Neutral: `assignment_types.js` location decision is reversible; ADR will be updated.

## History

* Phase 1-2 done 2026-08-31: `assignment_types.js` + `assignment_domain.js` + `tests` `27 pass` (self-contained `package.json` inside module, guard vs `user_scripts_folder: 00-meta` scan). Repo `https://github.com/estebanmatias92/obsidian-academic-cms` `public` created and pushed.
* Hardcode `fs` symlink `assignment.md:141` `~/Projects/.../isft151-analisis-sistemas` dropped for vault-only agnostic paths (user-configurable via `SettingsPort` GUI/`data.json`, fallback `Vault` folder structure).

## Next Step

Phase 3a repo deployed, proceed `Phase 3b` Ports (vault-only) → `Phase 3c` Plugin at `.obsidian/plugins/obsidian-academic-cms`, remove `00-meta/academic-cms` when not functional on `main` green.
