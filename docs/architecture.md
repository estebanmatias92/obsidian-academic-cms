# Architecture — `obsidian-academic-cms`

Status: Accepted — Phase 1, 2, 3a, 3b, 3c done, assignment-only MVP in public testing (BRAT + GitHub Release) — see `CHANGELOG.md` for current version
Owner: academic-cms module  
Scope: `obsidian-academic-cms` (`github.com/estebanmatias92/obsidian-academic-cms` `public`) at `.obsidian/plugins/obsidian-academic-cms` ← `00-meta/academic-cms/` Strangler

## 1. Purpose

`academic-cms` manages academic content scaffolding inside the vault. It started as **Templater user scripts** (`templater-obsidian/data.json:14` `user_scripts_folder: 00-meta`) and migrated to an **Obsidian Plugin** via Strangler Fig. Assignments are plugin-only (legacy `assignments/assignment.md` removed — the plugin never read it); `topics`/`classes`/`career` remain Templater until post-MVP (see `docs/01-discovery/PRD.md`, `docs/02-requirements/backlog/US-010.md`).

This document is the entry point. Decisions and migration steps live in `adr/`.

## 2. Current Architecture

**Runtime:** Obsidian Plugin (assignment-only, `topics`/`classes`/`career` still Templater — deferred post-MVP). Legacy: every `*.js` under `00-meta` was exposed as `tp.user.<basename>` (`career_config.js` → `tp.user.career_config()`, `shared/slugify.js` → `tp.user.slugify`, `assignments/assignment_form_modal.js` → `tp.user.assignment_form_modal`) — now superseded by `src/` Hexagonal.

**Modules:**

| Module | Status | Entry / Role |
|---|---|---|
| `assignments/` | **Plugin — done** | `src/use_cases/create_assignment_service.ts:41` scaffold (`_assets`, `deliverable`, `code/` vault folder *or* symlink `code → external <subject>/<folder>` via `FileSystemPort`), title/filename via `src/domain/assignment_domain.ts`. Frontmatter/body source of truth: `buildFrontmatter()`/`buildBody()` in the service — legacy Templater `assignment.md` removed |
| `topics/` | Deferred | `topic.md` Templater — see `docs/02-requirements/backlog/US-010.md` |
| `classes/` | Deferred | `clase.md`, `lecture.md` Templater — see `US-011` |
| `career/` | Deferred | `entrypoint.md`, `_course-metadata.md`, `_career-meta.md` — see `US-012` |
| `shared/` | Done | `src/domain/slugify.ts` agnostic helper |
| `career_config.js` | Superseded | Wildcard `*systems*` — see `docs/path-coupling.md` (was `ACOPLAMIENTO_CAREER_CONFIG.md`) |

**Key decoupling (Phase 3b/c done):** Pure domain (`src/domain/assignment_types.ts`/`assignment_domain.ts`, `49 pass` `vitest`) isolated from I/O (`VaultPort`/`FileSystemPort` → `ObsidianVaultAdapter`, `ModalPort` → `obsidian.Modal`, external `code` via `SettingsPort` `externalCodeBasePath` ↔ `FileSystemPort.symlink` with vault fallback `src/use_cases/create_assignment_service.ts:99`).

## 3. Problems Driving Evolution

1. **Duplication — assignment type catalog:** `typeDisplayNames` (10 canonical types: `practico` = "Trabajo Práctico", plus 2 read-only aliases `practica`/`trabajo-practico` → `practico` for scan/back-compat) is duplicated at `assignments/assignment.md:10` and `assignments/assignment_form_modal.js:11`, with a third near-duplicate `fieldGroups` options at `assignments/assignment_form_modal.js:47` (canonical 10 only, no aliases). Adding a canonical type requires 3 edits; drift is silent. Alias handling is read-only — `assignments/assignment_form_modal.js:28` `typeAliases` resolves legacy folders but creation always writes `practico` (convention).
2. **Coupled I/O:** No `VaultPort` abstraction — hard to test and to reuse outside Templater.
3. **No types/tests:** Pure logic (title `assignments/assignment.md:83` ↔ `assignments/assignment_form_modal.js:530`, filename `assignments/assignment.md:84` ↔ `assignments/assignment_form_modal.js:534`) has no characterization tests.
4. **Path fragility:** `career_config.js:1` wildcard patterns break on project rename — documented in `ACOPLAMIENTO_CAREER_CONFIG.md`.

## 4. Target Architecture (Plugin `obsidian-academic-cms` at `.obsidian/plugins/obsidian-academic-cms`)

