export interface SettingsPort {
  getExternalCodeBasePath(): string | undefined;
  getCodeFolderPath(): string | undefined;
}