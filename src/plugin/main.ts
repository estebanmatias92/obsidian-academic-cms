import { App, Plugin, Notice, TFile, TFolder } from 'obsidian';
import { AcademicCMSSettings, DEFAULT_SETTINGS, AcademicCMSSettingTab } from './settings';
import { ObsidianModalPort, AssignmentFormPrefill } from '../adapters/obsidian/modal_adapter';
import { ObsidianVaultAdapter } from '../adapters/obsidian/vault_adapter';
import { ObsidianSettingsAdapter } from '../adapters/obsidian/settings_adapter';
import { ObsidianFileSystemAdapter } from '../adapters/obsidian/file_system_adapter';
import { AssignmentNumberService } from '../use_cases/assignment_number_service';
import { CreateAssignmentService } from '../use_cases/create_assignment_service';
import type { AssignmentFormContext, AssignmentFormData } from '../ports/modal_port';

export default class AcademicCMSPlugin extends Plugin {
  settings: AcademicCMSSettings;
  private vaultAdapter!: ObsidianVaultAdapter;
  private settingsAdapter!: ObsidianSettingsAdapter;
  private fsAdapter!: ObsidianFileSystemAdapter;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new AcademicCMSSettingTab(this.app, this));

    this.vaultAdapter = new ObsidianVaultAdapter(this.app);
    this.settingsAdapter = new ObsidianSettingsAdapter(this);
    this.fsAdapter = new ObsidianFileSystemAdapter(this);

    this.addCommand({
      id: 'create-assignment',
      name: 'Create Assignment',
      checkCallback: (checking) => {
        const ctx = this.getContextFromActiveFile();
        if (checking) return !!ctx;
        if (!ctx) return false;
        this.openAssignmentModalForContext(ctx).catch(console.error);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFolder) {
          const ctx = this.getContextFromPath(file.path);
          if (ctx) {
            menu.addItem((item) =>
              item
                .setTitle('New Assignment')
                .setIcon('folder-plus')
                .onClick(() => this.openAssignmentModalForPath(file.path))
            );
          }
        }
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

  private findSubjectPathFromPath(filePath: string): string | null {
    const parts = filePath.split('/');
    const subjectsIdx = parts.findIndex((p) => p === 'subjects');
    if (subjectsIdx === -1) return null;
    if (subjectsIdx + 2 > parts.length) return null;
    return parts.slice(0, subjectsIdx + 2).join('/');
  }

  private getContextFromPath(filePath: string): AssignmentFormContext | null {
    const coursePath = this.matchPathPattern(filePath, '*/*systems*/subjects/*/') 
      || this.findSubjectPathFromPath(filePath);
    if (!coursePath) return null;

    const assignDir = filePath.includes('/40-exams/') ? '40-exams' : '30-assignments';

    let course: { name: string; code: string } | undefined;
    const courseFile = this.app.vault.getAbstractFileByPath(`${coursePath}/_course.md`);
    if (courseFile instanceof TFile) {
      const fm = this.app.metadataCache.getFileCache(courseFile)?.frontmatter;
      if (fm?.course) course = { name: fm.course, code: fm.code ?? '' };
    }

    let career: { student: string } | undefined;
    const careerPath = coursePath.split('/').slice(0, -2).join('/');
    const careerFile = this.app.vault.getAbstractFileByPath(`${careerPath}/_career.md`);
    if (careerFile instanceof TFile) {
      const student = this.app.metadataCache.getFileCache(careerFile)?.frontmatter?.student;
      if (student) career = { student };
    }

    return { coursePath, assignDir, course, career };
  }

  private getContextFromActiveFile(): AssignmentFormContext | null {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile?.path) {
      new Notice('Academic CMS: no active file');
      return null;
    }

    const context = this.getContextFromPath(activeFile.path);
    if (!context) {
      new Notice('No se detectó una materia — run this from inside a course folder');
    }
    return context;
  }

  private async openAssignmentModal() {
    const context = this.getContextFromActiveFile();
    if (!context) return;
    await this.openAssignmentModalForContext(context);
  }

  private async openAssignmentModalForPath(path: string) {
    const context = this.getContextFromPath(path);
    if (!context) return;
    await this.openAssignmentModalForContext(context);
  }

  private async openAssignmentModalForContext(context: AssignmentFormContext) {
    try {
      if (!context.course || !context.career) {
        new Notice('Academic CMS: missing course or career metadata (_course.md / _career.md)');
        return;
      }

      const numberService = new AssignmentNumberService(this.vaultAdapter);

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

      data.assignment_number = await numberService.getNextAssignmentNumber(
        data.type,
        context
      );

      const createService = new CreateAssignmentService(
        this.vaultAdapter,
        this.settingsAdapter,
        this.fsAdapter
      );

      const result = await createService.execute(data, {
        coursePath: context.coursePath,
        assignDir: context.assignDir,
        course: context.course,
        career: context.career,
        date: data.date || prefill.date || '',
      });

      new Notice(`Created: ${result.title}`);
      const created = this.app.vault.getAbstractFileByPath(result.path);
      if (created instanceof TFile || created instanceof TFolder) {
        await this.app.workspace.getLeaf().openFile(this.app.vault.getAbstractFileByPath(result.path) as TFile);
      }
    } catch (e) {
      console.error('Academic CMS: failed to create assignment', e);
      new Notice(`Academic CMS error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}