import type { ReactNode } from "react";
import {
  isSafeExternalLink,
  legacyArticleToDocument,
  normalizeArticleDocument,
  type ArticleMark,
  type ArticleNode
} from "@/modules/blog/article-document";

type ArticleContentProps = {
  content?: string | null;
  document?: unknown;
  className?: string;
};

export function ArticleContent({ content = "", document, className = "article-body" }: ArticleContentProps) {
  const normalizedDocument = normalizeArticleDocument(document) ?? legacyArticleToDocument(content ?? "");

  return (
    <div className={className}>
      {normalizedDocument.content.map((node, index) => renderNode(node, `article-${index}`))}
    </div>
  );
}

function renderNode(node: ArticleNode, key: string): ReactNode {
  const children = node.content?.map((child, index) => renderNode(child, `${key}-${index}`));

  if (node.type === "text") {
    return renderMarkedText(node.text ?? "", node.marks ?? [], key);
  }

  if (node.type === "paragraph") return <p key={key}>{children}</p>;
  if (node.type === "heading") {
    return node.attrs?.level === 3 ? <h3 key={key}>{children}</h3> : <h2 key={key}>{children}</h2>;
  }
  if (node.type === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  if (node.type === "bulletList") return <ul key={key}>{children}</ul>;
  if (node.type === "orderedList") {
    const start = typeof node.attrs?.start === "number" ? node.attrs.start : 1;
    return <ol key={key} start={start}>{children}</ol>;
  }
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "horizontalRule") return <hr key={key} />;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "codeBlock") {
    return (
      <pre className="article-code-block" key={key}>
        <code>{getNodeText(node)}</code>
      </pre>
    );
  }
  if (node.type === "articleImage") {
    const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
    if (!src) return null;
    const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
    const caption = typeof node.attrs?.caption === "string" ? node.attrs.caption : "";

    return (
      <figure className="article-image" key={key}>
        {/* Stored media routes do not currently expose intrinsic dimensions required by next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return <span key={key}>{children}</span>;
}

function renderMarkedText(text: string, marks: ArticleMark[], key: string): ReactNode {
  let result: ReactNode = text;

  marks.forEach((mark, index) => {
    const markKey = `${key}-mark-${index}`;
    if (mark.type === "bold") result = <strong key={markKey}>{result}</strong>;
    if (mark.type === "italic") result = <em key={markKey}>{result}</em>;
    if (mark.type === "code") result = <code key={markKey}>{result}</code>;
    if (mark.type === "link" && typeof mark.attrs?.href === "string") {
      const href = mark.attrs.href;
      result = (
        <a
          href={href}
          key={markKey}
          {...(isSafeExternalLink(href) ? { rel: "noopener noreferrer", target: "_blank" } : {})}
        >
          {result}
        </a>
      );
    }
  });

  return result;
}

function getNodeText(node: ArticleNode): string {
  if (node.type === "text") return node.text ?? "";
  return node.content?.map(getNodeText).join("") ?? "";
}
