import { VaultFile, VaultFolder } from './vault_port';

export interface FileSystemPort {
  isDesktop(): boolean;
  getVaultBasePath(): string | null;
  createDir(path: string): Promise<void>;
  symlink(target: string, linkPath: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}