import { VaultPort, VaultFolder, VaultFile, FrontmatterData } from '../ports/vault_port';
import { resolveType } from '../domain/assignment_types';
import { typeAliases } from '../domain/assignment_types';

export interface AssignmentNumberContext {
  coursePath: string;
  assignDir: string;
}

export class AssignmentNumberService {
  constructor(private vaultPort: VaultPort) {}

  async scanLastOfType(type: string, context: AssignmentNumberContext): Promise<FrontmatterData | null> {
    const dirPath = `${context.coursePath}/${context.assignDir}`;
    const folder = this.vaultPort.getAbstractFileByPath(dirPath) as VaultFolder | null;
    if (!folder || !folder.children) return null;

    const aliases = typeAliases[type] || [type];
    const candidates = folder.children
      .filter((child): child is VaultFolder => 'children' in child && child.children !== undefined)
      .filter((child) => {
        const m = child.name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
        if (!m) return false;
        // Match one alias followed by '-' or end → handles multi-segment slugs (trabajo-practico)
        return aliases.some((a) => m[1] === a || m[1].startsWith(`${a}-`));
      })
      .sort((a, b) => b.name.localeCompare(a.name));

    if (candidates.length === 0) return null;

    for (const candidate of candidates) {
      const note = candidate.children?.find(
        (c): c is VaultFile => 'extension' in c && c.extension === 'md' && !c.name.startsWith('_')
      );
      if (!note) continue;
      const content = await this.vaultPort.readFile(note);
      const fm = this.parseFrontmatter(content);
      if (fm) return fm;
    }
    return null;
  }

  async scanLastOverall(context: AssignmentNumberContext): Promise<FrontmatterData | null> {
    const dirPath = `${context.coursePath}/${context.assignDir}`;
    const folder = this.vaultPort.getAbstractFileByPath(dirPath) as VaultFolder | null;
    if (!folder || !folder.children) return null;

    const candidates = folder.children
      .filter((child): child is VaultFolder => 'children' in child && child.children !== undefined)
      .filter((child) => /^\d{4}-\d{2}-\d{2}-/.test(child.name))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (candidates.length === 0) return null;

    for (const candidate of candidates) {
      const note = candidate.children?.find(
        (c): c is VaultFile => 'extension' in c && c.extension === 'md' && !c.name.startsWith('_')
      );
      if (!note) continue;
      const content = await this.vaultPort.readFile(note);
      const fm = this.parseFrontmatter(content);
      if (fm) return fm;
    }
    return null;
  }

  async getNextAssignmentNumber(type: string, context: AssignmentNumberContext): Promise<string> {
    const lastOfType = await this.scanLastOfType(type, context);
    if (lastOfType && lastOfType.assignment_number) {
      return String(parseInt(lastOfType.assignment_number, 10) + 1).padStart(2, '0');
    }
    return '01';
  }

  async getNextUnit(context: AssignmentNumberContext): Promise<string> {
    const lastOverall = await this.scanLastOverall(context);
    if (lastOverall && lastOverall.unit) {
      return String(parseInt(lastOverall.unit, 10)).padStart(2, '0');
    }
    return '01';
  }

  private parseFrontmatter(content: string): FrontmatterData | null {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;
    const fm = fmMatch[1];
    const get = (key: string): string | null => {
      const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'));
      return m ? m[1].trim() : null;
    };
    const unit = get('unit');
    const assignment_number = get('assignment_number');
    if (!unit && !assignment_number) return null;
    return {
      unit: unit ?? undefined,
      assignment_number: assignment_number ?? undefined,
    };
  }
}