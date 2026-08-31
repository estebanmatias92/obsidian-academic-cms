// Guard: Templater loads every *.js under 00-meta as tp.user.* — make tests inert in Obsidian.
if (typeof app !== 'undefined' && app.vault) {
  module.exports = {};
} else {
/**
 * assignment_domain.test.js — characterization tests for Phase 2 pure domain.
 * Run: npm test (vitest) from 00-meta/academic-cms
 * Vitest provides global describe/it/expect (vitest.config.js: globals:true)
 */

const domainMod = require('../assignments/assignment_domain.js');
const d = typeof domainMod === 'function' ? domainMod() : domainMod.default ? domainMod.default : domainMod;

const atMod = require('../assignments/assignment_types.js');
const atd = typeof atMod === 'function' ? atMod() : atMod.default ? atMod.default : atMod;

describe('buildTitle — 1:1 with assignment.md:62 and assignment_form_modal.js:530', () => {
  it('canonical practico title with course', () => {
    expect(
      d.buildTitle({ courseName: 'Base de Datos', unit: '01', type: 'practico', assignmentNumber: '01', topic: 'Introduccion' })
    ).toBe('Base de Datos - Unidad 01 - Trabajo Práctico 01 - Introduccion');
  });
  it('alias practica resolves to Trabajo Práctico', () => {
    expect(
      d.buildTitle({ courseName: 'Base de Datos', unit: 1, type: 'practica', assignmentNumber: 1, topic: 'SQL Uniones' })
    ).toBe('Base de Datos - Unidad 01 - Trabajo Práctico 01 - SQL Uniones');
  });
  it('legacy trabajo-practico resolves to Trabajo Práctico', () => {
    expect(
      d.buildTitle({ courseName: 'Arquitectura de Computadores', unit: '04', type: 'trabajo-practico', assignmentNumber: '01', topic: 'Calculadora Binaria' })
    ).toBe('Arquitectura de Computadores - Unidad 04 - Trabajo Práctico 01 - Calculadora Binaria');
  });
  it('without courseName falls back to Unidad prefix (modal preview)', () => {
    expect(
      d.buildTitle({ unit: '01', type: 'laboratorio', assignmentNumber: '02', topic: 'Introduccion' })
    ).toBe('Unidad 01 - Laboratorio 02 - Introduccion');
  });
  it('pads unit and number single digit', () => {
    expect(
      d.buildTitle({ courseName: 'Estadistica', unit: '2', type: 'parcial', assignmentNumber: '3', topic: 'Normalizacion' })
    ).toBe('Estadistica - Unidad 02 - Examen Parcial 03 - Normalizacion');
  });
  it('handles all canonical display names', () => {
    const cases = [
      ['kata', 'Kata'],
      ['cuestionario', 'Cuestionario'],
      ['trivia', 'Trivia'],
      ['investigacion', 'Investigación'],
      ['caso', 'Caso'],
      ['ejercicios', 'Ejercicios'],
      ['final', 'Examen Final'],
    ];
    for (const [slug, display] of cases) {
      const title = d.buildTitle({ courseName: 'Curso', unit: '01', type: slug, assignmentNumber: '01', topic: 'T' });
      expect(title).toContain(display);
    }
  });
});

describe('buildFilename — 1:1 with assignment.md:63 and assignment_form_modal.js:533', () => {
  it('canonical filename with all parts', () => {
    expect(
      d.buildFilename({
        date: '2026-03-26',
        student: 'Carlos Matias Lapenta',
        courseCode: 'BD-01',
        courseName: 'Base de Datos',
        type: 'practico',
        assignmentNumber: '01',
        topic: 'Introduccion RDBMS',
      })
    ).toBe('2026-03-26-carlos-matias-lapenta-bd-01-practico-01-introduccion-rdbms');
  });
  it('uses courseName when code is empty or literal "undefined"', () => {
    expect(
      d.buildFilename({
        date: '2026-05-14',
        student: 'Lapenta Carlos Matias',
        courseCode: '',
        courseName: 'Base de Datos',
        type: 'practico',
        assignmentNumber: '06',
        topic: 'Normalizacion DB',
      })
    ).toBe('2026-05-14-lapenta-carlos-matias-base-de-datos-practico-06-normalizacion-db');
    expect(
      d.buildFilename({
        date: '2026-05-14',
        student: 'Lapenta',
        courseCode: 'undefined',
        courseName: 'Ingles II',
        type: 'practico',
        assignmentNumber: '07',
        topic: 'Past Simple',
      })
    ).toBe('2026-05-14-lapenta-ingles-ii-practico-07-past-simple');
  });
  it('slugifies accents and spaces', () => {
    expect(
      d.buildFilename({
        date: '2026-03-26',
        student: 'Café León',
        courseCode: 'Álgebra',
        courseName: 'Álgebra',
        type: 'laboratorio',
        assignmentNumber: '01',
        topic: 'Cálculo Vectorial',
      })
    ).toBe('2026-03-26-cafe-leon-algebra-laboratorio-01-calculo-vectorial');
  });
  it('pads assignment number', () => {
    expect(
      d.buildFilename({
        date: '2026-01-01',
        student: 'S',
        courseCode: 'C',
        courseName: 'C',
        type: 'kata',
        assignmentNumber: '2',
        topic: 'T',
      })
    ).toBe('2026-01-01-s-c-kata-02-t');
  });
});

describe('buildFolderName — 1:1 with assignment.md:111', () => {
  it('builds folder name date-type-topic', () => {
    expect(
      d.buildFolderName({ date: '2026-03-26', type: 'practico', topic: 'Introduccion RDBMS' })
    ).toBe('2026-03-26-practico-introduccion-rdbms');
  });
  it('slugifies topic and type', () => {
    expect(
      d.buildFolderName({ date: '2026-08-26', type: 'practico', topic: 'Visitor Pattern Analysis' })
    ).toBe('2026-08-26-practico-visitor-pattern-analysis');
  });
});

describe('getScaffoldDirs — 1:1 with assignment.md:54 and assignment_form_modal.js:522', () => {
  it('practico includes _assets and deliverable by default', () => {
    expect(d.getScaffoldDirs('practico')).toEqual(['_assets', 'deliverable', 'code']);
  });
  it('parcial only _assets', () => {
    expect(d.getScaffoldDirs('parcial')).toEqual(['_assets']);
  });
  it('final only _assets', () => {
    expect(d.getScaffoldDirs('final')).toEqual(['_assets']);
  });
  it('kata includes code via codeTypes', () => {
    expect(d.getScaffoldDirs('kata')).toEqual(['_assets', 'deliverable', 'code']);
  });
  it('cuestionario no code', () => {
    expect(d.getScaffoldDirs('cuestionario')).toEqual(['_assets', 'deliverable']);
  });
  it('explicit includeCode false suppresses code even for practico', () => {
    expect(d.getScaffoldDirs('practico', false)).toEqual(['_assets', 'deliverable']);
  });
  it('explicit includeCode true adds code even for cuestionario', () => {
    expect(d.getScaffoldDirs('cuestionario', true)).toEqual(['_assets', 'deliverable', 'code']);
  });
  it('alias practica resolves to practico scaffold', () => {
    expect(d.getScaffoldDirs('practica')).toEqual(['_assets', 'deliverable', 'code']);
    expect(d.getScaffoldDirs('trabajo-practico')).toEqual(['_assets', 'deliverable', 'code']);
  });
  it('does not mutate source', () => {
    const a = d.getScaffoldDirs('practico');
    a.push('extra');
    const b = d.getScaffoldDirs('practico');
    expect(b).not.toContain('extra');
  });
});

describe('helpers — parity with assignment_types.js', () => {
  it('resolveType alias → canonical', () => {
    expect(d.resolveType('practica')).toBe('practico');
    expect(d.resolveType('trabajo-practico')).toBe('practico');
    expect(d.resolveType('laboratorio')).toBe('laboratorio');
  });
  it('getDisplayName alias-aware', () => {
    expect(d.getDisplayName('practica')).toBe('Trabajo Práctico');
    expect(d.getDisplayName('trabajo-practico')).toBe('Trabajo Práctico');
    expect(d.getDisplayName('parcial')).toBe('Examen Parcial');
  });
  it('slugify exported', () => {
    expect(d.slugify('Café con Leche')).toBe('cafe-con-leche');
  });
  it('pad2', () => {
    expect(d.pad2('1')).toBe('01');
    expect(d.pad2('10')).toBe('10');
    expect(d.pad2(undefined)).toBe('01');
  });
});

describe('parity — domain vs inline logic in vault files (characterization)', () => {
  it('filename slug for student with multiple spaces and case', () => {
    expect(d.slugify('Lapenta Carlos Matias')).toBe('lapenta-carlos-matias');
  });
  it('buildTitle matches manual template string', () => {
    const course = { course: 'Base de Datos', code: 'BD-01' };
    const topic = 'Introduccion RDBMS';
    const titleInline = `${course.course} - Unidad 01 - ${atd.getDisplayName('practico')} 01 - ${topic}`;
    const titleDomain = d.buildTitle({ courseName: course.course, unit: '01', type: 'practico', assignmentNumber: '01', topic });
    expect(titleDomain).toBe(titleInline);
  });
});
}
