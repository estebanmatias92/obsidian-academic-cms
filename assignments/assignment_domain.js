/**
 * assignment_domain.js
 *
 * Pure domain helpers for assignment scaffolding — zero `tp` / `app` / `document` deps.
 * Shared by Templater (`tp.user.assignment_domain`) and future Obsidian Plugin.
 *
 * Phase 2 — Extract pure domain: 1:1 with `assignments/assignment.md:60-62` and
 * `assignments/assignment_form_modal.js:500-536` so preview/title/filename never drift.
 *
 * All functions are pure, alias-aware (practica/trabajo-practico → practico), and
 * slugify internally via `shared/slugify.js` fallback.
 */

let slugify;
try {
  slugify = require('../shared/slugify.js');
} catch (e) {
  // Fallback when required outside vault (e.g. tests with different cwd)
  try { slugify = require('/home/matt/Vaults/conocimiento/00-meta/academic-cms/shared/slugify.js'); } catch (_) {}
  if (!slugify || typeof slugify !== 'function') {
    slugify = (text) => text.normalize('NFKD').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s-]+/g, '-');
  }
}

let assignmentTypes;
try {
  assignmentTypes = require('./assignment_types.js');
  if (typeof assignmentTypes === 'function') assignmentTypes = assignmentTypes();
} catch (e) {
  try { assignmentTypes = require('/home/matt/Vaults/conocimiento/00-meta/academic-cms/assignments/assignment_types.js'); if (typeof assignmentTypes === 'function') assignmentTypes = assignmentTypes(); } catch (_) {}
  assignmentTypes = assignmentTypes || {};
}

const {
  canonicalTypes = {},
  aliasMap = {},
  typeDisplayNames = {},
  scaffoldTemplates = { practico: ['_assets','deliverable'], parcial: ['_assets'], final: ['_assets'] },
  codeTypes = [],
  getDisplayName: _getDisplayName,
  resolveType: _resolveType,
} = assignmentTypes;

function pad2(value, fallback = '01') {
  return String(value ?? fallback).padStart(2, '0');
}

function resolveType(slug) {
  if (_resolveType) return _resolveType(slug);
  return (aliasMap && aliasMap[slug]) || slug;
}

function getDisplayName(slug) {
  if (_getDisplayName) return _getDisplayName(slug);
  const canonical = resolveType(slug);
  return (canonicalTypes && canonicalTypes[canonical]) || (typeDisplayNames && typeDisplayNames[slug]) || slug;
}

/**
 * Build title string — canonical: "Course - Unidad XX - Type YY - Topic"
 * If courseName missing, falls back to "Unidad XX - Type YY - Topic" (modal preview compat).
 * Mirrors `assignment.md:62` and `assignment_form_modal.js:530-532`.
 *
 * @param {object} p
 * @param {string} [p.courseName]
 * @param {string|number} [p.unit] - "1" → "01"
 * @param {string} [p.type] - slug (alias-aware)
 * @param {string|number} [p.assignmentNumber] - "1" → "01"
 * @param {string} [p.topic]
 */
function buildTitle({ courseName, unit, type, assignmentNumber, topic }) {
  const unitPadded = pad2(unit, '01');
  const numPadded = pad2(assignmentNumber, '01');
  const topicStr = topic || 'Introduccion';
  const display = getDisplayName(type || 'practico');
  if (courseName) {
    return `${courseName} - Unidad ${unitPadded} - ${display} ${numPadded} - ${topicStr}`;
  }
  return `Unidad ${unitPadded} - ${display} ${numPadded} - ${topicStr}`;
}

/**
 * Build filename base (without .md) — canonical: date-studentSlug-courseSlug-typeSlug-number-topicSlug
 * Mirrors `assignment.md:63` and `assignment_form_modal.js:533-534`.
 *
 * @param {object} p
 * @param {string} p.date - YYYY-MM-DD
 * @param {string} p.student - raw student name
 * @param {string} [p.courseCode]
 * @param {string} [p.courseName] - fallback if courseCode absent/undefined string
 * @param {string} [p.type]
 * @param {string|number} [p.assignmentNumber]
 * @param {string} [p.topic]
 * @returns {string} filename base without extension
 */
function buildFilename({ date, student, courseCode, courseName, type, assignmentNumber, topic }) {
  const dateStr = date;
  const studentSlug = slugify(student || '');
  const rawCourse = (courseCode && courseCode !== '' && courseCode !== 'undefined') ? courseCode : (courseName || 'curso');
  const courseSlug = slugify(rawCourse);
  const typeSlug = slugify(type || 'practico');
  const numPadded = pad2(assignmentNumber, '01');
  const topicSlug = slugify(topic || 'Introduccion');
  return `${dateStr}-${studentSlug}-${courseSlug}-${typeSlug}-${numPadded}-${topicSlug}`;
}

/**
 * Build folder name — canonical: date-typeSlug-topicSlug
 * Mirrors `assignment.md:111`.
 * @param {object} p
 * @param {string} p.date
 * @param {string} p.type
 * @param {string} p.topic
 */
function buildFolderName({ date, type, topic }) {
  const typeSlug = slugify(type || 'practico');
  const topicSlug = slugify(topic || 'Introduccion');
  return `${date}-${typeSlug}-${topicSlug}`;
}

/**
 * Build base path — `coursePath/assignDir/folderName`
 * @param {object} p
 */
function buildBasePath({ coursePath, assignDir, folderName }) {
  return `${coursePath}/${assignDir}/${folderName}`;
}

/**
 * Get scaffold dirs for a type, optionally including `code/`.
 * Mirrors `assignment.md:54` + `assignment_form_modal.js:522-523`.
 * @param {string} typeSlug - raw slug (alias-aware)
 * @param {boolean|null} includeCode - null = derive from codeTypes
 * @returns {string[]} cloned array (never mutates source)
 */
function getScaffoldDirs(typeSlug, includeCode = null) {
  const canonical = resolveType(typeSlug);
  const base = scaffoldTemplates[canonical] || scaffoldTemplates[typeSlug] || ['_assets', 'deliverable'];
  const dirs = [...base];
  const shouldInclude = includeCode !== null ? includeCode : codeTypes.includes(canonical);
  if (shouldInclude && !dirs.includes('code')) dirs.push('code');
  return dirs;
}

/**
 * Normalize unit/number helpers (exported for tests)
 */
function normalizeUnit(unit) { return pad2(unit, '01'); }
function normalizeNumber(n) { return pad2(n, '01'); }

const data = {
  buildTitle,
  buildFilename,
  buildFolderName,
  buildBasePath,
  getScaffoldDirs,
  normalizeUnit,
  normalizeNumber,
  pad2,
  resolveType,
  getDisplayName,
  slugify,
};

function assignmentDomainFn() { return data; }
Object.assign(assignmentDomainFn, data);
module.exports = assignmentDomainFn;
