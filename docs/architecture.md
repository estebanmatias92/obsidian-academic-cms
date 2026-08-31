# Architecture — `obsidian-academic-cms`

Status: Accepted (Phase 1-2 done, Phase 3 regrouped) — 2026-08-31  
Owner: academic-cms module  
Scope: `obsidian-academic-cms` (`github.com/estebanmatias92/obsidian-academic-cms` `public`) at `.obsidian/plugins/obsidian-academic-cms` ← `00-meta/academic-cms/` Strangler

## 1. Purpose

`academic-cms` manages academic content scaffolding inside the vault: assignments, topics, classes, career metadata. It currently runs as **Templater user scripts** (`templater-obsidian/data.json:14` `user_scripts_folder: 00-meta`) and will evolve incrementally into an **Obsidian Plugin** via a Strangler Fig migration — one refactor at a time.

This document is the entry point. Decisions and migration steps live in `adr/`.

## 2. Current Architecture

**Runtime:** Obsidian + Templater. Every `*.js` under `00-meta` is exposed as `tp.user.<basename>` (e.g. `career_config.js` → `tp.user.career_config()`, `shared/slugify.js` → `tp.user.slugify`, `assignments/assignment_form_modal.js` → `tp.user.assignment_form_modal`).

**Modules:**

| Module | Entry | Role |
|---|---|---|
| `assignments/` | `assignment.md` + `assignment_form_modal.js` | Create assignment scaffold (`_assets`, `deliverable`, `code/` vault folder — `fs` symlink `assignment.md:140` hard `~/Projects/.../isft151-analisis-sistemas` dropped for vault-only `Vault` API), title/filename via `assignments/assignment_domain.js` |
| `topics/` | `topic.md` | Create topic notes |
| `classes/` | `clase.md`, `lecture.md` | Lecture scaffolding |
| `career/` | `entrypoint.md`, `_course-metadata.md`, `_career-meta.md` | Career/course bootstrapping |
| `shared/` | `slugify.js`, `get_frontmatter_from_regex.js`, etc. | Cross-cutting vault helpers — agnostic `Vault` API |
| `career_config.js` | — | Central path patterns (wildcard `*systems*`) — see `ACOPLAMIENTO_CAREER_CONFIG.md` |

**Key coupling (Phase 3b target):** Templates mix **pure domain** (now `assignments/assignment_types.js`/`assignment_domain.js` isolated, `27 pass` `vitest`) with **I/O** (`tp.app.vault.*` → `VaultPort`, `document` modal `assignments/assignment_form_modal.js:245` → `obsidian.Modal`, hard `fs` symlink dropped for `SettingsPort` user-configured vault-relative path, fallback `Obsidian` folder structure).

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
      assignment_domain.ts  # buildTitle(), buildFilename(), getScaffoldDirs(), buildFolderName()
      slugify.ts     # shared/slugify.js agnostic
    ports/           # vault-only, no fs hardcode
      vault_port.ts       # createFolder, getAbstractFileByPath, read, move, getMatchedPath, getFullSystemPath (vault-relative)
      modal_port.ts       # openAssignmentForm → obsidian.Modal
      settings_port.ts    # getCodePath(): string|undefined from data.json GUI, fallback vault folder structure
      clock_port.ts       # now()
    plugin/
      main.ts        # onload: addCommand Create Assignment + vault.on('create') hook (replaces templater-obsidian/data.json:16 folder_templates), onunload
      settings.ts    # SettingsTab for optional code path (user-provided, never ~/Projects hardcode)
  tests/assignment_domain.test.js  # vitest 27, guard vs user_scripts_folder scan
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

* `assignments/` — pilot for the whole migration; other modules (`topics/`, `classes/`, `career/`) follow the same `data → pure domain → ports` path after validation.
* `shared/` — stays for truly cross-cutting helpers (`slugify`). Domain-specific catalogs stay in their module (`assignments/assignment_types.*`) to avoid a god `shared/`.

## 7. Closed Decisions (Phase 3 regrouped)

* Canonical catalog `assignments/assignment_types.js` co-located, `practico` canonical, aliases read-only — done.
* Repo `obsidian-academic-cms` public at `.obsidian/plugins/obsidian-academic-cms`, self-contained installs (no vault-root `node_modules`), `fs` symlink dropped for vault-only `Vault` API + `SettingsPort` GUI — done 2026-08-31.
* Templater dropped (`new note` via `Vault.on('create')` + Plugin command) — regrouped Phase 3c.
* Module format: `CommonJS` shim for `Templater` compat during Strangler → `ESM` `src/` for Plugin (dual build removed `fs` hardcode).

## 8. References

* `docs/ACOPLAMIENTO_CAREER_CONFIG.md` — path decoupling iteration.
* `docs/adr/001-strangler-obsidian-plugin.md` — decision + phased plan.
