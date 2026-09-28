import { VaultPort, VaultFolder, VaultFile } from "../ports/vault_port";
import { SettingsPort } from "../ports/settings_port";
import { FileSystemPort } from "../ports/file_system_port";
import {
  buildTitle,
  buildFilename,
  buildFolderName,
  buildBasePath,
  getScaffoldDirs,
  normalizeUnit,
  normalizeNumber,
  buildExternalCodePath,
  codeTypes,
} from "../domain/assignment_domain";
import { AssignmentFormData } from "../ports/modal_port";

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
  path: string;
}

export class CreateAssignmentService {
  constructor(
    private vaultPort: VaultPort,
    private settingsPort: SettingsPort,
    private fsPort: FileSystemPort,
  ) {}

  async execute(
    formData: AssignmentFormData,
    context: CreateAssignmentContext,
  ): Promise<CreateAssignmentResult> {
    const typeSlug = formData.type;
    const unit = normalizeUnit(formData.unit);
    const assignmentNumber = normalizeNumber(formData.assignment_number);
    const topic = formData.topic || "Introduccion";

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

    const folderName = buildFolderName({
      date: context.date,
      type: typeSlug,
      topic,
    });
    const basePath = buildBasePath({
      coursePath: context.coursePath,
      assignDir: context.assignDir,
      folderName,
    });

    const includeCode = formData.include_code === true;
    const canonicalType = typeSlug;
    const shouldCreateCode = includeCode || codeTypes.includes(canonicalType);

    const dirs = getScaffoldDirs(typeSlug, includeCode);

    const externalCodeBase = this.settingsPort.getExternalCodeBasePath();
    const vaultCodePath = this.settingsPort.getCodeFolderPath();

    const subject = context.coursePath.split("/").pop() || "";

    const shouldUseVaultCodePath = !!vaultCodePath && !externalCodeBase;

    for (const dir of dirs) {
      if (dir === "code" && (externalCodeBase || shouldUseVaultCodePath))
        continue;
      await this.vaultPort.createFolder(`${basePath}/${dir}`);
    }

    if (shouldCreateCode) {
      if (externalCodeBase) {
        if (this.fsPort.isDesktop()) {
          const externalPath = buildExternalCodePath({
            externalBase: externalCodeBase,
            subject,
            folderName,
          });
          await this.fsPort.createDir(externalPath);
          const vaultBase = this.vaultPort.getVaultBasePath?.() || "";
          const codeLinkPath = `${vaultBase}/${basePath}/code`;
          await this.fsPort.symlink(externalPath, codeLinkPath);
        } else {
          console.warn(
            "External code base set but not on desktop, falling back to vault folder",
          );
          await this.vaultPort.createFolder(`${basePath}/code`);
        }
      } else if (vaultCodePath) {
        await this.vaultPort.createFolder(
          `${vaultCodePath}/${folderName}-code`,
        );
      }
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
      submission_file_format: formData.submission_file_format || "",
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
      submission_file_format: formData.submission_file_format || "",
    });

    const path = `${basePath}/${filename}`;
    await this.vaultPort.createFile(path, frontmatter + "\n" + body);

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
## 📌 Descripción de la Actividad

- [Plataforma de Entrega](${params.submission_link}) | [Instrucciones](${params.instructions_link})
- Formato de entrega requerido: **${params.submission_file_format}**

### Objetivos:

1. Desarrollar consignas teóricas
2. Desarrollar consignas prácticas

## 📝 Desarrollo

### 1. ...

...

## 🛠️ Desarrollo Práctico

### 2. ...

...

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
    const topicSlug = params.topic
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s-]+/g, "-");
    const typeSlug = params.type
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s-]+/g, "-");

    const aiChatLinks = params.ai_chat_links
      .split("\n")
      .filter((link) => link.trim())
      .map((item) => `  - ${item.trim()}`)
      .join("\n");

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
${aiChatLinks ? "\n" + aiChatLinks : ""}
tags:
- ${topicSlug}
- second-year
- ${typeSlug}
- unit-${params.unit}
toc: false
block-headings: true
---`;
  }
}
