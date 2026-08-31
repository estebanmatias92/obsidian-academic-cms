import { VaultPort } from '../ports/vault_port';
import { SettingsPort } from '../ports/settings_port';
import {
  buildTitle,
  buildFilename,
  buildFolderName,
  buildBasePath,
  getScaffoldDirs,
  normalizeUnit,
  normalizeNumber,
} from '../domain/assignment_domain';
import { AssignmentFormData } from '../ports/modal_port';

export interface CreateAssignmentContext {
  coursePath: string;
  assignDir: string;
  course: { name: string; code: string };
  career: { student: string };
  date: string;
}

export interface CreateAssignmentResult {
  title: string;
  filename: string;
  basePath: string;
  frontmatter: string;
  body: string;
  path: string; // full vault path where the note was created
}

export class CreateAssignmentService {
  constructor(
    private vaultPort: VaultPort,
    private settingsPort: SettingsPort
  ) {}

  async execute(formData: AssignmentFormData, context: CreateAssignmentContext): Promise<CreateAssignmentResult> {
    const typeSlug = formData.type;
    const unit = normalizeUnit(formData.unit);
    const assignmentNumber = normalizeNumber(formData.assignment_number);
    const topic = formData.topic || 'Introduccion';

    const title = buildTitle({
      courseName: context.course.name,
      unit,
      type: typeSlug,
      assignmentNumber,
      topic,
    });

    const filenameBase = buildFilename({
      date: context.date,
      student: context.career.student,
      courseCode: context.course.code,
      courseName: context.course.name,
      type: typeSlug,
      assignmentNumber,
      topic,
    });
    const filename = `${filenameBase}.md`;

    const folderName = buildFolderName({ date: context.date, type: typeSlug, topic });
    const basePath = buildBasePath({ coursePath: context.coursePath, assignDir: context.assignDir, folderName });

    const includeCode = formData.include_code === true;
    const dirs = getScaffoldDirs(typeSlug, includeCode);
    const codeFolderPath = this.settingsPort.getCodeFolderPath();

    for (const dir of dirs) {
      if (dir === 'code' && codeFolderPath) continue; // custom location handled below
      await this.vaultPort.createFolder(`${basePath}/${dir}`);
    }

    if (dirs.includes('code') && codeFolderPath) {
      // User-configured vault-relative code path (SettingsTab), overrides default basePath/code
      await this.vaultPort.createFolder(`${codeFolderPath}/${folderName}-code`);
    }

    const frontmatter = this.buildFrontmatter({
      title,
      filename,
      type: typeSlug,
      date: context.date,
      due_date: formData.due_date,
      author: context.career.student,
      course: context.course,
      unit,
      assignmentNumber,
      topic,
      difficulty: formData.difficulty,
      priority: formData.priority,
      submission_type: formData.submission_type,
      submission_file_format: formData.submission_file_format || '',
      submission_platform: formData.submission_platform,
      instructions_link: formData.instructions_link,
      submission_link: formData.submission_link,
      ai_chat_links: formData.ai_chat_links,
    });

    const body = this.buildBody({
      title,
      student: context.career.student,
      submission_link: formData.submission_link,
      instructions_link: formData.instructions_link,
      submission_file_format: formData.submission_file_format || '',
    });

    const path = `${basePath}/${filename}`;
    await this.vaultPort.createFile(path, frontmatter + '\n' + body);

    return { title, filename, basePath, frontmatter, body, path };
  }

  private buildBody(params: {
    title: string;
    student: string;
    submission_link: string;
    instructions_link: string;
    submission_file_format: string;
  }): string {
    return `# ${params.title}
<!--
- **Materia**: \`= this.course.name\`
- **Unidad**: \`= this.unit\`
- **Actividad**: \`= this.assignment\`
- **Tema**: \`= this.topic\`
- **Profesor**: \`= this.professor\`
- **Estudiante**: \`= this.student\`
- **Fecha de entrega**: \`= this.due_date\`
- **Completado**: \`= this.status_completed\`
- **Instrucciones**: \`= this.links_instructions\`
- **Copia Local**: \`= this.links_local_file\`
- **Enlace de Entrega**: \`= this.links_submission\`
- **Estudiante**: ${params.student}
-->

## 📌 Descripción de la Actividad

- [Plataforma de Entrega](${params.submission_link}) | [Instrucciones](${params.instructions_link})
- Objetivos principales:
	- Desarrollar consignas teórica-prácticas
- Formato de entrega requerido: **${params.submission_file_format}**

## 📝 Desarrollo

### Punto 1



## 🛠️ Desarrollo Práctico




## 📚 Material de Referencia

- ...


## 📂 Archivos Adjuntos

- ...`;
  }

  private buildFrontmatter(params: {
    title: string;
    filename: string;
    type: string;
    date: string;
    due_date: string;
    author: string;
    course: { name: string; code: string };
    unit: string;
    assignmentNumber: string;
    topic: string;
    difficulty: string;
    priority: string;
    submission_type: string;
    submission_file_format: string;
    submission_platform: string;
    instructions_link: string;
    submission_link: string;
    ai_chat_links: string;
  }): string {
    const topicSlug = params.topic.normalize('NFKD').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s-]+/g, '-');
    const typeSlug = params.type.normalize('NFKD').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s-]+/g, '-');

    const aiChatLinks = params.ai_chat_links
      .split('\n')
      .filter((link) => link.trim())
      .map((item) => `  - ${item.trim()}`)
      .join('\n');

    return `---
title: "${params.title}"
filename: "${params.filename}"
type: "${params.type}"
date: "${params.date}"
due_date: "${params.due_date}"
author: "${params.author}"
course:
  name: "${params.course.name}"
  code: "${params.course.code}"
unit: "${params.unit}"
assignment_number: "${params.assignmentNumber}"
topic: "${params.topic}"
difficulty: ${params.difficulty}
priority: ${params.priority}
status_completed: false
status_submitted: false
status_graded: false
grading:
  max_points: 100
  earned_points: 0
  weight: 0.00
submission_type: "${params.submission_type}"
submission_file_format: "${params.submission_file_format}"
submission_platform: "${params.submission_platform}"
links_instructions: "${params.instructions_link}"
links_submission: "${params.submission_link}"
links_local_copy: ""
ai_chat_links:
${aiChatLinks ? '\n' + aiChatLinks : ''}
tags:
- ${topicSlug}
- second-year
- ${typeSlug}
- unit-${params.unit}
toc: false
---`;
  }
}