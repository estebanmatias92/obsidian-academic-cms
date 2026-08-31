import { App, Plugin, Notice, TFile } from 'obsidian';
import { AcademicCMSSettings, DEFAULT_SETTINGS, AcademicCMSSettingTab } from './settings';
import { ObsidianModalPort, AssignmentFormPrefill } from '../adapters/obsidian/modal_adapter';
import { ObsidianVaultAdapter } from '../adapters/obsidian/vault_adapter';
import { AssignmentNumberService } from '../use_cases/assignment_number_service';
import { AssignmentFormContext } from '../ports/modal_port';

export default class AcademicCMSPlugin extends Plugin {
  settings: AcademicCMSSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new AcademicCMSSettingTab(this.app, this));

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

  /**
   * Match active file path against a wildcard pattern (port of shared/get_matched_path.js).
   * e.g. pattern "*\/*systems*\/subjects\/*\/" matches "foo/isft-systems/subjects/bd-01/..."
   */
  private matchPathPattern(activePath: string, pathPattern: string): string | null {
    const normalized = pathPattern.replace(/^\/|\/$/g, '');
    const regexParts = normalized
      .split('/')
      .filter(Boolean)
      .map((segment) => (segment === '*' ? '[^/]+' : segment.replace(/\*/g, '[^/]*')));
    const pathRegex = new RegExp(`^${regexParts.join('\\/')}(\\/|$)`, 'i');
    if (!pathRegex.test(activePath)) return null;
    const segments = activePath.split('/').filter(Boolean);
    return segments.slice(0, regexParts.length).join('/') || null;
  }

  /**
   * Build the assignment context from the active file.
   * Returns null (with a Notice) when not inside a course folder.
   */
  private getContext(): AssignmentFormContext | null {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile?.path) {
      new Notice('Academic CMS: no active file');
      return null;
    }

    const coursePath = this.matchPathPattern(activeFile.path, '*/*systems*/subjects/*/');
    if (!coursePath) {
      new Notice('No se detectó una materia — run this from inside a course folder');
      return null;
    }

    const assignDir = activeFile.path.includes('/40-exams/') ? '40-exams' : '30-assignments';

    let course: { name: string; code: string } | undefined;
    const courseFile = this.app.vault.getAbstractFileByPath(`${coursePath}/_course.md`);
    if (courseFile instanceof TFile) {
      const fm = this.app.metadataCache.getFileCache(courseFile)?.frontmatter;
      if (fm?.course) course = { name: fm.course, code: fm.code ?? '' };
    }

    // Career file lives at the career root: strip "/subjects/<x>" (2 segments) from coursePath
    let career: { student: string } | undefined;
    const careerPath = coursePath.split('/').slice(0, -2).join('/');
    const careerFile = this.app.vault.getAbstractFileByPath(`${careerPath}/_career.md`);
    if (careerFile instanceof TFile) {
      const student = this.app.metadataCache.getFileCache(careerFile)?.frontmatter?.student;
      if (student) career = { student };
    }

    return { coursePath, assignDir, course, career };
  }

  async openAssignmentModal() {
    const context = this.getContext();
    if (!context) return;

    // Prefill unit/assignment_number from vault scan (Phase 3b — via VaultPort)
    const vault = new ObsidianVaultAdapter(this.app);
    const numberService = new AssignmentNumberService(vault);

    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

    const prefill: AssignmentFormPrefill = {
      unit: await numberService.getNextUnit(context),
      date: iso(today),
      due_date: iso(addDays(today, 7)),
    };

    const modal = new ObsidianModalPort(this.app);
    const data = await modal.openAssignmentForm(context, prefill);

    if (!data) {
      new Notice('Creación cancelada');
      return;
    }

    // Phase 3b: next assignment number for selected type (type chosen inside the modal)
    data.assignment_number = await numberService.getNextAssignmentNumber(
      data.type,
      context
    );

    new Notice(`Assignment scaffold: ${data.type} ${data.assignment_number} — ${data.topic}`);
    // Phase 3c: CreateAssignmentService.execute(data, context) writes folders + note.
  }
}