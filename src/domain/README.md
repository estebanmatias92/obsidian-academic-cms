# domain

Pure domain, zero `tp`/`app` deps, shared by Templater shim and Plugin.

TS modules (Phase 3b done):

- `assignment_types.ts` — canonicalTypes (10, `practico` canonical), aliasMap (2 read-only), scaffoldTemplates, codeTypes, resolveType/getDisplayName
- `assignment_domain.ts` — buildTitle, buildFilename, buildFolderName, buildBasePath, getScaffoldDirs, normalizeUnit/Number
- `slugify.ts`

Legacy JS (`assignments/assignment_types.js` + `assignment_domain.js` + `shared/slugify.js`) stays: `tests/assignment_domain.test.js` requires the first two, and the `assignment_form_modal.js` Templater shim still uses them. The legacy `assignments/assignment.md` template itself was removed — the plugin generates frontmatter/body from `src/use_cases/create_assignment_service.ts` (`buildFrontmatter`/`buildBody`).