# US-004 — Settings GUI (Done)

Status: Done — 0.2.0 (2026-09-01)
MoSCoW: Must

## Narrative

As a user I want to configure code locations without editing JSON, via Obsidian Settings UI.

## Acceptance Criteria

- [x] `src/plugin/main.ts:19` loads settings `loadSettings()` + `addSettingTab(new AcademicCMSSettingTab)`.
- [x] `src/plugin/settings.ts` renders two fields: `External code base path` (placeholder `/home/user/Projects/isft151-...`, absolute, required for symlink) and `Code folder path` (placeholder `50-code`, vault-relative).
- [x] `src/adapters/obsidian/settings_adapter.ts` implements `SettingsPort.getExternalCodeBasePath()` / `getCodeFolderPath()` reading `data.json`.
- [x] Empty external → vault-only scaffold; invalid absolute → no symlink, vault fallback (validated manually 2026-09-01).
- [x] Persisted via `Plugin.saveData/loadData` and reloaded on toggle.

## Gherkin

```gherkin
Feature: Settings
  Scenario: Configure external path
    When I set "External code base path" to "/home/matt/Projects/isft151"
    And I create an assignment
    Then code is symlinked per US-003

  Scenario: Vault-relative code folder
    When I set "Code folder path" to "50-code" and leave external empty
    Then code folder is created at "50-code/<folder>-code"
```

## Trace

- `src/plugin/settings.ts`, `src/plugin/main.ts:58`, `src/adapters/obsidian/settings_adapter.ts`, `src/ports/settings_port.ts:125`
