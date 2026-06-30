import Link from "next/link";
import type { BuilderBlock } from "@/modules/page-builder/page-builder.types";

type VisualPageRendererProps = {
  blocks: BuilderBlock[];
  editing?: boolean;
};

export function VisualPageRenderer({ blocks, editing = false }: VisualPageRendererProps) {
  return (
    <div className={editing ? "visual-page visual-page--editing" : "visual-page"}>
      {blocks.filter((block) => block.enabled || editing).map((block) => (
        <BuilderBlockView block={block} editing={editing} key={block.id} />
      ))}
    </div>
  );
}

function BuilderBlockView({ block, editing }: { block: BuilderBlock; editing: boolean }) {
  const style = {
    "--builder-bg": block.background || "transparent",
    "--builder-color": block.color || "inherit",
    "--builder-padding-y": `${block.paddingY ?? 56}px`,
    "--builder-font-size": `${block.fontSize ?? 18}px`,
    "--builder-block-width": `${block.blockWidth ?? 100}%`,
    "--builder-min-height": `${block.minHeight ?? 0}px`,
    "--builder-spacer-height": `${block.height ?? 48}px`
  } as React.CSSProperties;

  return (
    <section
      className={`builder-public-block builder-public-block--${block.type} builder-public-block--${block.width ?? "normal"} builder-public-block--${block.align ?? "left"}${!block.enabled ? " is-disabled" : ""}`}
      style={style}
    >
      <div className="builder-public-inner">
        {editing && !block.enabled ? <span className="badge">Hidden</span> : null}
        {renderBlockContent(block)}
      </div>
    </section>
  );
}

function renderBlockContent(block: BuilderBlock) {
  switch (block.type) {
    case "hero":
      return (
        <div className="builder-hero">
          <p className="article-kicker">Welcome</p>
          <h1>{block.title}</h1>
          {block.subtitle ? <p>{block.subtitle}</p> : null}
          {block.buttonText && block.buttonUrl ? (
            <Link className="button" href={block.buttonUrl}>
              {block.buttonText}
            </Link>
          ) : null}
        </div>
      );
    case "text":
      return (
        <div className="builder-text">
          {block.title ? <h2>{block.title}</h2> : null}
          {block.text ? <p>{block.text}</p> : null}
        </div>
      );
    case "image":
      return (
        <figure className="builder-image">
          {block.imageId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/media/${block.imageId}`} alt={block.imageAlt ?? ""} />
          ) : (
            <div className="builder-image-placeholder">Image</div>
          )}
          {block.title ? <figcaption>{block.title}</figcaption> : null}
        </figure>
      );
    case "button":
      return block.buttonText && block.buttonUrl ? (
        <Link className="button" href={block.buttonUrl}>
          {block.buttonText}
        </Link>
      ) : null;
    case "banner":
      return (
        <div className="builder-banner">
          {block.title ? <h2>{block.title}</h2> : null}
          {block.text ? <p>{block.text}</p> : null}
        </div>
      );
    case "cards":
      return (
        <div>
          {block.title ? <h2>{block.title}</h2> : null}
          <div className="builder-card-grid">
            {(block.cards ?? []).map((card, index) => {
              const content = (
                <>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </>
              );
              return card.href ? (
                <Link className="card" href={card.href} key={`${card.title}-${index}`}>
                  {content}
                </Link>
              ) : (
                <div className="card" key={`${card.title}-${index}`}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      );
    case "twoColumn":
      return (
        <div className="builder-two-column">
          <div>
            {block.leftTitle ? <h2>{block.leftTitle}</h2> : null}
            {block.leftText ? <p>{block.leftText}</p> : null}
          </div>
          <div>
            {block.rightTitle ? <h2>{block.rightTitle}</h2> : null}
            {block.rightText ? <p>{block.rightText}</p> : null}
          </div>
        </div>
      );
    case "divider":
      return <hr className="builder-divider" />;
    case "spacer":
      return <div className="builder-spacer" />;
    case "contactCta":
      return (
        <div className="builder-banner">
          {block.title ? <h2>{block.title}</h2> : null}
          {block.text ? <p>{block.text}</p> : null}
          {block.buttonText && block.buttonUrl ? (
            <Link className="button" href={block.buttonUrl}>
              {block.buttonText}
            </Link>
          ) : null}
        </div>
      );
  }
}
