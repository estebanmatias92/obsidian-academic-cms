/**
 * create_assignment_service.test.ts — fake VaultPort + fake SettingsPort tests (Phase 3c).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateAssignmentService } from '../src/use_cases/create_assignment_service';
import type { AssignmentFormData } from '../src/ports/modal_port';

class FakeVaultPort {
  folders: string[] = [];
  files = new Map<string, string>();

  getAbstractFileByPath() { return null; }
  async readFile(): Promise<string> { return ''; }
  getMatchedPath(): string | null { return null; }
  getActiveFilePath(): string | null { return null; }
  getVaultBasePath(): string | null { return '/home/matt/Vaults/conocimiento'; }

  async createFolder(path: string): Promise<void> {
    this.folders.push(path);
  }

  async createFile(path: string, content: string): Promise<any> {
    this.files.set(path, content);
    return { path, name: path.split('/').pop()!, basename: path, extension: 'md', parent: null };
  }

  async moveFile(): Promise<void> {}
}

class FakeSettingsPort {
  constructor(private codePath: string | undefined, private externalPath: string | undefined = undefined) {}
  getCodeFolderPath(): string | undefined { return this.codePath; }
  getExternalCodeBasePath(): string | undefined { return this.externalPath; }
}

class FakeFileSystemPort {
  dirs: string[] = [];
  symlinks: { target: string; link: string }[] = [];

  isDesktop(): boolean { return true; }

  async createDir(path: string): Promise<void> {
    this.dirs.push(path);
  }

  async exists(path: string): Promise<boolean> { return false; }

  async symlink(target: string, linkPath: string): Promise<void> {
    this.symlinks.push({ target, link: linkPath });
  }
}

const CONTEXT = {
  coursePath: '01-carrera/isft-systems/subjects/bd-01',
  assignDir: '30-assignments',
  course: { name: 'Base de Datos', code: 'BD-01' },
  career: { student: 'Carlos Matias Lapenta' },
  date: '2026-08-31',
};

const FORM: AssignmentFormData = {
  type: 'practico',
  topic: 'Introduccion RDBMS',
  unit: '1',
  date: '2026-08-31',
  due_date: '2026-09-07',
  difficulty: 'medium',
  priority: 'high',
  submission_type: 'PDF',
  submission_platform: 'Google_Classroom',
  submission_link: 'https://classroom.google.com/x',
  instructions_link: 'https://drive.google.com/y',
  ai_chat_links: 'https://chat.deepseek.com/a\nhttps://notebooklm.google.com/b',
  assignment_number: '1',
  include_code: true,
  submission_file_format: '.pdf',
};

describe('CreateAssignmentService', () => {
  let vault: FakeVaultPort;
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    vault = new FakeVaultPort();
    fs = new FakeFileSystemPort();
  });

  it('creates scaffold dirs incl. code for practico (default location)', async () => {
    const svc = new CreateAssignmentService(vault as any, new FakeSettingsPort(undefined) as any, fs as any);
    const result = await svc.execute(FORM, CONTEXT);

    expect(result.title).toBe('Base de Datos - Unidad 01 - Trabajo Práctico 01 - Introduccion RDBMS');
    expect(result.path).toBe(
      '01-carrera/isft-systems/subjects/bd-01/30-assignments/2026-08-31-practico-introduccion-rdbms/2026-08-31-carlos-matias-lapenta-bd-01-practico-01-introduccion-rdbms.md'
    );
    const base = '01-carrera/isft-systems/subjects/bd-01/30-assignments/2026-08-31-practico-introduccion-rdbms';
    expect(vault.folders).toEqual([`${base}/_assets`, `${base}/deliverable`, `${base}/code`]);
  });

  it('writes note with frontmatter and body at basePath', async () => {
    const svc = new CreateAssignmentService(vault as any, new FakeSettingsPort(undefined) as any, fs as any);
    const result = await svc.execute(FORM, CONTEXT);

    const content = vault.files.get(result.path);
    expect(content).toBeDefined();
    expect(content).toContain('title: "Base de Datos - Unidad 01 - Trabajo Práctico 01 - Introduccion RDBMS"');
    expect(content).toContain('assignment_number: "01"');
    expect(content).toContain('unit: "01"');
    expect(content).toContain('block-headings: true');
    expect(content).toContain('- https://chat.deepseek.com/a');
    expect(content).toContain('## 📌 Descripción de la Actividad');
    expect(content).toContain('[Plataforma de Entrega](https://classroom.google.com/x)');
  });

  it('uses custom code folder from SettingsPort instead of basePath/code', async () => {
    const svc = new CreateAssignmentService(vault as any, new FakeSettingsPort('50-code') as any, fs as any);
    await svc.execute(FORM, CONTEXT);

    const base = '01-carrera/isft-systems/subjects/bd-01/30-assignments/2026-08-31-practico-introduccion-rdbms';
    expect(vault.folders).toEqual([
      `${base}/_assets`,
      `${base}/deliverable`,
      '50-code/2026-08-31-practico-introduccion-rdbms-code',
    ]);
    expect(vault.folders).not.toContain(`${base}/code`);
  });

  it('parcial → only _assets, no code', async () => {
    const svc = new CreateAssignmentService(vault as any, new FakeSettingsPort(undefined) as any, fs as any);
    const form = { ...FORM, type: 'parcial', include_code: false };
    await svc.execute(form, CONTEXT);

    const base = '01-carrera/isft-systems/subjects/bd-01/30-assignments/2026-08-31-parcial-introduccion-rdbms';
    expect(vault.folders).toEqual([`${base}/_assets`]);
  });

  it('pads unit and assignment_number', async () => {
    const svc = new CreateAssignmentService(vault as any, new FakeSettingsPort(undefined) as any, fs as any);
    const result = await svc.execute(FORM, CONTEXT);
    expect(result.frontmatter).toContain('unit: "01"');
    expect(result.frontmatter).toContain('assignment_number: "01"');
  });

  it('tags include topic slug, type slug and unit', async () => {
    const svc = new CreateAssignmentService(vault as any, new FakeSettingsPort(undefined) as any, fs as any);
    const result = await svc.execute(FORM, CONTEXT);
    expect(result.frontmatter).toContain('- introduccion-rdbms');
    expect(result.frontmatter).toContain('- practico');
    expect(result.frontmatter).toContain('- unit-01');
  });

  it('creates symlink with external code base on desktop', async () => {
    const settings = new FakeSettingsPort(undefined, '/home/matt/Projects/isft151-analisis-sistemas');
    const svc = new CreateAssignmentService(vault as any, settings as any, fs as any);
    await svc.execute(FORM, CONTEXT);

    const expectedSubject = 'bd-01';
    const expectedFolder = '2026-08-31-practico-introduccion-rdbms';
    const expectedTarget = `/home/matt/Projects/isft151-analisis-sistemas/${expectedSubject}/${expectedFolder}`;

    expect(fs.dirs).toContain(expectedTarget);
    expect(fs.symlinks).toContainEqual({
      target: expectedTarget,
      link: `/home/matt/Vaults/conocimiento/01-carrera/isft-systems/subjects/bd-01/30-assignments/2026-08-31-practico-introduccion-rdbms/code`,
    });
  });
});
