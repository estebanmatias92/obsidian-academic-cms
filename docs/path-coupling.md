# Path Coupling — Vault Structure (Historical, Superseded)

> **Status 2026-09-01 — Superseded in plugin `0.2.0`.** The wildcard `*systems*` pattern (`career_config.js`) is no longer used. The plugin resolves paths via `src/plugin/main.ts:78` `findSubjectPathFromPath()` (walk up to `subjects/`) + `src/plugin/main.ts:66` `matchPathPattern()` fallback, and reads `_course.md`/`_career.md` via `VaultPort`. This doc is kept as historical context (translated from Spanish `ACOPLAMIENTO_CAREER_CONFIG.md`). For current behavior see `docs/architecture.md` + `docs/01-discovery/PRD.md`.

Original date: 2026-07-25

## Problem

Templater templates in `00-meta/academic-cms/` needed to locate two key files:

- `_career.md` — career metadata (at project root)
- `_course.md` — subject metadata (inside each `subjects/<subject>/`)

Originally they used hardcoded wildcard patterns combining the project name (`prj-tecnicatura-superior-sistemas`) and directory structure (`year/01/<subject>/`). The refactor `year/NN/` → `subjects/` broke these patterns.

## Iteration 1 (executed)

Created `00-meta/academic-cms/career_config.js` as single source of patterns:

```js
// career_config.js (version at the time)
module.exports = function () {
  return {
    CAREER_DIR_PATTERN:  '/*projects/*systems*/',
    COURSE_DIR_PATTERN:  '/*projects/*systems*/subjects/*/',
    COURSE_PATH_PATTERN:  '*/*systems*/subjects/*/',
  };
};
```

All 4 templates consumed it via `tp.user.career_config()`.

**Remaining problem:** wildcard `*systems*` still coupled to project name (`prj-systems-analyst`). Renaming breaks it again.

## Iteration 2 (proposed, then superseded by plugin)

Eliminate wildcard patterns entirely using native Obsidian API.

### Replacement of `CAREER_DIR_PATTERN`

```js
// Before:
const career = tp.user.get_frontmatter_from_regex(tp, cfg.CAREER_DIR_PATTERN, '_career.md');

// After (plugin equivalent):
const careerFile = app.vault.getFiles().find(f => f.name === '_career.md');
if (!careerFile) throw new Error('_career.md not found in vault');
const careerContent = await app.vault.read(careerFile);
const career = parseFrontmatter(careerContent);
```

**Rationale:** `_career.md` is unique in the vault by design (template `_career-meta.md` always renames to `_career`). No pattern needed.

### Replacement of `COURSE_DIR_PATTERN` and `COURSE_PATH_PATTERN`

```js
// Before:
const course = tp.user.get_frontmatter_from_regex(tp, cfg.COURSE_DIR_PATTERN, '_course.md');
const coursePath = tp.user.get_matched_path(cfg.COURSE_PATH_PATTERN);

// After (what the plugin now does — src/plugin/main.ts:78):
const activePath = tp.file.folder(true);
const segments = activePath.split('/');
const idx = segments.indexOf('subjects');
if (idx === -1) throw new Error('Not inside a subject');
const courseDir  = segments.slice(0, idx + 2).join('/');
const coursePath = courseDir;
// read _course.md from courseDir and parse frontmatter
```

**Rationale:** from the active file walk up to `subjects/` and derive the subject folder. Only assumption left is the directory name `subjects/`.

### Files affected

| File | Patterns to remove |
|---|---|
| `career_config.js` | Whole file (deleted) |
| `assignments/assignment.md` | 3 `cfg.*` refs |
| `topics/topic.md` | 2 refs |
| `career/entrypoint.md` | 2 refs |
| `career/_course-metadata.md` | 1 ref |

### Benefits

- Zero path config
- Immune to project renames, `04-projects/` moves, etc.
- Only depends on `subjects/<name>/`
- Uses native Obsidian API only

### Risks / Notes

1. **Uniqueness of `_course.md`:** `find()` would pick first match if duplicates. Template `_course-metadata.md` renames to `_course` to guarantee uniqueness.
2. **`subjects/` dir:** only remaining assumption. Could be removed by walking up to `_course.md` but adds complexity.
3. **Files outside `subjects/`:** correctly fails with "Not inside a subject".
4. **Dataview:** `tp.app.plugins.plugins.dataview.api` evaluated, no advantage over `app.vault.getFiles()`.

### Next steps (historical)

1. Implement the 3 replacements in 4 templates
2. Delete `career_config.js`
3. Test each template from Obsidian inside `subjects/<subject>/`

## Current resolution (2026-09-01)

Resolved by plugin `0.2.0`: `src/plugin/main.ts:78` + `src/plugin/main.ts:66`, no `career_config.js` needed. Legacy `ACOPLAMIENTO_CAREER_CONFIG.md` file kept as `ACOPLAMIENTO_CAREER_CONFIG.md` on disk for reference, but this `path-coupling.md` is the English canonical now.
