export type ArticleMark = {
  type: "bold" | "italic" | "code" | "link";
  attrs?: Record<string, unknown>;
};

export type ArticleNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ArticleNode[];
  marks?: ArticleMark[];
  text?: string;
};

export type ArticleDocument = ArticleNode & {
  type: "doc";
  content: ArticleNode[];
};

const allowedNodeTypes = new Set([
  "doc",
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "horizontalRule",
  "hardBreak",
  "codeBlock",
  "articleImage",
  "text"
]);

const emptyDocument: ArticleDocument = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

export function createEmptyArticleDocument(): ArticleDocument {
  return structuredClone(emptyDocument);
}

type ArticleImageInput = {
  src: string;
  alt?: string;
  caption?: string;
};

/**
 * Adds an uploaded image to a normalized top-level article document.
 *
 * The insertion is deliberately performed on the server as part of the image
 * upload transaction. This prevents a successfully uploaded file from being
 * left out of the saved article when the editor and autosave race each other.
 */
export function insertArticleImage(
  input: unknown,
  image: ArticleImageInput,
  afterBlockIndex?: number
): ArticleDocument | null {
  const document = normalizeArticleDocument(input) ?? createEmptyArticleDocument();
  const normalizedImageDocument = normalizeArticleDocument({
    type: "doc",
    content: [
      {
        type: "articleImage",
        attrs: {
          src: image.src,
          alt: image.alt ?? "",
          caption: image.caption ?? ""
        }
      }
    ]
  });
  const imageNode = normalizedImageDocument?.content[0];
  if (!imageNode || imageNode.type !== "articleImage") return null;

  const content = structuredClone(document.content);
  const emptyParagraph: ArticleNode = { type: "paragraph" };
  const hasRequestedPosition = Number.isInteger(afterBlockIndex) && content.length > 0;

  if (hasRequestedPosition) {
    const targetIndex = Math.min(Math.max(afterBlockIndex as number, 0), content.length - 1);
    if (isEmptyParagraph(content[targetIndex])) {
      content.splice(targetIndex, 1, imageNode, emptyParagraph);
    } else {
      const insertIndex = targetIndex + 1;
      content.splice(insertIndex, 0, imageNode);
      if (insertIndex === content.length - 1) content.push(emptyParagraph);
    }
  } else if (content.length && isEmptyParagraph(content[content.length - 1])) {
    content.splice(content.length - 1, 0, imageNode);
  } else {
    content.push(imageNode, emptyParagraph);
  }

  return { type: "doc", content };
}

export function normalizeArticleDocument(input: unknown): ArticleDocument | null {
  if (!isRecord(input) || input.type !== "doc" || !Array.isArray(input.content)) return null;

  let nodeCount = 0;

  function normalizeNode(value: unknown, depth: number): ArticleNode | null {
    if (depth > 12 || nodeCount > 10_000 || !isRecord(value) || typeof value.type !== "string") {
      return null;
    }

    if (!allowedNodeTypes.has(value.type)) return null;
    nodeCount += 1;

    if (value.type === "text") {
      if (typeof value.text !== "string") return null;
      return {
        type: "text",
        text: value.text.slice(0, 200_000),
        ...(Array.isArray(value.marks) ? { marks: normalizeMarks(value.marks) } : {})
      };
    }

    const attrs = normalizeNodeAttrs(value.type, value.attrs);
    if (value.type === "articleImage" && !attrs) return null;
    const content = Array.isArray(value.content)
      ? value.content
          .map((child) => normalizeNode(child, depth + 1))
          .filter((child): child is ArticleNode => Boolean(child))
      : undefined;

    return {
      type: value.type,
      ...(attrs ? { attrs } : {}),
      ...(content?.length ? { content } : {})
    };
  }

  const content = input.content
    .map((node) => normalizeNode(node, 1))
    .filter((node): node is ArticleNode => Boolean(node));

  return {
    type: "doc",
    content: content.length ? content : createEmptyArticleDocument().content
  };
}

function normalizeMarks(marks: unknown[]): ArticleMark[] {
  const result: ArticleMark[] = [];

  for (const mark of marks.slice(0, 8)) {
    if (!isRecord(mark) || typeof mark.type !== "string") continue;

    if (mark.type === "bold" || mark.type === "italic" || mark.type === "code") {
      result.push({ type: mark.type });
      continue;
    }

    if (mark.type === "link" && isRecord(mark.attrs) && typeof mark.attrs.href === "string") {
      const href = normalizeLinkUrl(mark.attrs.href);
      if (href) result.push({ type: "link", attrs: { href } });
    }
  }

  return result;
}

function normalizeNodeAttrs(type: string, value: unknown): Record<string, unknown> | undefined {
  const attrs = isRecord(value) ? value : {};

  if (type === "heading") {
    return { level: attrs.level === 3 ? 3 : 2 };
  }

  if (type === "orderedList") {
    const start = typeof attrs.start === "number" ? Math.max(1, Math.min(9999, Math.round(attrs.start))) : 1;
    return { start };
  }

  if (type === "codeBlock") {
    const language = typeof attrs.language === "string" ? attrs.language.replace(/[^a-z0-9_+-]/gi, "").slice(0, 40) : null;
    return language ? { language } : undefined;
  }

  if (type === "articleImage") {
    const src = typeof attrs.src === "string" ? normalizeImageUrl(attrs.src) : null;
    if (!src) return undefined;
    return {
      src,
      alt: typeof attrs.alt === "string" ? attrs.alt.trim().slice(0, 300) : "",
      caption: typeof attrs.caption === "string" ? attrs.caption.trim().slice(0, 500) : ""
    };
  }

  return undefined;
}

