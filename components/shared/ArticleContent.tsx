import type { ReactNode } from "react";

type ArticleContentProps = {
  content: string;
  className?: string;
};

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; alt: string; url: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "divider" };

export function ArticleContent({ content, className = "article-body" }: ArticleContentProps) {
  const blocks = parseArticleBlocks(content);

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 2 ? "h2" : "h3";
          return <Heading key={index}>{renderInline(block.text)}</Heading>;
        }

        if (block.type === "quote") {
          return <blockquote key={index}>{renderInline(block.text)}</blockquote>;
        }

        if (block.type === "image") {
          return (
            <figure className="article-image" key={index}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.url} alt={block.alt} />
              {block.alt ? <figcaption>{block.alt}</figcaption> : null}
            </figure>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "divider") {
          return <hr key={index} />;
        }

        return <p key={index}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

function parseArticleBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  }

  function flushList() {
    if (!list) return;
    blocks.push({ type: list.type, items: list.items });
    list = null;
  }

  function flushQuote() {
    if (!quote.length) return;
    blocks.push({ type: "quote", text: quote.join(" ") });
    quote = [];
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushAll();
      blocks.push({ type: "divider" });
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line);
    if (imageMatch && isAllowedImageUrl(imageMatch[2])) {
      flushAll();
      blocks.push({ type: "image", alt: imageMatch[1], url: imageMatch[2] });
      continue;
    }

    const headingMatch = /^(#{2,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushAll();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length === 2 ? 2 : 3,
        text: headingMatch[2]
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
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(line);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(orderedMatch[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }

  flushAll();
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\{(small|large|xl):([^{}]+)\})|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

    if (match[2] && match[3]) {
      nodes.push(
        <span className={`article-text-size article-text-size--${match[2]}`} key={nodes.length}>
          {match[3]}
        </span>
      );
    } else if (match[5]) {
      nodes.push(<strong key={nodes.length}>{match[5]}</strong>);
    } else if (match[7]) {
      nodes.push(<em key={nodes.length}>{match[7]}</em>);
    } else if (match[9]) {
      nodes.push(<code key={nodes.length}>{match[9]}</code>);
    } else if (match[11] && match[12]) {
      nodes.push(
        <a key={nodes.length} href={match[12]}>
          {match[11]}
        </a>
      );
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function isAllowedImageUrl(url: string) {
  return url.startsWith("/api/media/") || url.startsWith("blob:") || /^https?:\/\//.test(url);
}
