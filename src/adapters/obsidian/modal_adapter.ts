import { App, Modal, Setting } from 'obsidian';
import { ModalPort, AssignmentFormData } from '../../ports/modal_port';
import { typeOptions, typeAliases, codeTypes } from '../../domain/assignment_types';
import { getDisplayName } from '../../domain/assignment_types';

export interface AssignmentFormPrefill {
  unit?: string;
  assignment_number?: string;
  date?: string;
  due_date?: string;
}

const EXTENSION_MAP: Record<string, string> = {
  'word-document': '.docx',
  PDF: '.pdf',
  'source-code': '.cpp',
  presentation: '.pptx',
  video: '.mp4',
  handwritten: '',
};

export class AssignmentFormModal extends Modal {
  private resolvePromise!: (data: AssignmentFormData | null) => void;
  private done = false;

  private data: AssignmentFormData = {
    type: 'practico',
    topic: 'Introduccion',
    unit: '01',
    date: '',
    due_date: '',
    difficulty: 'medium',
    priority: 'medium',
    submission_type: 'PDF',
    submission_platform: 'Google_Classroom',
    submission_link: '',
    instructions_link: '',
    ai_chat_links: '',
  };

  constructor(app: App, prefill: AssignmentFormPrefill = {}) {
    super(app);
    if (prefill.unit) this.data.unit = prefill.unit;
    if (prefill.assignment_number) this.data.assignment_number = prefill.assignment_number;
    if (prefill.date) this.data.date = prefill.date;
    if (prefill.due_date) this.data.due_date = prefill.due_date;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Nueva Actividad' });

    new Setting(contentEl).setName('Tipo').addDropdown((d) => {
      for (const [value, label] of Object.entries(typeOptions)) {
        d.addOption(value, label);
      }
      d.setValue(this.data.type);
      d.onChange((v) => (this.data.type = v));
    });

    new Setting(contentEl).setName('Tema').addText((t) => {
      t.setValue(this.data.topic);
      t.onChange((v) => (this.data.topic = v));
    });

    new Setting(contentEl).setName('Unidad').addText((t) => {
      t.setValue(this.data.unit);
      t.onChange((v) => (this.data.unit = v));
    });

    new Setting(contentEl).setName('Fecha de asignación').addText((t) => {
      t.setValue(this.data.date);
      t.onChange((v) => (this.data.date = v));
    });

    new Setting(contentEl).setName('Fecha de entrega').addText((t) => {
      t.setValue(this.data.due_date);
      t.onChange((v) => (this.data.due_date = v));
    });

    new Setting(contentEl).setName('Dificultad').addDropdown((d) => {
      d.addOption('very-easy', 'Muy Facil')
        .addOption('easy', 'Facil')
        .addOption('medium', 'Media')
        .addOption('hard', 'Dificil')
        .addOption('very-hard', 'Muy Dificil');
      d.setValue(this.data.difficulty);
      d.onChange((v) => (this.data.difficulty = v));
    });

    new Setting(contentEl).setName('Prioridad').addDropdown((d) => {
      d.addOption('low', 'Baja')
        .addOption('medium', 'Media')
        .addOption('high', 'Alta')
        .addOption('urgent', 'Urgente');
      d.setValue(this.data.priority);
      d.onChange((v) => (this.data.priority = v));
    });

    new Setting(contentEl).setName('Formato').addDropdown((d) => {
      d.addOption('word-document', 'Documento Word')
        .addOption('PDF', 'PDF')
        .addOption('source-code', 'Codigo Fuente')
        .addOption('presentation', 'Presentacion')
        .addOption('video', 'Video')
        .addOption('handwritten', 'Manuscrito');
      d.setValue(this.data.submission_type);
      d.onChange((v) => (this.data.submission_type = v));
    });

    new Setting(contentEl).setName('Plataforma').addDropdown((d) => {
      d.addOption('Google_Classroom', 'Google Classroom')
        .addOption('Moodle', 'Moodle')
        .addOption('Email', 'Email')
        .addOption('GitHub', 'GitHub')
        .addOption('in_person', 'Entrega Fisica')
        .addOption('no-submit', 'Sin Entrega');
      d.setValue(this.data.submission_platform);
      d.onChange((v) => (this.data.submission_platform = v));
    });

    new Setting(contentEl).setName('Enlace de entrega').addText((t) => {
      t.setValue(this.data.submission_link);
      t.onChange((v) => (this.data.submission_link = v));
    });

    new Setting(contentEl).setName('Instrucciones').addText((t) => {
      t.setValue(this.data.instructions_link);
      t.onChange((v) => (this.data.instructions_link = v));
    });

    new Setting(contentEl).setName('Chats IA').addTextArea((t) => {
      t.setPlaceholder('https://chat.deepseek.com/...\nhttps://notebooklm.google.com/...');
      t.setValue(this.data.ai_chat_links);
      t.onChange((v) => (this.data.ai_chat_links = v));
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText('Cancelar').onClick(() => this.finish(null))
      )
      .addButton((btn) =>
        btn
          .setButtonText('Crear Actividad')
          .setCta()
          .onClick(() => {
            const canonical = typeAliases[this.data.type]
              ? this.data.type
              : Object.keys(typeAliases).find((k) => typeAliases[k].includes(this.data.type)) || this.data.type;
            this.data.include_code = codeTypes.includes(canonical);
            this.data.submission_file_format = EXTENSION_MAP[this.data.submission_type] || '';
            this.finish({ ...this.data });
          })
      );
  }

  onClose() {
    this.contentEl.empty();
    if (!this.done) this.finish(null);
  }

  private finish(data: AssignmentFormData | null) {
    if (this.done) return;
    this.done = true;
    this.close();
    this.resolvePromise(data);
  }

  open(): Promise<AssignmentFormData | null> {
    super.open();
    return new Promise((resolve) => (this.resolvePromise = resolve));
  }
}

export class ObsidianModalPort implements ModalPort {
  constructor(private app: App) {}

  async openAssignmentForm(
    _context: {
      coursePath: string;
      assignDir: string;
      course?: { name: string; code: string };
      career?: { student: string };
    },
    prefill: AssignmentFormPrefill = {}
  ): Promise<AssignmentFormData | null> {
    return new AssignmentFormModal(this.app, prefill).open();
  }
}