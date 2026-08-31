# ADR 001 — Incremental Migration to Obsidian Plugin via Strangler Fig

* Status: Proposed
* Date: 2026-08-31
* Deciders: academic-cms owner
* Scope: `00-meta/academic-cms/` → Obsidian Plugin
* Relates to: `docs/architecture.md`, `docs/ACOPLAMIENTO_CAREER_CONFIG.md`

## Context

`academic-cms` runs as Templater user scripts (`templater-obsidian/data.json:14` `user_scripts_folder: 00-meta`). Key pain is the duplicated assignment type catalog:

* `assignments/assignment.md:10` `typeDisplayNames`
* `assignments/assignment_form_modal.js:11` `typeDisplayNames`
* `assignments/assignment_form_modal.js:47` `fieldGroups` options (near-duplicate without aliases)

Collateral coupling: `assignments/assignment.md:26` `scaffoldTemplates` vs `assignments/assignment_form_modal.js:25` `codeTypes` / `assignments/assignment_form_modal.js:27` `typeAliases` encode the same domain. Pure rules (title `assignments/assignment.md:83` ↔ `assignments/assignment_form_modal.js:530`, filename `assignments/assignment.md:84` ↔ `assignments/assignment_form_modal.js:534`) are duplicated and untestable; I/O (`tp.app.vault`, Node `fs` symlink `assignments/assignment.md:142`, DOM modal `assignments/assignment_form_modal.js:245`) is interleaved with domain.

Goal is an **Obsidian Plugin** that reuses the same scaffolding logic, migrates one refactor at a time without breaking the vault, and leaves each `main` commit green.

## Decision

Adopt **Strangler Fig, evolutionary design, YAGNI**:

1. **Now:** apply only `SRP + DRY + Module/Registry` (Type Object). Cheap, low-risk, immediately useful for Plugin.
2. **Later:** apply `DIP/Adapter/Ports & Adapters` only at I/O boundaries when the Plugin needs them. Apply `Strategy/Factory` only if a type diverges beyond the current uniform `scaffoldTemplates`/`codeTypes`.
3. **Pilot:** `assignments/` first; replicate to `topics/`, `classes/`, `career/` after validation.

A pattern is introduced only if it **reduces coupling to `tp/vault/dom`** or **cheapens the next Plugin step**.

## Plan — Phases (each is a mergeable PR)

### Phase 1 — DRY: Centralize Assignment Types (immediate)

* Create `00-meta/academic-cms/assignments/assignment_types.js` (alt `shared/assignment_config.js` — to be confirmed) exporting:
  ```js
  canonicalTypes   // 10 entries: practico ("Trabajo Práctico") is canonical
  aliasMap         // 2 entries: practica → practico, trabajo-practico → practico (read-only)
  typeDisplayNames // canonical + aliases for title lookup compat (getDisplayName resolves via aliasMap)
  typeOptions      // 10 canonical entries for UI select (no aliases)
  typeAliases      // { practico: ["practico","practica","trabajo-practico"] } scan-only, creation writes practico
  scaffoldTemplates
  codeTypes
  getDisplayName(slug) // alias-aware
  resolveType(slug)    // alias → canonical
  ```
  Note: file exposes as `tp.user.assignment_types` via basename flattening (same as `career_config.js` → `tp.user.career_config`, `shared/slugify.js` → `tp.user.slugify`). Verify `require` inside Templater sandbox before migrating.
* Refactor `assignments/assignment.md:10-39` → import from module.
* Refactor `assignments/assignment_form_modal.js:11-28` + `assignments/assignment_form_modal.js:47-58` → `options: typeOptions`, preview at `assignments/assignment_form_modal.js:523` via `getDisplayName`.
* Validation: create `practico` and `parcial` via modal (writes `practico`, never `practica`/`trabajo-practico`); verify existing legacy folder `05-trabajo-practico-*` still resolves as `practico` in `scanLastOfType` (`assignments/assignment_form_modal.js:184`); check `code/` symlink still gated by `codeTypes`; title/filename unchanged.

### Phase 2 — Extract Pure Domain (testability)

* Extract from duplicated logic: `buildTitle()`, `buildFilename()`, `getScaffoldDirs()` into `assignments/assignment_domain.js` (or co-located in `assignment_types.js` — prefer separate to keep data vs logic SRP).
* Duplicated sources: `assignments/assignment.md:83-84` and `assignments/assignment_form_modal.js:522-536`, `assignments/assignment.md:77`.
* Add characterization tests (Vitest) that import domain without `tp`; tests are the safety net for Phase 3+.
* Validation: vault creation still works + `vitest` passes.

### Phase 3 — Decouple I/O: Ports/Adapters

* Introduce ports: `VaultPort` (`createFolder`, `getAbstractFileByPath`, `read`, `move`), `FileSystemPort` (`mkdirSync`/`symlinkSync`), `ModalPort` (DOM modal `assignments/assignment_form_modal.js:245-495`).
* Refactor scanning `assignments/assignment_form_modal.js:184-243` (`scanLastOfType`, `scanLastOverall`) and scaffold `assignments/assignment.md:136-155` to depend on injected ports, not `tp.app.vault`/`fs` directly.
* Templater adapter implements ports via `tp.app.vault`/`fs`; Plugin adapter will implement via Obsidian `Vault` API.
* Validation: no behavior change; ports tested with fake in-memory vault.

### Phase 4 — Plugin Skeleton (Strangler completion)

* Init `src/` as TypeScript Plugin (`manifest.json`, `main.ts` `onload`/`onunload`, `settings.ts`).
* Share `domain` as dual build: `CommonJS` for `tp.user`, `ESM` for Plugin. Migrate `shared/slugify.js:21` into shared utils.
* Plugin command `Create Assignment` reuses `domain` + `VaultPort`; Templater `assignment.md` becomes thin caller or is deprecated via `templater-obsidian/data.json:16` `folder_templates`.
* Validation: Plugin dev vault creates identical structure to Templater; rollback path = keep Templater until Plugin `1.0`.

## Alternatives Considered

* **Big Bang rewrite as Plugin** — rejected: blocks vault usage, high risk, no incremental validation.
* **Full SOLID/GoF upfront** (`Factory/Strategy` for 10 canonical types) — rejected: `BDUF`, adds indirection Templater doesn't need. `YAGNI`.
* **Deep modules via `dependency-cruiser` now** — deferred to Phase 3; value appears once ports exist.

## Consequences

* Positive: single source for type catalog; pure domain becomes testable and reusable 1:1 in Plugin; Templater stays usable each phase.
* Negative: temporary dual maintenance (Templater + Plugin adapters); need to verify `tp.user` basename flattening for new files.
* Neutral: `assignment_types.js` location decision is reversible; ADR will be updated.

## Next Step

Await confirmation before executing Phase 1. On approval: create `assignments/assignment_types.js` → migrate `assignment.md` → migrate `assignment_form_modal.js` as three small commits with manual vault smoke test.

* Status update after Phase 1: mark this ADR as `Accepted` and record actual validation results.
