import type { AuthorityKey } from "@/config/admin-authorities";

const fileCategoryAuthorities: Record<string, AuthorityKey> = {
  "job-application-resume": "careers.manage",
  "form-submission-file": "forms.manage"
};

export function getPrivateFileAuthority(category: string) {
  return fileCategoryAuthorities[category] ?? null;
}
