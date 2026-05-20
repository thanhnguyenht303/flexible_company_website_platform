export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};
