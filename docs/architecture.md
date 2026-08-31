# Architecture — `00-meta/academic-cms`

Status: Draft — 2026-08-31  
Owner: academic-cms module  
Scope: `00-meta/academic-cms/` (Templater scripts → Obsidian Plugin)

## 1. Purpose

`academic-cms` manages academic content scaffolding inside the vault: assignments, topics, classes, career metadata. It currently runs as **Templater user scripts** (`templater-obsidian/data.json:14` `user_scripts_folder: 00-meta`) and will evolve incrementally into an **Obsidian Plugin** via a Strangler Fig migration — one refactor at a time.

This document is the entry point. Decisions and migration steps live in `adr/`.

## 2. Current Architecture

**Runtime:** Obsidian + Templater. Every `*.js` under `00-meta` is exposed as `tp.user.<basename>` (e.g. `career_config.js` → `tp.user.career_config()`, `shared/slugify.js` → `tp.user.slugify`, `assignments/assignment_form_modal.js` → `tp.user.assignment_form_modal`).

**Modules:**

| Module | Entry | Role |
|---|---|---|
| `assignments/` | `assignment.md` + `assignment_form_modal.js` | Create assignment scaffold (`_assets`, `deliverable`, `code/` symlink), title/filename generation |
| `topics/` | `topic.md` | Create topic notes |
| `classes/` | `clase.md`, `lecture.md` | Lecture scaffolding |
| `career/` | `entrypoint.md`, `_course-metadata.md`, `_career-meta.md` | Career/course bootstrapping |
| `shared/` | `slugify.js`, `get_frontmatter_from_regex.js`, etc. | Cross-cutting vault helpers |
| `career_config.js` | — | Central path patterns (wildcard `*systems*`) — see `ACOPLAMIENTO_CAREER_CONFIG.md` |

**Key coupling:** Templates mix **pure domain** (name mapping, title/filename rules) with **I/O** (`tp.app.vault.*`, Node `fs` symlink `assignments/assignment.md:142`, direct `document` modal `assignments/assignment_form_modal.js:245`).

## 3. Problems Driving Evolution

1. **Duplication — assignment type catalog:** `typeDisplayNames` (10 canonical types: `practico` = "Trabajo Práctico", plus 2 read-only aliases `practica`/`trabajo-practico` → `practico` for scan/back-compat) is duplicated at `assignments/assignment.md:10` and `assignments/assignment_form_modal.js:11`, with a third near-duplicate `fieldGroups` options at `assignments/assignment_form_modal.js:47` (canonical 10 only, no aliases). Adding a canonical type requires 3 edits; drift is silent. Alias handling is read-only — `assignments/assignment_form_modal.js:28` `typeAliases` resolves legacy folders but creation always writes `practico` (convention).
2. **Coupled I/O:** No `VaultPort` abstraction — hard to test and to reuse outside Templater.
3. **No types/tests:** Pure logic (title `assignments/assignment.md:83` ↔ `assignments/assignment_form_modal.js:530`, filename `assignments/assignment.md:84` ↔ `assignments/assignment_form_modal.js:534`) has no characterization tests.
4. **Path fragility:** `career_config.js:1` wildcard patterns break on project rename — documented in `ACOPLAMIENTO_CAREER_CONFIG.md`.

## 4. Target Architecture (Plugin)

```
src/
  domain/          # pure, zero `tp`/`app` deps — shared by Templater + Plugin
    assignment_types.ts   # canonical catalog (Type Object / Registry)
    assignment_domain.ts  # buildTitle(), buildFilename(), getScaffoldDirs()
    slugify.ts
  ports/           # interfaces
    vault_port.ts
    filesystem_port.ts
    modal_port.ts
  adapters/
    templater/     # implements ports via tp.app.vault / fs / document
    obsidian/      # implements ports via Obsidian Vault API
  plugin/
    main.ts        # onload/onunload, commands
    settings.ts
```

Templater templates become thin callers that delegate to `domain` via adapters. Plugin `Create Assignment` command reuses the same `domain`. See `adr/001-strangler-obsidian-plugin.md` for the migration sequence.

## 5. Principles

* **Strangler Fig, one refactor at a time** — each phase is a mergeable PR that leaves `main` green and the vault usable.
* **YAGNI / Last Responsible Moment** — no `Factory/Strategy/DIP` until the I/O boundary demands it. Apply a pattern only if it `reduces coupling to tp/vault/dom` or `cheapens the next Plugin step`.
* **Now:** `SRP + DRY + Module/Registry` (cheap). **Later:** `DIP/Adapter` at ports (Phase 3), `Strategy` only if a type diverges beyond `scaffoldTemplates`/`codeTypes`.
* **Pure first:** extract pure domain before abstracting I/O — pure code is immediately reusable in Plugin and testable without Obsidian.

## 6. Module Map & Ownership

* `assignments/` — pilot for the whole migration; other modules (`topics/`, `classes/`, `career/`) follow the same `data → pure domain → ports` path after validation.
* `shared/` — stays for truly cross-cutting helpers (`slugify`). Domain-specific catalogs stay in their module (`assignments/assignment_types.*`) to avoid a god `shared/`.

## 7. Open Decisions

* Location of canonical catalog: `assignments/assignment_types.js` (co-located, preferred) vs `shared/assignment_config.js`.
* Coexistence: Plugin runs alongside Templater during transition (recommended) vs immediate replacement.
* Module format: `CommonJS module.exports` (Templater compat) vs dual `ESM` build.

## 8. References

* `docs/ACOPLAMIENTO_CAREER_CONFIG.md` — path decoupling iteration.
* `docs/adr/001-strangler-obsidian-plugin.md` — decision + phased plan.
