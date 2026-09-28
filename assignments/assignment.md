<%\*
// Get the career and the course Frontmatter Objects from the \_career.md and_course.md metadata files
const cfg = tp.user.career_config();
const career = tp.user.get_frontmatter_from_regex(tp, cfg.CAREER_DIR_PATTERN, `_career.md`);
const course = tp.user.get_frontmatter_from_regex(tp, cfg.COURSE_DIR_PATTERN, `_course.md`);

// (form fields moved to assignment_form_modal.js)

// Centralized assignment type catalog — single source of truth (Phase 1)
// `practico` is canonical for "Trabajo Práctico"; `practica` / `trabajo-practico` are read-only aliases for scan compat.
let \_assignmentTypes = tp.user.assignment_types;
if (typeof \_assignmentTypes === 'function') \_assignmentTypes = \_assignmentTypes();
if (!\_assignmentTypes || !\_assignmentTypes.typeDisplayNames) {
try { \_assignmentTypes = require('./assignment_types.js'); if (typeof \_assignmentTypes === 'function') \_assignmentTypes = \_assignmentTypes(); } catch(e) {}
}
const { typeDisplayNames, scaffoldTemplates, getDisplayName, resolveType } = \_assignmentTypes;

// Pure domain helpers — 1:1 title/filename/folder/scaffold logic (Phase 2)
// Exposed as tp.user.assignment_domain via Templater basename flattening.
let \_domain = tp.user.assignment_domain;
if (typeof \_domain === 'function') \_domain = \_domain();
if (!\_domain || !\_domain.buildTitle) {
try { \_domain = require('./assignment_domain.js'); if (typeof \_domain === 'function') \_domain = \_domain(); } catch(e) {}
}

// Initialize responses object
const responses = {
student: career.student,
course: {
name: course.course,
code: course.code || ""
},
professor: course.professor
};

// Determine course path and assignment directory
const coursePath = tp.user.get_matched_path(cfg.COURSE_PATH_PATTERN);
if (!coursePath) {
throw new Error('No se detectó una materia. Ejecuta esto desde una carpeta de materia.');
}
const activePath = tp.file.folder(true);
const assignDir = activePath && activePath.contains('/40-exams/') ? '40-exams' : '30-assignments';

// Collect all form data via unified modal (replaces sequential prompts)
const formData = await tp.user.assignment_form_modal(tp, { coursePath, assignDir, course, career });
if (!formData) {
throw new Error('Creacion cancelada por el usuario.');
}
for (const [key, value] of Object.entries(formData)) {
responses[key] = value;
}

responses.type_slug = `${(_domain.slugify || tp.user.slugify)(responses.type)}`
responses.topic_slug = `${(_domain.slugify || tp.user.slugify)(responses.topic)}`
responses.course_slug = `${(_domain.slugify || tp.user.slugify)(responses.course.code && responses.course.code !== "" && responses.course.code !== "undefined" ? responses.course.code : responses.course.name)}`

// Normalize assignment number and unit (e.g., "1" → "01")
responses.assignment_number = \_domain.normalizeNumber ? \_domain.normalizeNumber(responses.assignment_number) : String(responses.assignment_number).padStart(2, '0');
responses.unit = \_domain.normalizeUnit ? \_domain.normalizeUnit(responses.unit) : String(responses.unit).padStart(2, '0');

// Conditionally include code/ in scaffold — via pure domain (Phase 2)
const \_includeCode = responses.include_code === true || responses.include_code === 'true';
const dirs = \_domain.getScaffoldDirs ? \_domain.getScaffoldDirs(responses.type_slug, \_includeCode) : (scaffoldTemplates[responses.type_slug] || ["_assets", "deliverable"]);

