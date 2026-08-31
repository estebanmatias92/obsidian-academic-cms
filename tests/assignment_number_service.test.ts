/**
 * assignment_number_service.test.ts — fake in-memory VaultPort tests (Phase 3b validation).
 * No obsidian, no fs — pure Map-based fake vault.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AssignmentNumberService } from '../src/use_cases/assignment_number_service';

class FakeVaultPort {
  folders = new Map<string, any>();
  contents = new Map<string, string>();

  getAbstractFileByPath(path: string) {
    return this.folders.get(path) ?? null;
  }

  async readFile(file: { path: string }): Promise<string> {
    const content = this.contents.get(file.path);
    if (content === undefined) throw new Error(`No content for ${file.path}`);
    return content;
  }

  async createFolder(path: string): Promise<void> {}
  async moveFile(): Promise<void> {}
  getMatchedPath(): string | null { return null; }
  getActiveFilePath(): string | null { return null; }

  // --- test helpers ---
  addAssignmentFolder(dirPath: string, folderName: string, noteName: string, frontmatter: string) {
    const notePath = `${dirPath}/${folderName}/${noteName}`;
    const note = {
      path: notePath,
      name: noteName,
      basename: noteName.replace(/\.md$/, ''),
      extension: 'md',
      parent: null,
    };
    const folder = {
      path: `${dirPath}/${folderName}`,
      name: folderName,
      parent: null,
      children: [note],
    };
    const dir = this.folders.get(dirPath) ?? { path: dirPath, name: dirPath, parent: null, children: [] };
    dir.children.push(folder);
    this.folders.set(dirPath, dir);
    this.contents.set(notePath, `---\n${frontmatter}\n---\nBody`);
  }
}

const CONTEXT = { coursePath: '01-carrera/isft-systems/subjects/bd-01', assignDir: '30-assignments' };
const DIR = `${CONTEXT.coursePath}/${CONTEXT.assignDir}`;

describe('AssignmentNumberService', () => {
  let vault: FakeVaultPort;
  let service: AssignmentNumberService;

  beforeEach(() => {
    vault = new FakeVaultPort();
    service = new AssignmentNumberService(vault as any);
  });

  describe('scanLastOfType', () => {
    it('returns null when dir missing', async () => {
      expect(await service.scanLastOfType('practico', CONTEXT)).toBeNull();
    });

    it('returns fm from newest folder matching type', async () => {
      vault.addAssignmentFolder(DIR, '2026-03-26-practico-intro', 'note1.md', 'unit: "01"\nassignment_number: "01"');
      vault.addAssignmentFolder(DIR, '2026-04-02-practico-sql', 'note2.md', 'unit: "02"\nassignment_number: "02"');
      const fm = await service.scanLastOfType('practico', CONTEXT);
      expect(fm?.assignment_number).toBe('02');
    });

    it('matches alias folders (trabajo-practico) when scanning practico', async () => {
      vault.addAssignmentFolder(DIR, '2026-02-10-trabajo-practico-legacy', 'n.md', 'unit: "01"\nassignment_number: "05"');
      const fm = await service.scanLastOfType('practico', CONTEXT);
      expect(fm?.assignment_number).toBe('05');
    });

    it('ignores folders of other types', async () => {
      vault.addAssignmentFolder(DIR, '2026-04-02-parcial-algo', 'n.md', 'unit: "01"\nassignment_number: "03"');
      expect(await service.scanLastOfType('practico', CONTEXT)).toBeNull();
    });

    it('skips notes starting with underscore', async () => {
      const dirPath = DIR;
      const folder = {
        path: `${dirPath}/2026-04-02-practico-x`,
        name: '2026-04-02-practico-x',
        parent: null,
        children: [{ path: 'p', name: '_draft.md', basename: '_draft', extension: 'md', parent: null }],
      };
      const dir = { path: dirPath, name: dirPath, parent: null, children: [folder] };
      vault.folders.set(dirPath, dir);
      expect(await service.scanLastOfType('practico', CONTEXT)).toBeNull();
    });
  });

  describe('scanLastOverall', () => {
    it('returns newest regardless of type', async () => {
      vault.addAssignmentFolder(DIR, '2026-03-01-practico-a', 'n1.md', 'unit: "01"\nassignment_number: "01"');
      vault.addAssignmentFolder(DIR, '2026-04-01-parcial-b', 'n2.md', 'unit: "03"\nassignment_number: "01"');
      const fm = await service.scanLastOverall(CONTEXT);
      expect(fm?.unit).toBe('03');
    });

    it('returns null when folder missing', async () => {
      expect(await service.scanLastOverall(CONTEXT)).toBeNull();
    });
  });

  describe('getNextAssignmentNumber', () => {
    it('is 01 when none exist', async () => {
      expect(await service.getNextAssignmentNumber('practico', CONTEXT)).toBe('01');
    });

    it('increments last of type, padded', async () => {
      vault.addAssignmentFolder(DIR, '2026-04-02-practico-sql', 'n.md', 'unit: "02"\nassignment_number: "02"');
      expect(await service.getNextAssignmentNumber('practico', CONTEXT)).toBe('03');
    });

    it('handles alias legacy numbers', async () => {
      vault.addAssignmentFolder(DIR, '2026-02-10-trabajo-practico-x', 'n.md', 'unit: "01"\nassignment_number: "07"');
      expect(await service.getNextAssignmentNumber('practico', CONTEXT)).toBe('08');
    });
  });

  describe('getNextUnit', () => {
    it('is 01 when none exist', async () => {
      expect(await service.getNextUnit(CONTEXT)).toBe('01');
    });

    it('returns latest overall unit padded', async () => {
      vault.addAssignmentFolder(DIR, '2026-04-01-parcial-b', 'n.md', 'unit: "4"\nassignment_number: "01"');
      expect(await service.getNextUnit(CONTEXT)).toBe('04');
    });
  });
});