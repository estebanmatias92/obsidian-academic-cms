#!/usr/bin/env node
/**
 * check-versions.mjs — fail fast when release files drift out of sync.
 *
 * Checks:
 *   1. manifest.json version === package.json version
 *   2. versions.json contains that version, mapped to manifest.json minAppVersion
 *   3. CHANGELOG.md has a `## <version>` heading
 *   4. (warning only) package-lock.json root version matches
 *
 * Usage: npm run check-versions
 * Testability: REPO_ROOT env overrides the repo root (defaults to script's parent parent).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.REPO_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`check-versions — are the files consistent?

Verifies every reference agrees on the current version (no writes):
  1. manifest.json version === package.json version
  2. versions.json contains that version, mapped to manifest.json minAppVersion
  3. CHANGELOG.md has a \`## <version>\` heading
  4. (warning only) package-lock.json root version matches

This answers consistency only — it is blind to whether you should have
released by now (see unreleased.yml) and to whether the tag was pushed
(see scripts/release.mjs --help). Full model: CONTRIBUTING.md:Releases.

Usage: npm run check-versions`);
  process.exit(0);
}

const errors = [];
const warnings = [];

function readJson(name) {
  const path = join(ROOT, name);
  if (!existsSync(path)) {
    errors.push(`${name}: file missing`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${name}: invalid JSON (${e.message})`);
    return null;
  }
}

const manifest = readJson('manifest.json');
const pkg = readJson('package.json');
const versions = readJson('versions.json');

const manifestVersion = manifest?.version;
const pkgVersion = pkg?.version;

if (manifestVersion && pkgVersion && manifestVersion !== pkgVersion) {
  errors.push(`version drift: manifest.json (${manifestVersion}) !== package.json (${pkgVersion})`);
}

if (manifestVersion && versions) {
  if (!(manifestVersion in versions)) {
    errors.push(`versions.json: missing key "${manifestVersion}" (add "${manifestVersion}": "${manifest?.minAppVersion ?? '1.5.0'}")`);
  } else if (manifest?.minAppVersion && versions[manifestVersion] !== manifest.minAppVersion) {
    errors.push(
      `versions.json: "${manifestVersion}" maps to ${versions[manifestVersion]} but manifest minAppVersion is ${manifest.minAppVersion}`
    );
  }
}

const changelogPath = join(ROOT, 'CHANGELOG.md');
if (manifestVersion) {
  if (!existsSync(changelogPath)) {
    errors.push('CHANGELOG.md: file missing');
  } else {
    const changelog = readFileSync(changelogPath, 'utf8');
    if (!changelog.includes(`## ${manifestVersion}`)) {
      errors.push(`CHANGELOG.md: no "## ${manifestVersion}" heading`);
    }
  }
}

const lock = readJson('package-lock.json');
if (lock && pkgVersion && lock.version !== pkgVersion) {
  warnings.push(`package-lock.json version (${lock.version}) !== package.json (${pkgVersion}) — run npm install --package-lock-only`);
}

for (const w of warnings) console.warn(`warning: ${w}`);

if (errors.length > 0) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\ncheck-versions: FAILED (${errors.length} problem${errors.length === 1 ? '' : 's'}) — run npm run release <version> to re-sync`);
  process.exit(1);
}

console.log(`check-versions: OK (version ${manifestVersion})`);
