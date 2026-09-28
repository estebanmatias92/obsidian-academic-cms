#!/usr/bin/env node
/**
 * help.mjs — `npm run help`: what are these scripts and which question does each answer?
 *
 * Three questions, three tools — each blind to the other two.
 * (Canonical model: CONTRIBUTING.md:Releases. Keep the wording in sync.)
 */
console.log(`obsidian-academic-cms — tooling

Three questions, three tools — each blind to the other two.
Pushing to main alone never updates BRAT; only a pushed tag does.

  1. Are the files consistent? ......... npm run check-versions
     Do all references agree on the current version?
     (manifest.json / package.json / versions.json / CHANGELOG.md)
     Help: npm run check-versions -- --help

  2. Is there unshipped work? ........... automatic (unreleased.yml)
     Warns in CI when main is 1+ commits ahead of the latest tag
     with plugin-relevant changes. Warn-only — batching is legal.

  3. Did it leave my machine? ........... npm run release -- <version> [--push]
     Bump + changelog + test + build + commit + tag, locally only —
     then: git push origin main <version> (or pass --push).
     Help: npm run release -- --help

Everyday commands:
  npm test            vitest (49 tests)
  npm run build       tsc + esbuild → main.js at repo root (what BRAT ships)
  npm run check-versions
  npm run release -- <version> [--push] [--notes "text"] [--dry-run]

Docs: CONTRIBUTING.md (Releases + assignment template source of truth).`);
