import { App, TFile, TFolder, TAbstractFile } from 'obsidian';
import { VaultPort, VaultFile, VaultFolder, FrontmatterData } from '../../ports/vault_port';

function toVaultFile(file: TFile): VaultFile {
  return {
    path: file.path,
    name: file.name,
    basename: file.basename,
    extension: file.extension,
    parent: file.parent ? toVaultParent(file.parent) : null,
  };
}

function toVaultParent(file: TAbstractFile): VaultFolder | null {
  return file instanceof TFolder ? toVaultFolder(file) : null;
}

function toVaultFolder(folder: TFolder): VaultFolder {
  return {
    path: folder.path,
    name: folder.name,
    parent: folder.parent ? toVaultParent(folder.parent) : null,
    children: folder.children.map((child) =>
      child instanceof TFile ? toVaultFile(child) : toVaultFolder(child as TFolder)
    ),
  };
}

export class ObsidianVaultAdapter implements VaultPort {
  constructor(private app: App) {}

  getAbstractFileByPath(path: string): VaultFolder | VaultFile | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return null;
    if (file instanceof TFile) return toVaultFile(file);
    if (file instanceof TFolder) return toVaultFolder(file);
    return null;
  }

  getVaultBasePath(): string | null {
    const adapter = this.app.vault.adapter;
    if (adapter && typeof (adapter as any).getBasePath === 'function') {
      return (adapter as any).getBasePath();
    }
    return null;
  }

  async readFile(file: VaultFile): Promise<string> {
    const tFile = this.app.vault.getAbstractFileByPath(file.path);
    if (!(tFile instanceof TFile)) throw new Error(`File not found: ${file.path}`);
    return this.app.vault.read(tFile);
  }

  async createFolder(path: string): Promise<void> {
    try {
      await this.app.vault.createFolder(path);
    } catch (e: any) {
      if (e.message?.includes('Folder already exists')) return;
      throw e;
    }
  }

  async createFile(path: string, content: string): Promise<VaultFile> {
    const tFile = await this.app.vault.create(path, content);
    return toVaultFile(tFile);
  }

  async moveFile(file: VaultFile, newPath: string): Promise<void> {
    const tFile = this.app.vault.getAbstractFileByPath(file.path);
    if (!(tFile instanceof TFile)) throw new Error(`File not found: ${file.path}`);
    await this.app.vault.rename(tFile, newPath);
  }

  getMatchedPath(pattern: string): string | null {
    return this.app.vault.getAbstractFileByPath(pattern)?.path ?? null;
  }

  getActiveFilePath(): string | null {
    return this.app.workspace.getActiveFile()?.path ?? null;
  }
}