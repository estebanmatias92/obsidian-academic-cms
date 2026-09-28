#!/usr/bin/env node
/**
 * help.mjs — `npm run help`: one-line description per command.
 * Details: CONTRIBUTING.md:Releases, per-script --help.
 */
console.log(`obsidian-academic-cms — tooling (details: CONTRIBUTING.md:Releases)

  npm test                                        run vitest suite (49 tests)
  npm run build                                   tsc + esbuild → main.js at repo root (what BRAT ships)
  npm run check-versions                          verify version files agree (manifest/package/versions/CHANGELOG)
  npm run release -- <v> [--push] [--notes "..."] [--dry-run]
                                                  bump + changelog + test + build + commit + tag (local only)
  npm run help                                    this list

Pushing to main alone never updates BRAT — only a pushed tag fires release.yml.`);
