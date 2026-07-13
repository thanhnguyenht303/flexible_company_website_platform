import { describe, expect, it } from "vitest";
import {
  articleDocumentToText,
  insertArticleImage,
  legacyArticleToDocument,
  normalizeArticleDocument
} from "../modules/blog/article-document";

describe("article document", () => {
  it("converts legacy article syntax into structured blocks without losing readable text", () => {
    const document = legacyArticleToDocument([
      "Opening **bold idea**.",
      "",
      "## A useful heading",
      "",
      "> A memorable quote",
      "",
      "- First point",
      "- Second point",
      "",
      "![Accessible description](/api/media/image-1)"
    ].join("\n"));

    expect(document.content.map((node) => node.type)).toEqual([
      "paragraph",
      "heading",
      "blockquote",
      "bulletList",
      "articleImage"
    ]);
    expect(articleDocumentToText(document)).toContain("Opening bold idea");
    expect(articleDocumentToText(document)).toContain("Second point");
  });

  it("removes unsupported nodes and unsafe link marks", () => {
    const document = normalizeArticleDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Safe text", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }
          ]
        },
        { type: "iframe", attrs: { src: "https://example.com" } }
      ]
    });

    expect(document?.content).toHaveLength(1);
    expect(document?.content[0].content?.[0].marks).toEqual([]);
  });

  it("rejects images that do not use an allowed media URL", () => {
    const document = normalizeArticleDocument({
      type: "doc",
      content: [
        { type: "articleImage", attrs: { src: "javascript:alert(1)", alt: "Bad image" } },
        { type: "paragraph", content: [{ type: "text", text: "Kept" }] }
      ]
    });

    expect(document?.content.map((node) => node.type)).toEqual(["paragraph"]);
  });

  it("preserves uploaded inline-image attributes through normalization", () => {
    const document = normalizeArticleDocument({
      type: "doc",
      content: [
        {
          type: "articleImage",
          attrs: {
            src: "/api/media/image-123",
            alt: "A useful diagram",
            caption: "Diagram caption"
          }
        }
      ]
    });

    expect(document?.content[0]).toEqual({
      type: "articleImage",
      attrs: {
        src: "/api/media/image-123",
        alt: "A useful diagram",
        caption: "Diagram caption"
      }
    });
  });

  it("inserts an uploaded image at the requested block and keeps a writing paragraph after it", () => {
    const document = insertArticleImage(
      {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "First paragraph" }] },
          { type: "paragraph" }
        ]
      },
      {
        src: "/api/media/image-456",
        alt: "A saved diagram",
        caption: "The saved caption"
      },
      1
    );

    expect(document?.content).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "First paragraph" }] },
      {
        type: "articleImage",
        attrs: {
          src: "/api/media/image-456",
          alt: "A saved diagram",
          caption: "The saved caption"
        }
      },
      { type: "paragraph" }
    ]);
  });
});
