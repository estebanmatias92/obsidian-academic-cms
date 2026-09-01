import { App, PluginSettingTab, Setting } from 'obsidian';
import type AcademicCMSPlugin from './main';

export interface AcademicCMSSettings {
  codeFolderPath: string;
  externalCodeBasePath: string;
}

export const DEFAULT_SETTINGS: AcademicCMSSettings = {
  codeFolderPath: '',
  externalCodeBasePath: '',
};

export class AcademicCMSSettingTab extends PluginSettingTab {
  plugin: AcademicCMSPlugin;
  constructor(app: App, plugin: AcademicCMSPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Academic CMS Settings' });
    new Setting(containerEl)
      .setName('Code folder path')
      .setDesc('Vault-relative path for code/ when assignment type includes code (e.g. practico). Leave empty for default vault folder structure: course/assignDir/folder/code. Agnostic, no hardcode ~/Projects.')
      .addText((text) =>
        text
          .setPlaceholder('e.g. 30-assignments or leave empty')
          .setValue(this.plugin.settings.codeFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.codeFolderPath = value;
            await this.plugin.saveSettings();
          })
      );
    containerEl.createEl('hr');
    new Setting(containerEl)
      .setName('External code base path')
      .setDesc('Absolute host filesystem path for code symlink. Plugin creates <externalBase>/<subject>/<folderName>/ linked from vault. Leave empty for default vault folder. Desktop only.')
      .addText((text) =>
        text
          .setPlaceholder('e.g. /home/matt/Projects/.../isft151-analisis-sistemas')
          .setValue(this.plugin.settings.externalCodeBasePath)
          .onChange(async (value) => {
            this.plugin.settings.externalCodeBasePath = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