```
obsidian-academic-cms/           # own repo github.com/estebanmatias92/obsidian-academic-cms public, self-contained installs
  src/
    domain/          # pure, zero tp/app deps — already JS, migrate to TS
      assignment_types.ts   # canonicalTypes 10 practico, aliasMap 2, scaffoldTemplates, codeTypes
      assignment_domain.ts  # buildTitle(), buildFilename(), getScaffoldDirs(), buildFolderName(), buildExternalCodePath()
      slugify.ts     # shared/slugify.js agnostic
    ports/           # ports & adapters
      vault_port.ts       # createFolder, getAbstractFileByPath, read, move, getVaultBasePath (vault-relative)
      modal_port.ts       # openAssignmentForm → obsidian.Modal
      settings_port.ts    # getExternalCodeBasePath()/getCodeFolderPath() from data.json GUI, vault fallback
      file_system_port.ts # createDir/symlink/exists/isDesktop (Node fs, desktop only)
      clock_port.ts       # now()
    use_cases/       # services over ports (Phase 3c done)
      assignment_number_service.ts  # scanLastOfType/scanLastOverall → VaultPort, alias-aware; 12 fake-vault tests
      create_assignment_service.ts  # scaffold dirs + external symlink <subject>/<folder> → vault code, frontmatter; 7 fake-port tests
    adapters/obsidian/  # VaultPort/ModalPort/SettingsPort/FileSystemPort/ClockPort → Obsidian API
      vault_adapter.ts, modal_adapter.ts, settings_adapter.ts, file_system_adapter.ts, clock_adapter.ts
    plugin/
      main.ts        # onload: checkCallback Create Assignment + file-menu New Assignment; context via getContextForPath; prefill via AssignmentNumberService
      settings.ts    # SettingsTab: externalCodeBasePath (absolute) + codeFolderPath (vault-relative)
  tests/  # vitest 46, guard vs user_scripts_folder scan
  package.json, vitest.config.js, .gitignore (node_modules/, dist/, coverage/)
  dist/main.js, manifest.json → deployed to conocimiento/.obsidian/plugins/obsidian-academic-cms
```

`00-meta/academic-cms` removed when not functional (your `remove academic-cms from 00-meta when is no longer functional`); `Templater` dependency (`almost just new note hook`) dropped — hook via `Obsidian API` directly. See `adr/001` regrouped Phase 3.

## 5. Principles

* **Strangler Fig, one refactor at a time** — each phase is a mergeable PR that leaves `main` green and the vault usable.
* **YAGNI / Last Responsible Moment** — no `Factory/Strategy/DIP` until the I/O boundary demands it. Apply a pattern only if it `reduces coupling to tp/vault/dom` or `cheapens the next Plugin step`.
* **Now:** `SRP + DRY + Module/Registry` (cheap). **Later:** `DIP/Adapter` at ports (Phase 3), `Strategy` only if a type diverges beyond `scaffoldTemplates`/`codeTypes`.
* **Pure first:** extract pure domain before abstracting I/O — pure code is immediately reusable in Plugin and testable without Obsidian.

## 6. Module Map & Ownership

* `assignments/` — pilot, done `0.2.0` via `src/` Hexagonal; model for later modules.
* `topics/`/`classes/`/`career/` — deferred post-MVP (`docs/02-requirements/backlog/US-010.md`/`US-011`/`US-012`) — follow same `data → pure domain → ports` path when scheduled.
* `shared/` — `src/domain/slugify.ts` stays for cross-cutting helpers. Domain catalogs stay in module (`src/domain/assignment_types.ts`) to avoid a god `shared/`.

## 7. Closed Decisions (Phase 3 regrouped, 0.2.0 public testing)

* Canonical catalog `src/domain/assignment_types.ts` co-located, `practico` canonical, aliases read-only — done.
* Repo `obsidian-academic-cms` public at `.obsidian/plugins/obsidian-academic-cms`, self-contained installs, BRAT `main.js` at root (`esbuild.config.mjs:23`), `fs` symlink via `FileSystemPort` + `externalCodeBasePath` absolute desktop symlink with vault fallback — done 2026-09-01.
* Templater dropped for assignments (`New Assignment` via `file-menu` `30-assignments`/`40-exams` + `checkCallback` `Create Assignment`); `Vault.on('create')` removed — done 2026-09-01; legacy `assignments/assignment.md` deleted and its `career/entrypoint.md` routes removed (a blank note in `30-assignments/`/`40-exams/` now fails closed with "No matching template found"). `topics`/`classes`/`career` remain Templater until post-MVP.
* Module format: `CommonJS` shim for Templater compat during Strangler → `ESM` `src/` for Plugin; assignment-only MVP ships via BRAT + GitHub Release zip.

## 7b. Public Testing Scope (0.2.x)

* MVP: `US-001..004` done (`docs/02-requirements/backlog/`), deferred `US-010..012`. See `docs/01-discovery/PRD.md:Scope`, `CHANGELOG.md`, `docs/USER_GUIDE.md`.
* Install: BRAT + manual zip, `versions.json` maps each release → `minAppVersion` (see `CONTRIBUTING.md:Releases`).
* CI: `.github/workflows/ci.yml` (incl. `npm run check-versions` sync guard) + `release.yml` on tag + `unreleased.yml` reminder when `main` moves ahead of the latest tag.

## 8. References

* `docs/path-coupling.md` (was `ACOPLAMIENTO_CAREER_CONFIG.md`) — path decoupling iteration, superseded.
* `docs/adr/001-strangler-obsidian-plugin.md` — decision + phased plan.
* `docs/01-discovery/PRD.md`, `docs/02-requirements/backlog/`, `docs/USER_GUIDE.md`, `CHANGELOG.md`.
