export interface AssignmentTypes {
  canonicalTypes: Record<string, string>;
  aliasMap: Record<string, string>;
  typeDisplayNames: Record<string, string>;
  typeOptions: Record<string, string>;
  scaffoldTemplates: Record<string, string[]>;
  codeTypes: string[];
  typeAliases: Record<string, string[]>;
  resolveType: (slug: string) => string;
  getDisplayName: (slug: string) => string;
  isAlias: (slug: string) => boolean;
  isCanonical: (slug: string) => boolean;
}

export const canonicalTypes: Record<string, string> = {
  practico: 'Trabajo Práctico',
  laboratorio: 'Laboratorio',
  kata: 'Kata',
  cuestionario: 'Cuestionario',
  trivia: 'Trivia',
  investigacion: 'Investigación',
  caso: 'Caso',
  ejercicios: 'Ejercicios',
  parcial: 'Examen Parcial',
  final: 'Examen Final',
};

export const aliasMap: Record<string, string> = {
  practica: 'practico',
  'trabajo-practico': 'practico',
};

export const typeDisplayNames: Record<string, string> = {
  ...canonicalTypes,
  practica: canonicalTypes.practico,
  'trabajo-practico': canonicalTypes.practico,
};

export const typeOptions: Record<string, string> = { ...canonicalTypes };

export const scaffoldTemplates: Record<string, string[]> = {
  practico: ['_assets', 'deliverable'],
  practica: ['_assets', 'deliverable'],
  'trabajo-practico': ['_assets', 'deliverable'],
  laboratorio: ['_assets', 'deliverable'],
  kata: ['_assets', 'deliverable'],
  cuestionario: ['_assets', 'deliverable'],
  trivia: ['_assets', 'deliverable'],
  investigacion: ['_assets', 'deliverable'],
  caso: ['_assets', 'deliverable'],
  ejercicios: ['_assets', 'deliverable'],
  parcial: ['_assets'],
  final: ['_assets'],
};

export const codeTypes: string[] = ['practico', 'laboratorio', 'kata'];

export const typeAliases: Record<string, string[]> = {
  practico: ['practico', 'practica', 'trabajo-practico'],
};

export function resolveType(slug: string): string {
  return aliasMap[slug] || slug;
}

export function getDisplayName(slug: string): string {
  const canonical = resolveType(slug);
  return canonicalTypes[canonical] || typeDisplayNames[slug] || slug;
}

export function isAlias(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(aliasMap, slug);
}

export function isCanonical(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(canonicalTypes, slug);
}

export const assignmentTypes: AssignmentTypes = {
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

export default assignmentTypes;