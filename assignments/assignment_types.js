/**
 * assignment_types.js
 *
 * Single Source of Truth for assignment type catalog.
 * Canonical type is `practico` ("Trabajo Práctico"); aliases `practica` and
 * `trabajo-practico` are read-only for backward/retroactive scan compat.
 * Exposed as `tp.user.assignment_types` via Templater user_scripts_folder.
 *
 * Phase 1 — DRY: centralizes typeDisplayNames / scaffoldTemplates / codeTypes / typeAliases
 * so `assignments/assignment.md` and `assignments/assignment_form_modal.js` no longer duplicate.
 *
 * Exports both as plain object and as callable (for `tp.user.career_config()` parity):
 *   - `tp.user.assignment_types` (object) or `tp.user.assignment_types()` (call) both work.
 */

const canonicalTypes = {
  practico: "Trabajo Práctico",
  laboratorio: "Laboratorio",
  kata: "Kata",
  cuestionario: "Cuestionario",
  trivia: "Trivia",
  investigacion: "Investigación",
  caso: "Caso",
  ejercicios: "Ejercicios",
  parcial: "Examen Parcial",
  final: "Examen Final",
};

// 2 read-only aliases → canonical (scan-only, creation always writes `practico`)
const aliasMap = {
  practica: "practico", // deprecated - Tier 2 retroactive
  "trabajo-practico": "practico", // legacy folder slug
};

// For title/filename lookup compat: canonical + aliases resolve to same display name
const typeDisplayNames = {
  ...canonicalTypes,
  practica: canonicalTypes.practico,
  "trabajo-practico": canonicalTypes.practico,
};

// UI select exposes only canonical 10 (no aliases)
const typeOptions = { ...canonicalTypes };

// Scaffold dirs per type slug (includes alias entries for legacy read compat)
const scaffoldTemplates = {
  practico: ["_assets", "deliverable"],
  practica: ["_assets", "deliverable"], // deprecated alias
  "trabajo-practico": ["_assets", "deliverable"], // legacy
  laboratorio: ["_assets", "deliverable"],
  kata: ["_assets", "deliverable"],
  cuestionario: ["_assets", "deliverable"],
  trivia: ["_assets", "deliverable"],
  investigacion: ["_assets", "deliverable"],
  caso: ["_assets", "deliverable"],
  ejercicios: ["_assets", "deliverable"],
  parcial: ["_assets"],
  final: ["_assets"],
};

// Types that include `code/` dir when selected
const codeTypes = ["practico", "laboratorio", "kata"];

// Alias groups for vault scanning (Tier 2 retroactive)
const typeAliases = {
  practico: ["practico", "practica", "trabajo-practico"],
};

function resolveType(slug) {
  return aliasMap[slug] || slug;
}

function getDisplayName(slug) {
  const canonical = resolveType(slug);
  return canonicalTypes[canonical] || typeDisplayNames[slug] || slug;
}

function isAlias(slug) {
  return Object.prototype.hasOwnProperty.call(aliasMap, slug);
}

function isCanonical(slug) {
  return Object.prototype.hasOwnProperty.call(canonicalTypes, slug);
}

const data = {
  canonicalTypes,
  aliasMap,
  typeDisplayNames,
  typeOptions,
  scaffoldTemplates,
  codeTypes,
  typeAliases,
  resolveType,
  getDisplayName,
  isAlias,
  isCanonical,
};

// Support both `tp.user.assignment_types` (object) and `tp.user.assignment_types()` (call) for Templater parity with career_config.js
function assignmentTypesFn() {
  return data;
}
Object.assign(assignmentTypesFn, data);
module.exports = assignmentTypesFn;
