# US-002 — File-menu New Assignment + Context Detection (Done)

Status: Done — 0.2.0 (2026-09-01)
MoSCoW: Must

## Narrative

As a student browsing `30-assignments` or `40-exams` I want a context menu "New Assignment" on the folder and a command palette "Create Assignment" from any file inside the subject.

## Acceptance Criteria

- [x] `src/plugin/main.ts:37` registers `file-menu` on `TFolder`; shows `New Assignment` only when `src/plugin/main.ts:86` `getContextFromPath()` returns context (pattern `*/*systems*/subjects/*/` or `findSubjectPathFromPath` `subjects/` heuristic).
- [x] `src/plugin/main.ts:25` `Create Assignment` command via `checkCallback` — enabled only inside a subject, disabled elsewhere.
- [x] `assignDir` inferred as `40-exams` if path contains `/40-exams/`, else `30-assignments` (`src/plugin/main.ts:91`).
- [x] Missing `_course.md`/`_career.md` → `Notice` at `src/plugin/main.ts:139` + `src/plugin/main.ts:120` (no crash).
- [x] Works from active file or from folder path (`openAssignmentModalForPath` / `openAssignmentModalForContext`).

## Gherkin

```gherkin
Feature: Context detection
  Scenario: Right-click on assignments folder inside subject
    Given folder "subjects/analisis/30-assignments" exists
    When I right-click the folder
    Then menu shows "New Assignment"
    And assignDir is "30-assignments"

  Scenario: Command outside subject
    Given active file "00-meta/notes.md"
    When I run "Create Assignment"
    Then command is disabled and notice "No se detectó una materia" is shown

  Scenario: Exams folder
    Given folder "subjects/analisis/40-exams"
    When I right-click it
    Then assignDir is "40-exams"
```

## Trace

- `src/plugin/main.ts:66` `matchPathPattern`, `src/plugin/main.ts:78` `findSubjectPathFromPath`, `src/plugin/main.ts:86` `getContextFromPath`
- Supersedes wildcard `career_config.js` — see `docs/path-coupling.md`.
