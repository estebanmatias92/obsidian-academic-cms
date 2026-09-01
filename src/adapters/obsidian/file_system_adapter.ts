import { FileSystemPort, FileSystemError } from '../../ports/file_system_port';
import type AcademicCMSPlugin from '../../plugin/main';
import * as fs from 'fs';
import { dirname, isAbsolute } from 'path';

export class ObsidianFileSystemAdapter implements FileSystemPort {
  private readonly isDesktopAvailable: boolean;

  constructor(private plugin: AcademicCMSPlugin) {
    this.isDesktopAvailable = typeof process !== 'undefined' && !!fs.promises;
  }

  isDesktop(): boolean {
    return this.isDesktopAvailable;
  }

  getVaultBasePath(): string | null {
    const adapter = this.plugin.app.vault.adapter;
    if (adapter && typeof (adapter as any).getBasePath === 'function') {
      return (adapter as any).getBasePath();
    }
    return null;
  }

  async createDir(path: string): Promise<void> {
    try {
      await fs.promises.mkdir(path, { recursive: true });
    } catch (e: any) {
      if (e.code === 'EEXIST') return;
      throw new FileSystemError(`Failed to create dir '${path}': ${e.message}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async symlink(target: string, linkPath: string): Promise<void> {
    try {
      const linkDir = dirname(linkPath);
      await this.createDir(linkDir);
      const alreadyExists = await this.exists(linkPath);
      if (alreadyExists) {
        try {
          await fs.promises.unlink(linkPath);
        } catch (e: any) {
          throw new FileSystemError(`Symlink '${linkPath}' exists and cannot be removed: ${e.message}`);
        }
      }
      const targetIsDir = (await fs.promises.stat(target)).isDirectory();
      await fs.promises.symlink(target, linkPath, targetIsDir ? 'junction' : 'file');
    } catch (e: any) {
      if (e instanceof FileSystemError) throw e;
      throw new FileSystemError(`Failed to symlink '${target}' -> '${linkPath}': ${e.message}`);
    }
  }
}