export function legacyArticleToDocument(content: string): ArticleDocument {
  if (!content.trim()) return createEmptyArticleDocument();

  const blocks: ArticleNode[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { type: "bulletList" | "orderedList"; items: string[] } | null = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", content: legacyInlineContent(paragraph.join(" ")) });
    paragraph = [];
  }

  function flushQuote() {
    if (!quote.length) return;
    blocks.push({
      type: "blockquote",
      content: [{ type: "paragraph", content: legacyInlineContent(quote.join(" ")) }]
    });
    quote = [];
  }

  function flushList() {
    if (!list) return;
    blocks.push({
      type: list.type,
      ...(list.type === "orderedList" ? { attrs: { start: 1 } } : {}),
      content: list.items.map((item) => ({
        type: "listItem",
        content: [{ type: "paragraph", content: legacyInlineContent(item) }]
      }))
    });
    list = null;
  }

  function flushAll() {
    flushParagraph();
    flushQuote();
    flushList();
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushAll();
      blocks.push({ type: "horizontalRule" });
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line);
    if (imageMatch && normalizeImageUrl(imageMatch[2])) {
      flushAll();
      blocks.push({
        type: "articleImage",
        attrs: { src: imageMatch[2], alt: imageMatch[1], caption: "" }
      });
      continue;
    }

    const headingMatch = /^(#{2,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushAll();
      blocks.push({
        type: "heading",
        attrs: { level: headingMatch[1].length === 2 ? 2 : 3 },
        content: legacyInlineContent(headingMatch[2])
      });
      continue;
    }

    const quoteMatch = /^>\s?(.+)$/.exec(line);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    const unorderedMatch = /^[-*]\s+(.+)$/.exec(line);
    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== "bulletList") {
        flushList();
        list = { type: "bulletList", items: [] };
      }
      list.items.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(line);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== "orderedList") {
        flushList();
        list = { type: "orderedList", items: [] };
      }
      list.items.push(orderedMatch[1]);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line);
  }

  flushAll();
  return { type: "doc", content: blocks.length ? blocks : createEmptyArticleDocument().content };
}

function legacyInlineContent(text: string): ArticleNode[] {
  const nodes: ArticleNode[] = [];
  const pattern = /(\{(small|large|xl):([^{}]+)\})|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push({ type: "text", text: text.slice(cursor, match.index) });

    if (match[2] && match[3]) {
      nodes.push({ type: "text", text: match[3] });
    } else if (match[5]) {
      nodes.push({ type: "text", text: match[5], marks: [{ type: "bold" }] });
    } else if (match[7]) {
      nodes.push({ type: "text", text: match[7], marks: [{ type: "italic" }] });
    } else if (match[9]) {
      nodes.push({ type: "text", text: match[9], marks: [{ type: "code" }] });
    } else if (match[11] && match[12]) {
      const href = normalizeLinkUrl(match[12]);
      nodes.push({
        type: "text",
        text: match[11],
        ...(href ? { marks: [{ type: "link", attrs: { href } }] } : {})
      });
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push({ type: "text", text: text.slice(cursor) });
  return nodes.length ? nodes : [{ type: "text", text }];
}

export function articleDocumentToText(document: ArticleDocument | null | undefined): string {
  if (!document) return "";
  const pieces: string[] = [];

  function visit(node: ArticleNode) {
    if (node.type === "text" && node.text) pieces.push(node.text);
    if (node.type === "hardBreak") pieces.push("\n");
    node.content?.forEach(visit);
    if (["paragraph", "heading", "blockquote", "listItem", "codeBlock", "articleImage"].includes(node.type)) {
      pieces.push("\n");
    }
  }

  document.content.forEach(visit);
  return pieces.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export function getArticleWordCount(document: ArticleDocument | null | undefined, legacyContent = "") {
  const text = articleDocumentToText(document) || legacyContent;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getArticleReadingTime(document: ArticleDocument | null | undefined, legacyContent = "") {
  return Math.max(1, Math.ceil(getArticleWordCount(document, legacyContent) / 220));
}

export function isSafeExternalLink(href: string) {
  return /^https?:\/\//i.test(href);
}

function normalizeLinkUrl(value: string) {
  const url = value.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(url)) return url.slice(0, 2048);
  return null;
}

function normalizeImageUrl(value: string) {
  const url = value.trim();
  if (url.startsWith("/api/media/") || /^https?:\/\//i.test(url)) return url.slice(0, 2048);
  return null;
}

function isEmptyParagraph(node: ArticleNode | undefined) {
  if (!node || node.type !== "paragraph") return false;
  return !node.content?.some((child) => child.type !== "text" || Boolean(child.text));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
