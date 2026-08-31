# domain

Pure domain, zero `tp`/`app` deps, shared by Templater shim and Plugin.

TS modules (Phase 3b done):

- `assignment_types.ts` — canonicalTypes (10, `practico` canonical), aliasMap (2 read-only), scaffoldTemplates, codeTypes, resolveType/getDisplayName
- `assignment_domain.ts` — buildTitle, buildFilename, buildFolderName, buildBasePath, getScaffoldDirs, normalizeUnit/Number
- `slugify.ts`

Legacy JS (`assignments/assignment_types.js` + `assignment_domain.js` + `shared/slugify.js`) stays for Templater until Phase 3c removes the shim.