#!/usr/bin/env node
/**
 * release.mjs — cut a release in one atomic, verified step.
 *
 * Usage:
 *   npm run release -- <version> [--push] [--notes "text"] [--dry-run]
 *
 * What it does:
 *   1. Validates semver, clean tree, tag does not exist yet.
 *   2. Syncs version into manifest.json + package.json, adds
 *      versions.json["<version>"] = minAppVersion, syncs package-lock.
 *   3. Prepends a CHANGELOG.md entry (stub, or --notes body).
 *   4. Runs npm test && npm run build (aborts on failure).
 *   5. Commits `chore(release): <version>` + tags `<version>`.
 *   6. Prints `git push origin main <version>` (or pushes with --push).
 *
 * Pushing the tag fires .github/workflows/release.yml → GitHub Release → BRAT.
 * --dry-run prints the planned diff and stops before writing anything.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('--'));
const PUSH = args.includes('--push');
const DRY_RUN = args.includes('--dry-run');
const notesIdx = args.indexOf('--notes');
const notes = notesIdx !== -1 ? args[notesIdx + 1] : null;

function printHelp() {
  console.log(`release — cut a release in one atomic, verified step.

What it does:
  1. Validates semver, clean tree, tag does not exist yet.
  2. Syncs version into manifest.json + package.json, adds
     versions.json["<version>"] = minAppVersion, syncs package-lock.
  3. Prepends a CHANGELOG.md entry (stub, or --notes body).
  4. Runs npm test && npm run build && npm run check-versions (aborts on failure).
  5. Commits \`chore(release): <version>\` + tags \`<version>\` — locally only.
  6. Prints \`git push origin main <version>\` (or pushes with --push).

IMPORTANT: without --push, nothing leaves your machine. GitHub, the
release workflow, and BRAT see nothing until main AND the tag are pushed.
Pushing to main alone never updates BRAT — only a pushed tag fires
.github/workflows/release.yml → GitHub Release → BRAT.

Flags:
  --push          push main + tag to origin when done (default: print the command)
  --notes "text"  changelog body for the version (default: TODO stub you edit)
  --dry-run       preview the plan without writing, committing, or tagging
  --help, -h      show this help

Examples:
  npm run release -- 0.2.2
  npm run release -- 0.2.2 --notes "Fix code symlink on mobile."
  npm run release -- 0.2.2 --push
  npm run release -- 0.2.2 --dry-run`);
}

function fail(msg) {
  console.error(`release: error: ${msg}`);
  process.exit(1);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function run(cmd, cmdArgs) {
  execFileSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit' });
}

if (!version) fail('usage: npm run release -- <version> [--push] [--notes "text"] [--dry-run]  (see --help)');
if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`"${version}" is not semver X.Y.Z`);

let existingTag = '';
try {
  existingTag = git('rev-parse', '-q', '--verify', `refs/tags/${version}`);
} catch {
  existingTag = '';
}
if (existingTag) fail(`tag ${version} already exists`);

if (git('status', '--porcelain')) fail('working tree is dirty — commit or stash first');

const manifestPath = join(ROOT, 'manifest.json');
const pkgPath = join(ROOT, 'package.json');
const versionsPath = join(ROOT, 'versions.json');
const changelogPath = join(ROOT, 'CHANGELOG.md');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const versions = JSON.parse(readFileSync(versionsPath, 'utf8'));
const minApp = manifest.minAppVersion ?? '1.5.0';
const today = new Date().toISOString().slice(0, 10);

const entry = notes
  ? `## ${version} — ${today}\n\n${notes}\n`
  : `## ${version} — ${today}\n\nTODO: release notes.\n`;

console.log(`release: ${manifest.version} → ${version} (minApp ${minApp})${DRY_RUN ? ' [dry-run]' : ''}`);
console.log(`release: files: manifest.json, package.json, versions.json, package-lock.json, CHANGELOG.md`);

if (DRY_RUN) {
  console.log(`release: changelog entry would be:\n\n${entry}`);
  console.log('release: then: npm test && npm run build, commit chore(release), tag, print push command');
  process.exit(0);
}

manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
versions[version] = minApp;
writeFileSync(versionsPath, JSON.stringify(versions, null, 2) + '\n');

const changelog = readFileSync(changelogPath, 'utf8').replace('# Changelog\n', `# Changelog\n\n${entry}`);
writeFileSync(changelogPath, changelog);

run('npm', ['install', '--package-lock-only', '--silent']);
run('npm', ['test']);
run('npm', ['run', 'build']);
run('node', ['scripts/check-versions.mjs']);

git('add', 'manifest.json', 'package.json', 'versions.json', 'package-lock.json', 'CHANGELOG.md', 'main.js');
git('commit', '-m', `chore(release): ${version}`);
git('tag', version);

if (PUSH) {
  git('push', 'origin', 'main', version);
  console.log(`release: pushed main + tag ${version} — watch .github/workflows/release.yml`);
} else {
  console.log(`release: done locally — now run: git push origin main ${version}`);
}
