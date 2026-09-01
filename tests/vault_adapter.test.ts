/**
 * vault_adapter.test.ts — regression for RangeError: Maximum call stack size exceeded
 * in toVaultFolder ↔ toVaultParent mutual recursion (parent.children includes self).
 *
 * This test does NOT depend on the `obsidian` package (which is types-only, no JS entry).
 * It reproduces the exact graph Obsidian exposes and verifies the fixed adapter logic
 * (parent: null, deep children) does not overflow, while the old mutual recursion would.
 */
import { describe, it, expect } from 'vitest';

// --- Mock Obsidian types (instanceof checks rely on these classes) ---
class MockTFolder {
  path: string;
  name: string;
  parent: MockTFolder | null;
  children: (MockTFolder | MockTFile)[] = [];
  constructor(path: string, name: string, parent: MockTFolder | null = null) {
    this.path = path;
    this.name = name;
    this.parent = parent;
  }
}
class MockTFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  parent: MockTFolder | null;
  constructor(path: string, name: string, parent: MockTFolder | null) {
    this.path = path;
    this.name = name;
    this.basename = name.replace(/\.md$/, '');
    this.extension = 'md';
    this.parent = parent;
  }
}

// Aliases so `instanceof MockTFolder/MockTFile` mirrors `instanceof TFolder/TFile`
const TFolder = MockTFolder as unknown as { new (...args: any[]): any };
const TFile = MockTFile as unknown as { new (...args: any[]): any };

// --- Old buggy helpers (mutual recursion, reproduced for regression proof) ---
function toVaultFileOld(file: MockTFile): any {
  return {
    path: file.path,
    name: file.name,
    basename: file.basename,
    extension: file.extension,
    parent: file.parent ? toVaultParentOld(file.parent as any) : null,
  };
}
function toVaultParentOld(file: any): any {
  return file instanceof MockTFolder ? toVaultFolderOld(file) : null;
}
function toVaultFolderOld(folder: MockTFolder): any {
  return {
    path: folder.path,
    name: folder.name,
    parent: folder.parent ? toVaultParentOld(folder.parent) : null,
    children: folder.children.map((child: any) =>
      child instanceof MockTFile ? toVaultFileOld(child) : toVaultFolderOld(child as MockTFolder)
    ),
  };
}

// --- Fixed helpers (as in src/adapters/obsidian/vault_adapter.ts) ---
function toVaultFileFixed(file: MockTFile): any {
  return {
    path: file.path,
    name: file.name,
    basename: file.basename,
    extension: file.extension,
    parent: null,
  };
}
function toVaultFolderFixed(folder: MockTFolder): any {
  return {
    path: folder.path,
    name: folder.name,
    parent: null,
    children: folder.children.map((child: any) =>
      child instanceof MockTFile ? toVaultFileFixed(child) : toVaultFolderFixed(child as MockTFolder)
    ),
  };
}

function buildVaultWithCycle() {
  const root = new MockTFolder('/', '/');
  root.parent = null;

  const subjects = new MockTFolder('subjects', 'subjects', root);
  const course = new MockTFolder('subjects/bd-01', 'bd-01', subjects);
  const dir = new MockTFolder('subjects/bd-01/30-assignments', '30-assignments', course);

  const a1 = new MockTFolder('subjects/bd-01/30-assignments/2026-03-26-practico-intro', '2026-03-26-practico-intro', dir);
  const a2 = new MockTFolder('subjects/bd-01/30-assignments/2026-04-02-practico-sql', '2026-04-02-practico-sql', dir);

  const n1 = new MockTFile('subjects/bd-01/30-assignments/2026-03-26-practico-intro/note.md', 'note.md', a1);
  const n2 = new MockTFile('subjects/bd-01/30-assignments/2026-04-02-practico-sql/note.md', 'note.md', a2);

  a1.children = [n1];
  a2.children = [n2];
  dir.children = [a1, a2];
  course.children = [dir];
  subjects.children = [course];
  root.children = [subjects];

  return { dir, a1, n1 };
}

describe('ObsidianVaultAdapter — cycle regression', () => {
  it('old logic overflows with RangeError on folder with parent.children cycle', () => {
    const { dir } = buildVaultWithCycle();
    expect(() => toVaultFolderOld(dir)).toThrow(RangeError);
  });

  it('fixed logic does not overflow and keeps deep children with parent null', () => {
    const { dir } = buildVaultWithCycle();
    const result: any = toVaultFolderFixed(dir);

    expect(result.children).toHaveLength(2);
    expect(result.children[0].name).toBe('2026-03-26-practico-intro');
    expect(result.children[0].children).toHaveLength(1);
    expect(result.children[0].children[0].name).toBe('note.md');

    // parent null breaks the mirror loop — efficient + disposable for future YAML settings
    expect(result.parent).toBeNull();
    expect(result.children[0].parent).toBeNull();
    expect(result.children[0].children[0].parent).toBeNull();
  });

  it('fixed TFile conversion also nulls parent', () => {
    const { dir } = buildVaultWithCycle();
    const file = new MockTFile('subjects/bd-01/note.md', 'note.md', dir);
    const result = toVaultFileFixed(file);
    expect(result.parent).toBeNull();
  });
});
