export const formFieldTypes = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "time",
  "select",
  "radio",
  "checkboxGroup",
  "checkbox",
  "file",
  "url",
  "hidden",
  "consent"
] as const;

export type FormFieldType = (typeof formFieldTypes)[number];

export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST", "SPAM", "ARCHIVED"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const leadPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type LeadPriority = (typeof leadPriorities)[number];

export const submissionStatuses = ["NEW", "REVIEWING", "RESOLVED", "SPAM", "ARCHIVED"] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const qaStatuses = ["NEW", "REVIEWING", "ANSWERED", "PUBLISHED", "ARCHIVED", "SPAM"] as const;
export type QaStatus = (typeof qaStatuses)[number];

export type FormFieldOption = {
  label: string;
  value: string;
};

export type PublicFormField = {
  id: string;
  type: FormFieldType;
  label: string;
  key: string;
  helpText?: string | null;
  placeholder?: string | null;
  required: boolean;
  options?: FormFieldOption[] | null;
  defaultValue?: string | null;
  sortOrder: number;
};

export type PublicForm = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  successMessage?: string | null;
  redirectUrl?: string | null;
  sourceType: string;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  fields: PublicFormField[];
};
