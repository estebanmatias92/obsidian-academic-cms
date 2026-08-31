export interface AssignmentFormData {
  type: string;
  topic: string;
  unit: string;
  date: string;
  due_date: string;
  difficulty: string;
  priority: string;
  submission_type: string;
  submission_platform: string;
  submission_link: string;
  instructions_link: string;
  ai_chat_links: string;
  assignment_number?: string;
  include_code?: boolean;
  submission_file_format?: string;
}

export interface AssignmentFormContext {
  coursePath: string;
  assignDir: string;
  course?: { name: string; code: string };
  career?: { student: string };
}

export interface AssignmentFormPrefill {
  unit?: string;
  assignment_number?: string;
  date?: string;
  due_date?: string;
}

export interface ModalPort {
  openAssignmentForm(
    context: AssignmentFormContext,
    prefill?: AssignmentFormPrefill
  ): Promise<AssignmentFormData | null>;
}