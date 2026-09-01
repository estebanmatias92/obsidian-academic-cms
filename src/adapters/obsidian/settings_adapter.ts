import { SettingsPort } from '../../ports/settings_port';
import type AcademicCMSPlugin from '../../plugin/main';

export class ObsidianSettingsAdapter implements SettingsPort {
  constructor(private plugin: AcademicCMSPlugin) {}

  getCodeFolderPath(): string | undefined {
    const path = this.plugin.settings.codeFolderPath;
    return path && path.trim() !== '' ? path : undefined;
  }

  getExternalCodeBasePath(): string | undefined {
    const path = this.plugin.settings.externalCodeBasePath;
    return path && path.trim() !== '' ? path : undefined;
  }
}

