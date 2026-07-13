import { type Language } from "@/lib/i18n/translations";
import { articleDocumentToText, normalizeArticleDocument } from "@/modules/blog/article-document";

type ContentRecord = object;

export function localizedField<T extends ContentRecord>(item: T, field: string, language: Language) {
  const record = item as Record<string, unknown>;
  const original = stringValue(record[field]);
  if (language === "en") return original;

  return stringValue(record[`${field}Vi`]) || original;
}

export function localizeTeamMember<T extends ContentRecord>(member: T, language: Language) {
  return {
    ...member,
    position: localizedField(member, "position", language),
    bio: localizedField(member, "bio", language)
  };
}

export function localizeService<T extends ContentRecord>(service: T, language: Language) {
  return {
    ...service,
    name: localizedField(service, "name", language),
    summary: localizedField(service, "summary", language),
    description: localizedField(service, "description", language)
  };
}

export function localizeProduct<T extends ContentRecord>(product: T, language: Language) {
  return {
    ...product,
    name: localizedField(product, "name", language),
    summary: localizedField(product, "summary", language),
    description: localizedField(product, "description", language)
  };
}

export function localizePost<T extends ContentRecord>(post: T, language: Language) {
  const record = post as Record<string, unknown>;
  const englishDocument = normalizeArticleDocument(record.contentJson);
  const vietnameseDocument = normalizeArticleDocument(record.contentJsonVi);
  const localizedDocument = language === "vi" && articleDocumentToText(vietnameseDocument)
    ? vietnameseDocument
    : englishDocument;

  return {
    ...post,
    title: localizedField(post, "title", language),
    excerpt: localizedField(post, "excerpt", language),
    content: localizedField(post, "content", language),
    contentJson: localizedDocument
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : "";
}
