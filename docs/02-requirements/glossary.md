# Glossary — obsidian-academic-cms

| Term | Definition | Source |
|------|------------|--------|
| Assignment | Folder `YYYY-MM-DD-<type>-<topic>` under `30-assignments` or `40-exams` containing `_assets`, `deliverable`, `code` + markdown file `YYYY-MM-DD-<student>-<code>-<type>-<n>-<topic>.md` | `src/domain/assignment_domain.ts` `buildFolderName`/`buildFilename` |
| Subject | Directory `subjects/<name>/` containing `_course.md`; `coursePath` is its vault-relative path | `src/plugin/main.ts:78` `findSubjectPathFromPath` |
| Course | Metadata from `subjects/<x>/_course.md` frontmatter `{name, code}` | `src/plugin/main.ts:94` |
| Career | Metadata from `<career>/_career.md` frontmatter `{student}` | `src/plugin/main.ts:101` |
| AssignDir | Either `30-assignments` or `40-exams`, inferred from path containing `/40-exams/` | `src/plugin/main.ts:91` |
| Code symlink | On desktop, `vault/<base>/code` → `externalBase/<subject>/<folder>` via `FileSystemPort.symlink` | `src/use_cases/create_assignment_service.ts:88` |
| Canonical type | One of 10 types (`practico` canonical); 2 aliases `practica`/`trabajo-practico` → `practico` read-only for scan | `src/domain/assignment_types.ts` |
| VaultPort | Port `createFolder/getAbstractFileByPath/read/move/getVaultBasePath/createFile` | `src/ports/vault_port.ts:863` |
| FileSystemPort | Port `createDir/symlink/isDesktop` (Node `fs` on desktop) | `src/ports/file_system_port.ts:436` |
| SettingsPort | Port `getExternalCodeBasePath/getCodeFolderPath` from `data.json` | `src/ports/settings_port.ts:125` |
