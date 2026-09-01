# US-003 — External Code Symlink + Settings (Done)

Status: Done — 0.2.0 (2026-09-01)
MoSCoW: Must

## Narrative

As a student I want `code/` to optionally live outside the vault (absolute host path) and be symlinked, so large codebases stay out of Obsidian sync but remain linked.

## Acceptance Criteria

- [x] Settings `External code base path` (absolute) + `Code folder path` (vault-relative) via `src/plugin/settings.ts` + `src/ports/settings_port.ts:125`.
- [x] If `externalCodeBase` set and `src/ports/file_system_port.ts:436` `isDesktop()` true: `src/use_cases/create_assignment_service.ts:88` creates `externalBase/<subject>/<folderName>` via `createDir` and symlinks `vaultBase/basePath/code → externalPath`.
- [x] If `externalCodeBase` set but not on desktop: warn + fallback `vaultPort.createFolder(basePath/code)` (`src/use_cases/create_assignment_service.ts:99`).
- [x] If `codeFolderPath` set without external: creates `vaultCodePath/<folder>-code` (`src/use_cases/create_assignment_service.ts:103`).
- [x] Subject derived from `coursePath.split('/').pop()` (`src/use_cases/create_assignment_service.ts:78`); no `~/` hardcode.
- [x] Tests with `FakeFileSystemPort` in `tests/create_assignment_service.test.ts` 7 pass.

## Gherkin

```gherkin
Feature: External code symlink
  Scenario: Desktop with external path
    Given settings externalCodeBase "/home/matt/Projects/isft151"
    And subject "analisis" and folder "2026-09-01-practico-herencia"
    When I create assignment with include_code true
    Then external dir "/home/matt/Projects/isft151/analisis/2026-09-01-practico-herencia" is created
    And vault path "subjects/analisis/30-assignments/2026-09-01-practico-herencia/code" is a symlink to external

  Scenario: Mobile fallback
    Given externalCodeBase is set but isDesktop false
    When I create assignment
    Then vault folder "code" is created and a warning is logged
```

## Trace

- `src/use_cases/create_assignment_service.ts:75`, `src/adapters/obsidian/file_system_adapter.ts`, `src/ports/file_system_port.ts:436`, `src/domain/assignment_domain.ts:buildExternalCodePath`
