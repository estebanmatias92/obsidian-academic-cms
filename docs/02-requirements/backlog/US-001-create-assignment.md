# US-001 — Create Assignment (MVP, Done)

Status: Done — 0.2.0 (2026-09-01)
MoSCoW: Must
Labels: `enhancement` (closed)

## Narrative

As a student inside `subjects/<subject>/` I want to scaffold an assignment folder + markdown file with frontmatter so that I don't manually create `_assets`/`deliverable`/`code`.

## Acceptance Criteria

- [x] `src/use_cases/create_assignment_service.ts:41` `execute()` builds `title` via `src/domain/assignment_domain.ts:buildTitle`, `filename` via `buildFilename`, `folderName` via `buildFolderName`, `basePath` via `buildBasePath`.
- [x] Scaffolds `basePath/{_assets,deliverable,code?}` (`getScaffoldDirs`); `code` gated by `codeTypes` or `include_code`.
- [x] Writes file `basePath/<filename>.md` with frontmatter (`buildFrontmatter`) + body (`buildBody`) then opens it (`src/plugin/main.ts:186`).
- [x] `assignment_number` auto-incremented via `src/use_cases/assignment_number_service.ts` (`scanLastOfType` alias-aware `practico` canonical, 2 aliases).
- [x] Unit tests: `tests/assignment_domain.test.js` 27 pass, `tests/create_assignment_service.test.ts` 7 pass, `tests/assignment_number_service.test.ts` 12 pass.

## Gherkin

```gherkin
Feature: Create assignment scaffold
  Background:
    Given course "Analisis de Sistemas" at "04-projects/systems/subjects/analisis"
    And career student "esteban"
    And assignDir "30-assignments"

  Scenario: Create TP with code (practico canonical)
    When I submit type "practico" unit "3" topic "Herencia" due "2026-09-08"
    Then folder "2026-09-01-practico-herencia" is created under "30-assignments"
    And subfolders "_assets", "deliverable", "code" exist (or symlink if external path set)
    And file "2026-09-01-esteban-anasis-practico-3-herencia.md" contains frontmatter title and topic slug

  Scenario: Legacy alias scan
    Given existing folder "2024-08-10-practica-polimorfismo"
    When I scan last of type "practico"
    Then alias "practica" resolves to "practico" (read-only)
```

## Trace

- Domain: `src/domain/assignment_types.ts`, `src/domain/assignment_domain.ts`, `src/domain/slugify.ts`
- Ports: `src/ports/vault_port.ts:863`, `src/ports/modal_port.ts:854`, `src/ports/settings_port.ts:125`
- Adapters: `src/adapters/obsidian/vault_adapter.ts`, `src/adapters/obsidian/modal_adapter.ts`