// Formatting TITLE and FILENAME — via pure domain (1:1 with modal preview)
const title = \_domain.buildTitle ? \_domain.buildTitle({
courseName: responses.course.name,
unit: responses.unit,
type: responses.type_slug,
assignmentNumber: responses.assignment_number,
topic: responses.topic
}) : `${responses.course.name} - Unidad ${String(responses.unit).padStart(2, '0')} - ${(getDisplayName && (getDisplayName(responses.type_slug) || getDisplayName(responses.type))) || typeDisplayNames[responses.type_slug] || responses.type} ${responses.assignment_number} - ${responses.topic}`;
const filename = \_domain.buildFilename ? \_domain.buildFilename({
date: responses.date,
student: responses.student || career.student,
courseCode: responses.course.code,
courseName: responses.course.name,
type: responses.type_slug,
assignmentNumber: responses.assignment_number,
topic: responses.topic
}) : `${responses.date}-${(_domain.slugify || tp.user.slugify)(responses.student || career.student)}-${responses.course_slug}-${responses.type_slug}-${responses.assignment_number}-${responses.topic_slug}`;

// Format the frontmatter
const frontmatter = `---
title: "${title}"
filename: "${filename}"
type: "${responses.type_slug}"
date: "${responses.date}"
due_date: "${responses.due_date}"
author: "${responses.student}"
course:
name: "${responses.course.name}"
  code: "${responses.course.code}"
professor: "${course.professor}"
unit: "${responses.unit || 01}"
assignment_number: "${parseInt(responses.assignment_number, 10) || 01}"
topic: "${responses.topic}"
difficulty: ${responses.difficulty}
priority: ${responses.priority}
status_completed: false
status_submitted: false
status_graded: false
grading:
  max_points: 100
  earned_points: 0
  weight: 0.00
submission_type: "${responses.submission_type}"
submission_file_format: "${responses.submission_file_format}"
submission_platform: "${responses.submission_platform}"
links_instructions: "${responses.instructions_link}"
links_submission: "${responses.submission_link}"
links_local_copy: ""
ai_chat_links:

- ${responses.ai_chat_links.split('\n').filter(link => link.trim()).map(item => item.trim()).join('\n - ')}
  tags:
- ${responses.topic_slug}
- second-year
- ${responses.type_slug}
- unit-${responses.unit}
  toc: false
  block-headings: true
  ---`;

// Output the complete frontmatter
tR = frontmatter +tR;

// Build scaffolding folder path — via pure domain (Phase 2)
const folderName = \_domain.buildFolderName ? \_domain.buildFolderName({ date: responses.date, type: responses.type_slug, topic: responses.topic }) : `${responses.date}-${responses.type_slug}-${(_domain.slugify || tp.user.slugify)(responses.topic)}`;
const basePath = \_domain.buildBasePath ? \_domain.buildBasePath({ coursePath, assignDir, folderName }) : `${coursePath}/${assignDir}/${folderName}`;

// Create scaffold subdirectories — vault-only, agnostic of host OS (no fs symlink, no hardcode path)
// `code/` is now a real vault folder via Vault API. If external sync is needed,
// it must be configured via Plugin Settings (SettingsPort) with user-provided vault-relative or absolute path,
// never hardcoded `~/Projects/...`. Fallback is Obsidian folder structure.
for (const dir of dirs) {
await tp.app.vault.createFolder(`${basePath}/${dir}`);
}

// Move file into the scaffolding folder
await tp.file.move(`${basePath}/${filename}`);
%>

# <%\* tR += title %>

## 📌 Descripción de la Actividad

- [Plataforma de Entrega](<%* tR += responses.submission_link %>) | [Instrucciones](<%* tR += responses.instructions_link %>)
- Formato de entrega requerido: **<%\* tR += responses.submission_file_format %>**

### Objetivos

1. Desarrollar consignas teóricas
2. Desarrollar consignas prácticas

## 📝 Desarrollo

### 1. ...

...

## 🛠️ Desarrollo Práctico

### 2. ...

...

## 📚 Material de Referencia

- ...

## 📂 Archivos Adjuntos

- ...
