export interface VaultFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  parent: VaultFolder | null;
  children?: VaultFile[];
}

export interface VaultFolder {
  path: string;
  name: string;
  parent: VaultFolder | null;
  children: (VaultFile | VaultFolder)[];
}

export interface VaultPort {
  getAbstractFileByPath(path: string): VaultFolder | VaultFile | null;
  readFile(file: VaultFile): Promise<string>;
  createFolder(path: string): Promise<void>;
  createFile(path: string, content: string): Promise<VaultFile>;
  moveFile(file: VaultFile, newPath: string): Promise<void>;
  getMatchedPath(pattern: string): string | null;
  getActiveFilePath(): string | null;
}

export interface FrontmatterData {
  unit?: string;
  assignment_number?: string;
  [key: string]: string | undefined;
}