import { App, PluginSettingTab, Setting } from 'obsidian';
import type AcademicCMSPlugin from './main';

export interface AcademicCMSSettings {
  codeFolderPath: string;
}

export const DEFAULT_SETTINGS: AcademicCMSSettings = {
  codeFolderPath: '',
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
  }
}
