import Link from "next/link";
import { InfiniteLoopScroller } from "@/components/shared/InfiniteLoopScroller";
import { slugify } from "@/lib/slug";
import type { BuilderBlock } from "@/modules/page-builder/page-builder.types";

export type DynamicBuilderContent = {
  team?: Array<{
    id?: string | null;
    name: string;
    position?: string | null;
    bio?: string | null;
    photoId?: string | null;
  }>;
  services?: Array<{
    name: string;
    slug: string;
    summary?: string | null;
    imageId?: string | null;
  }>;
  posts?: Array<{
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    featuredImageId?: string | null;
  }>;
};

type VisualPageRendererProps = {
  blocks: BuilderBlock[];
  editing?: boolean;
  includeDisabled?: boolean;
  dynamicContent?: DynamicBuilderContent;
};

export const visualCanvasMinHeight = 720;
export const visualCanvasBottomPadding = 120;

export function getVisualCanvasHeight(blocks: BuilderBlock[]) {
  return Math.max(
    visualCanvasMinHeight,
    ...blocks.map((block) => (block.canvasY ?? 0) + (block.canvasHeight ?? block.minHeight ?? 180) + visualCanvasBottomPadding)
  );
}

export function VisualPageRenderer({ blocks, editing = false, includeDisabled = false, dynamicContent }: VisualPageRendererProps) {
  const visibleBlocks = blocks.filter((block) => block.enabled || includeDisabled || editing);
  const usesCanvas = visibleBlocks.some(isCanvasBlock);
  const canvasHeight = getVisualCanvasHeight(visibleBlocks);

  if (usesCanvas || !visibleBlocks.length) {
    return (
      <div className={editing ? "visual-page visual-page--editing visual-page--canvas" : "visual-page visual-page--canvas"}>
        <div className="visual-page-canvas" style={{ "--visual-canvas-height": `${canvasHeight}px` } as React.CSSProperties}>
          {visibleBlocks.map((block) => (
            <BuilderBlockView block={block} editing={editing} canvas dynamicContent={dynamicContent} key={block.id} />
          ))}
          {!visibleBlocks.length ? <div className="visual-page-empty" aria-hidden="true" /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={editing ? "visual-page visual-page--editing" : "visual-page"}>
      {visibleBlocks.map((block) => (
        <BuilderBlockView block={block} editing={editing} dynamicContent={dynamicContent} key={block.id} />
      ))}
    </div>
  );
}

export function BuilderBlockView({
  block,
  editing,
  canvas = false,
  dynamicContent
}: {
  block: BuilderBlock;
  editing: boolean;
  canvas?: boolean;
  dynamicContent?: DynamicBuilderContent;
}) {
  const contentDirection = block.contentDirection ?? "horizontal";
  const rotatesTextContent = isCanvasBlock(block) && isRotatableTextBlock(block);
  const titleStyle = block.textStyle?.title;
  const bodyStyle = block.textStyle?.body;
  const shadow = block.shadow ?? getDefaultShadow(block);
  const style = {
    "--builder-bg": block.background || "transparent",
    "--builder-color": block.color || "inherit",
    "--builder-border-color": block.borderColor || getDefaultBorderColor(block),
    "--builder-border-radius": `${block.borderRadius ?? getDefaultBorderRadius(block)}px`,
    "--builder-opacity": block.opacity ?? 1,
    "--builder-shadow": getShadowValue(shadow),
    "--builder-button-bg": block.background || "var(--color-primary)",
    "--builder-padding-y": `${block.paddingY ?? 56}px`,
    "--builder-font-size": `${block.fontSize ?? 18}px`,
    "--builder-font-family": block.fontFamily || "inherit",
    "--builder-font-weight": block.bold ? 800 : 400,
    "--builder-font-style": block.italic ? "italic" : "normal",
    "--builder-text-decoration": block.underline ? "underline" : "none",
    "--builder-line-height": block.lineHeight ?? 1.55,
    "--builder-letter-spacing": `${block.letterSpacing ?? 0}px`,
    "--builder-paragraph-spacing": `${block.paragraphSpacing ?? 14}px`,
    "--builder-gap": `${block.gap ?? 16}px`,
    "--builder-padding": `${block.padding ?? 24}px`,
    "--builder-block-width": `${block.blockWidth ?? 100}%`,
    "--builder-min-height": `${block.minHeight ?? 0}px`,
    "--builder-spacer-height": `${block.height ?? 48}px`,
    "--builder-canvas-x": `${block.canvasX ?? 0}%`,
    "--builder-canvas-y": `${block.canvasY ?? 0}px`,
    "--builder-canvas-width": `${block.canvasWidth ?? 100}%`,
    "--builder-canvas-height": `${block.canvasHeight ?? block.minHeight ?? 180}px`,
    "--builder-image-fit": block.imageFit ?? "cover",
    "--builder-image-zoom": block.imageZoom ?? 1,
    "--builder-image-offset-x": `${block.imageOffsetX ?? 0}%`,
    "--builder-image-offset-y": `${block.imageOffsetY ?? 0}%`,
    "--builder-focal-x": `${block.focalX ?? 50}%`,
    "--builder-focal-y": `${block.focalY ?? 50}%`,
    "--builder-title-font-family": titleStyle?.fontFamily || block.fontFamily || "inherit",
    "--builder-title-font-size": `${titleStyle?.fontSize ?? getDefaultTitleFontSize(block)}px`,
    "--builder-title-font-weight": titleStyle?.fontWeight ?? (block.bold ? 800 : 700),
    "--builder-title-color": titleStyle?.color || block.color || "inherit",
    "--builder-title-line-height": titleStyle?.lineHeight ?? block.lineHeight ?? 1.15,
    "--builder-title-letter-spacing": `${titleStyle?.letterSpacing ?? block.letterSpacing ?? 0}px`,
    "--builder-title-align": titleStyle?.align ?? block.align ?? "left",
    "--builder-title-white-space": titleStyle?.wrap ? "normal" : "nowrap",
    "--builder-body-font-family": bodyStyle?.fontFamily || block.fontFamily || "inherit",
    "--builder-body-font-size": `${bodyStyle?.fontSize ?? block.fontSize ?? 18}px`,
    "--builder-body-font-weight": bodyStyle?.fontWeight ?? (block.bold ? 700 : 400),
    "--builder-body-color": bodyStyle?.color || block.color || "inherit",
    "--builder-body-line-height": bodyStyle?.lineHeight ?? block.lineHeight ?? 1.55,
    "--builder-body-letter-spacing": `${bodyStyle?.letterSpacing ?? block.letterSpacing ?? 0}px`,
    "--builder-body-align": bodyStyle?.align ?? block.align ?? "left"
  } as React.CSSProperties;

  return (
    <section
      className={`builder-public-block builder-public-block--${block.type} builder-public-block--${block.width ?? "normal"} builder-public-block--${block.align ?? "left"} builder-public-block--v-${block.verticalAlign ?? "top"} builder-public-block--dir-${contentDirection} builder-public-block--shadow-${shadow}${(block.hoverEffect ?? hasDefaultHoverEffect(block)) ? " builder-public-block--hoverable" : ""}${rotatesTextContent ? " builder-public-block--rotates-text" : ""}${canvas ? " builder-public-block--canvas" : ""}${block.stackOnMobile ? " builder-public-block--stack-mobile" : ""}${!block.enabled ? " is-disabled" : ""}`}
      style={style}
    >
      <div className="builder-public-inner">
        {editing && !block.enabled ? <span className="badge">Hidden</span> : null}
        <div className="builder-public-content">{renderBlockContent(block, dynamicContent)}</div>
      </div>
    </section>
  );
}

function renderBlockContent(block: BuilderBlock, dynamicContent?: DynamicBuilderContent) {
  switch (block.type) {
    case "hero":
      return (
        <div className="builder-hero">
          <p className="article-kicker builder-body-text">Welcome</p>
          <h1 className="builder-title-text">{block.title}</h1>
          {block.subtitle ? <p className="builder-body-text">{block.subtitle}</p> : null}
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
          {block.title ? <h2 className="builder-title-text">{block.title}</h2> : null}
          {block.text ? <p className="builder-body-text">{block.text}</p> : null}
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
          {block.title ? <figcaption className="builder-title-text">{block.title}</figcaption> : null}
        </figure>
      );
    case "button":
      return block.buttonText && block.buttonUrl ? (
        <Link className="button builder-title-text" href={block.buttonUrl}>
          {block.buttonText}
        </Link>
      ) : null;
    case "banner":
      return (
        <div className="builder-banner">
          {block.title ? <h2 className="builder-title-text">{block.title}</h2> : null}
          {block.text ? <p className="builder-body-text">{block.text}</p> : null}
        </div>
      );
    case "cards":
      return (
        <div>
          {block.title ? <h2 className="builder-title-text">{block.title}</h2> : null}
          <div className="builder-card-grid">
            {(block.cards ?? []).map((card, index) => {
              const content = (
                <>
                  <h3 className="builder-title-text">{card.title}</h3>
                  <p className="builder-body-text">{card.text}</p>
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
            {block.leftTitle ? <h2 className="builder-title-text">{block.leftTitle}</h2> : null}
            {block.leftText ? <p className="builder-body-text">{block.leftText}</p> : null}
          </div>
          <div>
            {block.rightTitle ? <h2 className="builder-title-text">{block.rightTitle}</h2> : null}
            {block.rightText ? <p className="builder-body-text">{block.rightText}</p> : null}
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
          {block.title ? <h2 className="builder-title-text">{block.title}</h2> : null}
          {block.text ? <p className="builder-body-text">{block.text}</p> : null}
          {block.buttonText && block.buttonUrl ? (
            <Link className="button" href={block.buttonUrl}>
              {block.buttonText}
            </Link>
          ) : null}
        </div>
      );
    case "team":
      return <DynamicContentBlock block={block} items={dynamicContent?.team ?? []} kind="team" />;
    case "services":
      return <DynamicContentBlock block={block} items={dynamicContent?.services ?? []} kind="services" />;
    case "blog":
      return <DynamicContentBlock block={block} items={dynamicContent?.posts ?? []} kind="blog" />;
  }
}

function DynamicContentBlock({
  block,
  kind,
  items
}: {
  block: BuilderBlock;
  kind: "team" | "services" | "blog";
  items: NonNullable<DynamicBuilderContent["team" | "services" | "posts"]>;
}) {
  const cards =
    kind === "team"
      ? (items as NonNullable<DynamicBuilderContent["team"]>).map((item, index) => <TeamCard item={item} key={`team-${item.name}-${index}`} />)
      : kind === "services"
        ? (items as NonNullable<DynamicBuilderContent["services"]>).map((item, index) => <ServiceCard item={item} key={`services-${item.slug}-${index}`} />)
        : (items as NonNullable<DynamicBuilderContent["posts"]>).map((item, index) => <BlogCard item={item} key={`blog-${item.slug}-${index}`} />);

  return (
    <div className="builder-dynamic-block">
      {block.title ? (
        <div className="builder-dynamic-header">
          <h2 className="builder-title-text builder-dynamic-title">
            {(block.titleLinkEnabled ?? true) ? (
              <Link href={block.titleLinkUrl || getDefaultDynamicRoute(kind)}>{block.title}</Link>
            ) : (
              block.title
            )}
          </h2>
          {(block.titleLinkEnabled ?? true) ? (
            <Link className="builder-dynamic-view-all" href={block.titleLinkUrl || getDefaultDynamicRoute(kind)}>
              View all
            </Link>
          ) : null}
        </div>
      ) : null}
      <InfiniteLoopScroller
        direction={block.scrollDirection ?? "horizontal"}
        mode={block.scrollMode ?? "none"}
        autoScroll={block.autoScroll}
        showArrows={block.showCarouselArrows}
        speed={block.autoScrollSpeed ?? 40}
      >
        {cards}
      </InfiniteLoopScroller>
    </div>
  );
}

function TeamCard({ item }: { item: NonNullable<DynamicBuilderContent["team"]>[number] }) {
  return (
    <Link className="card builder-dynamic-card builder-dynamic-card--team" href={`/team/${item.id || slugify(item.name)}`}>
      {item.photoId ? (
        <div className="employee-card-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/media/${item.photoId}`} alt="" />
        </div>
      ) : (
        <div className="employee-card-photo employee-card-photo--fallback" aria-hidden="true">
          {getInitials(item.name)}
        </div>
      )}
      <h3 className="builder-title-text">{item.name}</h3>
      {item.position ? <p className="builder-body-text"><strong>{item.position}</strong></p> : null}
    </Link>
  );
}

function ServiceCard({ item }: { item: NonNullable<DynamicBuilderContent["services"]>[number] }) {
  return (
    <Link className="card builder-dynamic-card" href={`/services/${item.slug}`}>
      {item.imageId ? (
        <div className="card-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/media/${item.imageId}`} alt="" />
        </div>
      ) : null}
      <h3 className="builder-title-text">{item.name}</h3>
    </Link>
  );
}

function BlogCard({ item }: { item: NonNullable<DynamicBuilderContent["posts"]>[number] }) {
  return (
    <Link className="blog-card builder-dynamic-card" href={`/blog/${item.slug}`}>
      <span>Article</span>
      <h3 className="builder-title-text">{item.title}</h3>
      <small>{getReadingTime(item.content ?? item.excerpt ?? "")} min read</small>
    </Link>
  );
}

function isCanvasBlock(block: BuilderBlock) {
  return typeof block.canvasX === "number" && typeof block.canvasY === "number" && typeof block.canvasWidth === "number";
}

function isRotatableTextBlock(block: BuilderBlock) {
  return block.type === "hero" || block.type === "text" || block.type === "banner" || block.type === "button" || block.type === "contactCta";
}

function getDefaultTitleFontSize(block: BuilderBlock) {
  if (block.type === "hero") return 48;
  if (block.type === "button") return block.fontSize ?? 16;
  return Math.max(20, Math.round((block.fontSize ?? 18) * 1.45));
}

function getDefaultBorderRadius(block: BuilderBlock) {
  if (block.type === "divider" || block.type === "spacer") return 0;
  if (block.type === "button") return 999;
  if (block.type === "image") return 10;
  return 8;
}

function getDefaultBorderColor(block: BuilderBlock) {
  if (block.type === "text" || block.type === "spacer") return "transparent";
  return "color-mix(in srgb, var(--color-border) 72%, transparent)";
}

function getDefaultShadow(block: BuilderBlock): NonNullable<BuilderBlock["shadow"]> {
  if (block.type === "hero" || block.type === "banner" || block.type === "contactCta") return "soft";
  if (block.type === "image" || block.type === "button") return "medium";
  return "none";
}

function getShadowValue(shadow: NonNullable<BuilderBlock["shadow"]>) {
  if (shadow === "soft") return "0 16px 42px rgb(15 23 42 / 0.09)";
  if (shadow === "medium") return "0 22px 56px rgb(15 23 42 / 0.14)";
  if (shadow === "strong") return "0 30px 80px rgb(15 23 42 / 0.2)";
  return "none";
}

function hasDefaultHoverEffect(block: BuilderBlock) {
  return block.type === "button" || block.type === "image" || block.type === "cards";
}

function getReadingTime(content: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

function getDefaultDynamicRoute(kind: "team" | "services" | "blog") {
  if (kind === "team") return "/team";
  if (kind === "services") return "/services";
  return "/blog";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
