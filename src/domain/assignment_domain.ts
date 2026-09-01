import { slugify } from './slugify';
import {
  canonicalTypes,
  aliasMap,
  typeDisplayNames,
  scaffoldTemplates,
  codeTypes as _codeTypes,
  resolveType as _resolveType,
  getDisplayName,
} from './assignment_types';

export const codeTypes = _codeTypes;
export const resolveType = _resolveType;

function pad2(value: string | number | undefined, fallback = '01'): string {
  return String(value ?? fallback).padStart(2, '0');
}

export function buildTitle(params: {
  courseName?: string;
  unit: string | number;
  type: string;
  assignmentNumber: string | number;
  topic: string;
}): string {
  const unitPadded = pad2(params.unit);
  const numPadded = pad2(params.assignmentNumber);
  const topicStr = params.topic || 'Introduccion';
  const display = getDisplayName(params.type || 'practico');
  if (params.courseName) {
    return `${params.courseName} - Unidad ${unitPadded} - ${display} ${numPadded} - ${topicStr}`;
  }
  return `Unidad ${unitPadded} - ${display} ${numPadded} - ${topicStr}`;
}

export function buildFilename(params: {
  date: string;
  student: string;
  courseCode?: string;
  courseName?: string;
  type: string;
  assignmentNumber: string | number;
  topic: string;
}): string {
  const dateStr = params.date;
  const studentSlug = slugify(params.student || '');
  const rawCourse = (params.courseCode && params.courseCode !== '' && params.courseCode !== 'undefined')
    ? params.courseCode
    : (params.courseName || 'curso');
  const courseSlug = slugify(rawCourse);
  const typeSlug = slugify(params.type || 'practico');
  const numPadded = pad2(params.assignmentNumber);
  const topicSlug = slugify(params.topic || 'Introduccion');
  return `${dateStr}-${studentSlug}-${courseSlug}-${typeSlug}-${numPadded}-${topicSlug}`;
}

export function buildFolderName(params: {
  date: string;
  type: string;
  topic: string;
}): string {
  const typeSlug = slugify(params.type || 'practico');
  const topicSlug = slugify(params.topic || 'Introduccion');
  return `${params.date}-${typeSlug}-${topicSlug}`;
}

export function buildBasePath(params: {
  coursePath: string;
  assignDir: string;
  folderName: string;
}): string {
  return `${params.coursePath}/${params.assignDir}/${params.folderName}`;
}

export function getScaffoldDirs(typeSlug: string, includeCode: boolean | null = null): string[] {
  const canonical = resolveType(typeSlug);
  const base = scaffoldTemplates[canonical] || scaffoldTemplates[typeSlug] || ['_assets', 'deliverable'];
  const dirs = [...base];
  const shouldInclude = includeCode !== null ? includeCode : codeTypes.includes(canonical);
  if (shouldInclude && !dirs.includes('code')) dirs.push('code');
  return dirs;
}

export function normalizeUnit(unit: string | number | undefined): string {
  return pad2(unit, '01');
}

export function normalizeNumber(n: string | number | undefined): string {
  return pad2(n, '01');
}

export function buildExternalCodePath(params: {
  externalBase: string;
  subject: string;
  folderName: string;
}): string {
  const subjectSlug = slugify(params.subject);
  return `${params.externalBase}/${subjectSlug}/${params.folderName}`;
}

export const assignmentDomain = {
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
  buildExternalCodePath,
  codeTypes,
};

export default assignmentDomain;