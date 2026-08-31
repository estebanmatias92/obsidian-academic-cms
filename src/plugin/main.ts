import { App, Plugin, Notice, TFile } from 'obsidian';
import { AcademicCMSSettings, DEFAULT_SETTINGS } from './settings';

export default class AcademicCMSPlugin extends Plugin {
  settings: AcademicCMSSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new (await import('./settings')).AcademicCMSSettingTab(this.app, this));

    this.addCommand({
      id: 'create-assignment',
      name: 'Create Assignment',
      callback: () => this.openAssignmentModal(),
    });

    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (!(file instanceof TFile)) return;
      })
    );

    console.log('Academic CMS loaded');
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async openAssignmentModal() {
    new Notice('Academic CMS: Create Assignment — TODO: open ModalPort (Phase 3b)');
  }
}
