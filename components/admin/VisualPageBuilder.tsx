"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import {
  Copy,
  Crop,
  Eye,
  ImageIcon,
  MousePointer2,
  Move,
  Redo2,
  RotateCcw,
  Save,
  Send,
  SquareDashedMousePointer,
  Trash2,
  Type
} from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";
import { getVisualCanvasHeight, VisualPageRenderer } from "@/components/shared/VisualPageRenderer";
import type { DynamicBuilderContent } from "@/components/shared/VisualPageRenderer";
import { createBuilderBlock } from "@/modules/page-builder/page-builder.defaults";
import type {
  BuilderAlign,
  BuilderBlock,
  BuilderBlockType,
  BuilderDirection,
  BuilderImageFit,
  BuilderShadow,
  BuilderTextElementStyle,
  BuilderVerticalAlign
} from "@/modules/page-builder/page-builder.types";
import type { TranslationValues } from "@/lib/i18n/translations";

type VisualPageBuilderProps = {
  page: {
    title: string;
    slug: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
  initialBlocks: BuilderBlock[];
  dynamicContent?: DynamicBuilderContent;
  hasDraft?: boolean;
};

type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  message: string;
};

type CanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PointerPoint = {
  xPercent: number;
  y: number;
  xPixels: number;
};

type PlacementConflict = {
  rect: CanvasRect;
  block: BuilderBlock;
};

type CanvasTool = "select" | "draw" | "move" | "resize";

type CanvasOperation = {
  kind: "move" | "resize";
  blockId: string;
  startClientX: number;
  startClientY: number;
  startBlock: Required<Pick<BuilderBlock, "canvasX" | "canvasY" | "canvasWidth" | "canvasHeight">>;
  handle?: "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";
};

const minBlockWidthPercent = 8;
const minBlockHeight = 64;
const snapSize = 8;

type AdminTranslator = (key: string, values?: TranslationValues) => string;

const palette: Array<{ type: BuilderBlockType; icon: "text" | "image" | "pointer" }> = [
  { type: "hero", icon: "text" },
  { type: "text", icon: "text" },
  { type: "image", icon: "image" },
  { type: "button", icon: "pointer" },
  { type: "banner", icon: "text" },
  { type: "cards", icon: "text" },
  { type: "twoColumn", icon: "text" },
  { type: "divider", icon: "pointer" },
  { type: "spacer", icon: "pointer" },
  { type: "contactCta", icon: "pointer" },
  { type: "team", icon: "text" },
  { type: "services", icon: "text" },
  { type: "blog", icon: "text" }
];

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64];

export function VisualPageBuilder({ page, initialBlocks, dynamicContent, hasDraft = false }: VisualPageBuilderProps) {
  const { language, t } = useLanguage();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<BuilderBlock[]>(initialBlocks);
  const [history, setHistory] = useState<BuilderBlock[][]>([]);
  const [future, setFuture] = useState<BuilderBlock[][]>([]);
  const [selectedId, setSelectedId] = useState(initialBlocks[0]?.id ?? "");
  const [preview, setPreview] = useState(false);
  const [tool, setTool] = useState<CanvasTool>("draw");
  const [state, setState] = useState<SaveState>({ status: "idle", message: "" });
  const [drawStart, setDrawStart] = useState<PointerPoint | null>(null);
  const [drawRect, setDrawRect] = useState<CanvasRect | null>(null);
  const [placementConflict, setPlacementConflict] = useState<PlacementConflict | null>(null);
  const [pendingContentRect, setPendingContentRect] = useState<CanvasRect | null>(null);
  const [operation, setOperation] = useState<CanvasOperation | null>(null);

  const selectedBlock = blocks.find((block) => block.id === selectedId) ?? null;
  const pageTitle = page.title || "Home";
  const displayPageTitle = pageTitle === "Home" ? t("nav.home") : pageTitle;
  const publicHref = page.slug === "home" ? "/" : `/${page.slug}`;
  const enabledBlocks = useMemo(() => blocks.filter((block) => block.enabled), [blocks]);
  const canvasHeight = getVisualCanvasHeight(blocks);

  function commit(nextBlocks: BuilderBlock[], nextSelectedId = selectedId) {
    setHistory((current) => [...current.slice(-39), blocks]);
    setFuture([]);
    setBlocks(nextBlocks);
    setSelectedId(nextSelectedId);
    setState({ status: "idle", message: "" });
  }

  function updateSelected(patch: Partial<BuilderBlock>) {
    if (!selectedBlock) return;
    commit(blocks.map((block) => (block.id === selectedBlock.id ? { ...block, ...patch } : block)));
  }

  function removeSelected() {
    if (!selectedBlock) return;
    const nextBlocks = blocks.filter((block) => block.id !== selectedBlock.id);
    commit(nextBlocks, nextBlocks[0]?.id ?? "");
  }

  function duplicateSelected() {
    if (!selectedBlock) return;
    const copy = {
      ...selectedBlock,
      id: createBlockId(),
      canvasX: clamp((selectedBlock.canvasX ?? 8) + 3, 0, 100 - (selectedBlock.canvasWidth ?? 30)),
      canvasY: (selectedBlock.canvasY ?? 40) + 24
    };
    commit([...blocks, copy], copy.id);
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((current) => [blocks, ...current.slice(0, 39)]);
    setBlocks(previous);
    setHistory((current) => current.slice(0, -1));
    setSelectedId(previous[0]?.id ?? "");
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((current) => [...current.slice(-39), blocks]);
    setBlocks(next);
    setFuture((current) => current.slice(1));
    setSelectedId(next[0]?.id ?? "");
  }

  function reset() {
    commit(initialBlocks, initialBlocks[0]?.id ?? "");
  }

  function clearCanvas() {
    commit([], "");
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLDivElement>): PointerPoint | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const box = canvas.getBoundingClientRect();
    const xPixels = clamp(event.clientX - box.left, 0, box.width);
    return {
      xPixels,
      xPercent: clamp((xPixels / box.width) * 100, 0, 100),
      y: snap(clamp(event.clientY - box.top, 0, box.height))
    };
  }

  function onCanvasPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (preview || tool !== "draw") return;
    if (event.target instanceof Element && event.target.closest(".visual-builder-canvas-block")) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawStart(point);
    setDrawRect({ x: point.xPercent, y: point.y, width: 0, height: 0 });
    setPlacementConflict(null);
    setPendingContentRect(null);
  }

  function onCanvasPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (drawStart) {
      const point = getCanvasPoint(event);
      if (!point) return;
      setDrawRect(rectFromPoints(drawStart, point));
      return;
    }

    if (operation) {
      updateBlockDuringOperation(event);
    }
  }

  function onCanvasPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (drawStart && drawRect) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      const normalized = normalizeRect(drawRect);
      setDrawStart(null);
      setDrawRect(null);
      if (!isUsableRect(normalized, canvasRef.current?.getBoundingClientRect().width ?? 1000)) {
        setState({ status: "error", message: t("admin.builder.drawLarger") });
        return;
      }
      const conflict = blocks.find((block) => rectsOverlap(normalized, getBlockRect(block)));
      if (conflict) setPlacementConflict({ rect: normalized, block: conflict });
      else setPendingContentRect(normalized);
      return;
    }

    if (operation) {
      setOperation(null);
    }
  }

  function beginOperation(event: React.PointerEvent, block: BuilderBlock, kind: "move" | "resize", handle?: CanvasOperation["handle"]) {
    if (preview || (kind === "move" && tool !== "select" && tool !== "move") || (kind === "resize" && tool !== "select" && tool !== "resize")) return;
    event.stopPropagation();
    setSelectedId(block.id);
    setHistory((current) => [...current.slice(-39), blocks]);
    setFuture([]);
    setState({ status: "idle", message: "" });
    setOperation({
      kind,
      blockId: block.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBlock: {
        canvasX: block.canvasX ?? 0,
        canvasY: block.canvasY ?? 0,
        canvasWidth: block.canvasWidth ?? 30,
        canvasHeight: block.canvasHeight ?? 180
      },
      handle
    });
  }

  function updateBlockDuringOperation(event: React.PointerEvent<HTMLDivElement>) {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box) return;
    const deltaXPercent = ((event.clientX - operation!.startClientX) / box.width) * 100;
    const deltaY = snap(event.clientY - operation!.startClientY);
    const start = operation!.startBlock;

    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== operation!.blockId) return block;
        if (operation!.kind === "move") {
          return {
            ...block,
            canvasX: snapPercent(clamp(start.canvasX + deltaXPercent, 0, 100 - start.canvasWidth)),
            canvasY: snap(clamp(start.canvasY + deltaY, 0, canvasHeight - start.canvasHeight))
          };
        }

        const resized = resizeRect(start, deltaXPercent, deltaY, operation!.handle ?? "se", canvasHeight);
        return {
          ...block,
          canvasX: resized.x,
          canvasY: resized.y,
          canvasWidth: resized.width,
          canvasHeight: resized.height
        };
      })
    );
  }

  function resolvePlacement(mode: "above" | "below" | "left" | "right" | "fit" | "replace" | "cancel") {
    if (!placementConflict) return;
    const target = getBlockRect(placementConflict.block);
    const rect = placementConflict.rect;
    setPlacementConflict(null);

    if (mode === "cancel") return;
    if (mode === "replace") {
      setBlocks((current) => current.filter((block) => block.id !== placementConflict.block.id));
      setPendingContentRect(rect);
      return;
    }

    if (mode === "above") setPendingContentRect({ ...rect, y: Math.max(0, target.y - rect.height - 16) });
    if (mode === "below") setPendingContentRect({ ...rect, y: target.y + target.height + 16 });
    if (mode === "left") setPendingContentRect({ ...rect, x: clamp(target.x - rect.width - 2, 0, 100 - rect.width), y: target.y });
    if (mode === "right") {
      const x = clamp(target.x + target.width + 2, 0, 100 - minBlockWidthPercent);
      setPendingContentRect({ ...rect, x, y: target.y, width: Math.max(minBlockWidthPercent, Math.min(rect.width, 100 - x)) });
    }
    if (mode === "fit") {
      const availableRight = 100 - (target.x + target.width) - 2;
      if (availableRight >= minBlockWidthPercent) {
        setPendingContentRect({ ...rect, x: target.x + target.width + 2, y: target.y, width: Math.min(rect.width, availableRight) });
      } else {
        setPendingContentRect({ ...rect, y: target.y + target.height + 16 });
      }
    }
  }

  function createBlock(type: BuilderBlockType) {
    if (!pendingContentRect) return;
    const block: BuilderBlock = {
      ...createBuilderBlock(type),
      canvasX: pendingContentRect.x,
      canvasY: pendingContentRect.y,
      canvasWidth: pendingContentRect.width,
      canvasHeight: pendingContentRect.height,
      paddingY: 0,
      padding: type === "image" ? 0 : 24,
      contentDirection: "horizontal",
      scrollMode: isDynamicContentType(type) ? "infinite" : "none",
      scrollDirection: "horizontal",
      showCarouselArrows: isDynamicContentType(type) ? false : undefined,
      autoScroll: isDynamicContentType(type),
      autoScrollSpeed: 40,
      titleLinkEnabled: isDynamicContentType(type),
      titleLinkUrl: getDefaultDynamicRoute(type),
      stackOnMobile: true
    };
    commit([...blocks, block], block.id);
    setPendingContentRect(null);
    setTool("select");
  }

  function changeSelectedType(type: BuilderBlockType) {
    if (!selectedBlock || selectedBlock.type === type) return;
    const replacement = {
      ...createBuilderBlock(type),
      id: selectedBlock.id,
      enabled: selectedBlock.enabled,
      canvasX: selectedBlock.canvasX,
      canvasY: selectedBlock.canvasY,
      canvasWidth: selectedBlock.canvasWidth,
      canvasHeight: selectedBlock.canvasHeight,
      background: selectedBlock.background,
      color: selectedBlock.color,
      padding: selectedBlock.padding,
      textStyle: selectedBlock.textStyle,
      paddingY: 0
    };
    commit(blocks.map((block) => (block.id === selectedBlock.id ? replacement : block)), selectedBlock.id);
  }

  async function save(status: "DRAFT" | "PUBLISHED") {
    setState({ status: "saving", message: status === "PUBLISHED" ? t("admin.common.publishing") : t("admin.builder.savingDraft") });
    const response = await fetch(`/api/admin/page-builder/${page.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pageTitle,
        status,
        blocks
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({ status: "error", message: body?.error?.message ?? t("admin.builder.pageSaveFailed") });
      return;
    }

    setHistory([]);
    setFuture([]);
    setState({ status: "saved", message: status === "PUBLISHED" ? t("admin.builder.published") : t("admin.builder.draftSaved") });
  }

  return (
    <div className="visual-builder-shell">
      <aside className="visual-builder-panel">
        <div className="visual-builder-panel__head">
          <h2>{t("admin.builder.toolsTitle")}</h2>
          <p>{t("admin.builder.toolsText")}</p>
        </div>
        <div className="visual-builder-toolgrid" role="toolbar" aria-label={t("admin.builder.toolsAria")}>
          <ToolButton active={tool === "draw"} onClick={() => setTool("draw")}>
            <SquareDashedMousePointer size={16} />
            {t("admin.builder.drawBlock")}
          </ToolButton>
          <ToolButton active={tool === "select"} onClick={() => setTool("select")}>
            <MousePointer2 size={16} />
            {t("admin.builder.select")}
          </ToolButton>
          <ToolButton active={tool === "move"} onClick={() => setTool("move")}>
            <Move size={16} />
            {t("admin.builder.move")}
          </ToolButton>
          <ToolButton active={tool === "resize"} onClick={() => setTool("resize")}>
            <Crop size={16} />
            {t("admin.builder.resize")}
          </ToolButton>
        </div>
        <div className="visual-builder-panel__head">
          <h2>{t("admin.builder.contentTypes")}</h2>
          <p>{t("admin.builder.contentTypesText")}</p>
        </div>
        <div className="visual-builder-palette">
          {palette.map((item) => (
            <button type="button" key={item.type} onClick={() => setPendingContentRect(makeDefaultRect(blocks.length))}>
              {item.icon === "image" ? <ImageIcon size={16} /> : item.icon === "pointer" ? <MousePointer2 size={16} /> : <Type size={16} />}
              {getBlockTypeLabel(item.type, t)}
            </button>
          ))}
        </div>
      </aside>

      <main className="visual-builder-main">
        <div className="visual-builder-toolbar">
          <div>
            <h1>{t("admin.builder.canvasTitle", { title: displayPageTitle })}</h1>
            <p>
              {t("admin.builder.blockSummary", {
                count: enabledBlocks.length,
                blockLabel: enabledBlocks.length === 1 ? t("admin.builder.blockSingular") : t("admin.builder.blockPlural")
              })}
              {hasDraft ? ` - ${t("admin.builder.showingDraft")}` : ""}
            </p>
          </div>
          <div className="row-actions">
            <Link className="button secondary" href={publicHref}>
              {t("admin.common.viewSite")}
            </Link>
            <button className="button secondary" type="button" onClick={() => setPreview((value) => !value)}>
              <Eye size={17} />
              {preview ? t("admin.common.edit") : t("admin.common.preview")}
            </button>
            <button className="button secondary" type="button" disabled={!selectedBlock} onClick={duplicateSelected}>
              <Copy size={17} />
              {t("admin.common.duplicate")}
            </button>
            <button className="button secondary" type="button" disabled={!history.length} onClick={undo}>
              <RotateCcw size={17} />
              {t("admin.common.undo")}
            </button>
            <button className="button secondary" type="button" disabled={!future.length} onClick={redo}>
              <Redo2 size={17} />
              {t("admin.common.redo")}
            </button>
            <button className="button secondary" type="button" onClick={reset}>
              {t("admin.common.cancel")}
            </button>
            <button className="button secondary" type="button" disabled={state.status === "saving"} onClick={() => save("DRAFT")}>
              <Save size={17} />
              {t("admin.builder.saveDraft")}
            </button>
            <button className="button" type="button" disabled={state.status === "saving"} onClick={() => save("PUBLISHED")}>
              <Send size={17} />
              {t("admin.common.publish")}
            </button>
          </div>
        </div>

        {state.message ? <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p> : null}

        {preview ? (
          <div className="visual-builder-preview">
            <VisualPageRenderer blocks={blocks} dynamicContent={dynamicContent} language={language} />
          </div>
        ) : (
          <div
            ref={canvasRef}
            className={`visual-builder-canvas visual-builder-canvas--${tool}`}
            style={{ "--visual-canvas-height": `${canvasHeight}px` } as React.CSSProperties}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={() => {
              setDrawStart(null);
              setDrawRect(null);
              setOperation(null);
            }}
          >
            {!blocks.length ? (
              <div className="visual-builder-empty">
                <SquareDashedMousePointer size={28} />
                <strong>{t("admin.builder.emptyTitle")}</strong>
                <span>{t("admin.builder.emptyText")}</span>
              </div>
            ) : null}

            <div className="visual-builder-render-layer" aria-hidden="true" inert>
              <VisualPageRenderer blocks={blocks} dynamicContent={dynamicContent} includeDisabled language={language} />
            </div>

            {blocks.map((block) => (
              <CanvasBlock
                block={block}
                selected={selectedId === block.id}
                key={block.id}
                onSelect={() => setSelectedId(block.id)}
                onMoveStart={(event) => beginOperation(event, block, "move")}
                onResizeStart={(event, handle) => beginOperation(event, block, "resize", handle)}
              />
            ))}

            {drawRect ? <div className="visual-builder-draw-rect" style={rectStyle(normalizeRect(drawRect))} /> : null}
          </div>
        )}
      </main>

      <aside className="visual-builder-panel">
        <BlockInspector
          block={selectedBlock}
          pageSlug={page.slug}
          dynamicContent={dynamicContent}
          onChange={updateSelected}
          onTypeChange={changeSelectedType}
          onDelete={removeSelected}
          onClear={clearCanvas}
          disabled={state.status === "saving"}
        />
      </aside>

      {placementConflict ? <PlacementDialog conflict={placementConflict} onResolve={resolvePlacement} /> : null}
      {pendingContentRect ? <ContentTypeDialog rect={pendingContentRect} onCancel={() => setPendingContentRect(null)} onSelect={createBlock} /> : null}
    </div>
  );
}

function ToolButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button className={active ? "is-active" : undefined} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function CanvasBlock({
  block,
  selected,
  onSelect,
  onMoveStart,
  onResizeStart
}: {
  block: BuilderBlock;
  selected: boolean;
  onSelect: () => void;
  onMoveStart: (event: React.PointerEvent) => void;
  onResizeStart: (event: React.PointerEvent, handle: CanvasOperation["handle"]) => void;
}) {
  const { t } = useLanguage();

  return (
    <div
      className={`visual-builder-canvas-block${selected ? " is-selected" : ""}`}
      style={rectStyle(getBlockRect(block))}
      data-block-type={block.type}
      onPointerDown={onMoveStart}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <button className="visual-builder-grip" type="button" aria-label={t("admin.builder.moveBlock")}>
        <Move size={16} />
      </button>
      {(["n", "e", "s", "w", "ne", "nw", "se", "sw"] as const).map((handle) => (
        <button
          className={`visual-builder-resize-handle visual-builder-resize-handle--${handle}`}
          type="button"
          aria-label={t("admin.builder.resizeHandle", { handle })}
          key={handle}
          onPointerDown={(event) => {
            event.stopPropagation();
            onResizeStart(event, handle);
          }}
        />
      ))}
    </div>
  );
}

function PlacementDialog({ conflict, onResolve }: { conflict: PlacementConflict; onResolve: (mode: "above" | "below" | "left" | "right" | "fit" | "replace" | "cancel") => void }) {
  const { t } = useLanguage();

  return (
    <div className="visual-builder-modal" role="dialog" aria-modal="true" aria-labelledby="placement-title">
      <div className="visual-builder-modal__panel">
        <h2 id="placement-title">{t("admin.builder.overlapTitle")}</h2>
        <p>{t("admin.builder.overlapText", { type: getBlockTypeLabel(conflict.block.type, t) })}</p>
        <div className="visual-builder-modal__grid">
          <button className="button secondary" type="button" onClick={() => onResolve("above")}>{t("admin.builder.placeAbove")}</button>
          <button className="button secondary" type="button" onClick={() => onResolve("below")}>{t("admin.builder.placeBelow")}</button>
          <button className="button secondary" type="button" onClick={() => onResolve("left")}>{t("admin.builder.placeLeft")}</button>
          <button className="button secondary" type="button" onClick={() => onResolve("right")}>{t("admin.builder.placeRight")}</button>
          <button className="button secondary" type="button" onClick={() => onResolve("fit")}>{t("admin.builder.resizeToFit")}</button>
          <button className="button danger" type="button" onClick={() => onResolve("replace")}>{t("admin.builder.replaceBlock")}</button>
        </div>
        <button className="button secondary" type="button" onClick={() => onResolve("cancel")}>{t("admin.builder.cancelDraw")}</button>
      </div>
    </div>
  );
}

function ContentTypeDialog({ rect, onSelect, onCancel }: { rect: CanvasRect; onSelect: (type: BuilderBlockType) => void; onCancel: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="visual-builder-modal" role="dialog" aria-modal="true" aria-labelledby="content-title">
      <div className="visual-builder-modal__panel">
        <h2 id="content-title">{t("admin.builder.chooseContent")}</h2>
        <p>{t("admin.builder.area", { width: Math.round(rect.width), height: Math.round(rect.height) })}</p>
        <div className="visual-builder-content-types">
          {palette.map((item) => (
            <button className="button secondary" type="button" key={item.type} onClick={() => onSelect(item.type)}>
              {item.icon === "image" ? <ImageIcon size={16} /> : item.icon === "pointer" ? <MousePointer2 size={16} /> : <Type size={16} />}
              {getBlockTypeLabel(item.type, t)}
            </button>
          ))}
        </div>
        <button className="button secondary" type="button" onClick={onCancel}>{t("admin.common.cancel")}</button>
      </div>
    </div>
  );
}

function BlockInspector({
  block,
  pageSlug,
  dynamicContent,
  onChange,
  onTypeChange,
  onDelete,
  onClear,
  disabled
}: {
  block: BuilderBlock | null;
  pageSlug: string;
  dynamicContent?: DynamicBuilderContent;
  onChange: (patch: Partial<BuilderBlock>) => void;
  onTypeChange: (type: BuilderBlockType) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled: boolean;
}) {
  const { t } = useLanguage();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!block) {
    return (
      <div className="visual-builder-inspector">
        <div className="visual-builder-panel__head">
          <h2>{t("admin.builder.inspector")}</h2>
          <p>{t("admin.builder.inspectorEmpty")}</p>
        </div>
        <button className="button danger" type="button" onClick={onClear}>
          <Trash2 size={17} />
          {t("admin.builder.clearCanvas")}
        </button>
      </div>
    );
  }
  const currentBlock = block;

  function updateTextStyle(target: "title" | "body", patch: Partial<BuilderTextElementStyle>) {
    onChange({
      textStyle: {
        ...(currentBlock.textStyle ?? {}),
        [target]: {
          ...(currentBlock.textStyle?.[target] ?? {}),
          ...patch
        }
      }
    });
  }

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const payload = new FormData();
    payload.set("image", file);
    const response = await fetch(`/api/admin/page-builder/${pageSlug}/images`, {
      method: "POST",
      body: payload
    });
    setUploading(false);
    const body = await response.json().catch(() => null);
    if (response.ok && body?.data?.id) {
      onChange({ imageId: body.data.id, imageAlt: currentBlock.imageAlt || file.name });
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  return (
    <div className="visual-builder-inspector">
      <div className="visual-builder-panel__head">
        <h2>{t("admin.builder.inspector")}</h2>
        <p>{getBlockTypeLabel(block.type, t)}</p>
      </div>

      <div className="field">
        <label htmlFor="builder-type">{t("admin.builder.contentType")}</label>
        <select id="builder-type" value={block.type} onChange={(event) => onTypeChange(event.target.value as BuilderBlockType)}>
          {palette.map((item) => (
            <option value={item.type} key={item.type}>{getBlockTypeLabel(item.type, t)}</option>
          ))}
        </select>
      </div>

      <label className="checkbox-field">
        <input checked={block.enabled} type="checkbox" onChange={(event) => onChange({ enabled: event.target.checked })} />
        {t("admin.builder.visible")}
      </label>

      {["hero", "text", "banner", "cards", "contactCta", "image"].includes(block.type) ? (
        <Field label={t("admin.common.title")} value={block.title ?? ""} onChange={(value) => onChange({ title: value })} />
      ) : null}

      {block.type === "hero" ? (
        <Field label={t("admin.forms.editor.subtitleLabel")} value={block.subtitle ?? ""} textarea onChange={(value) => onChange({ subtitle: value })} />
      ) : null}

      {["text", "banner", "contactCta"].includes(block.type) ? (
        <Field label={t("admin.builder.bodyText")} value={block.text ?? ""} textarea onChange={(value) => onChange({ text: value })} />
      ) : null}

      {["hero", "button", "contactCta"].includes(block.type) ? (
        <>
          <Field label={t("admin.builder.buttonText")} value={block.buttonText ?? ""} onChange={(value) => onChange({ buttonText: value })} />
          <Field label={t("admin.builder.buttonUrl")} value={block.buttonUrl ?? ""} onChange={(value) => onChange({ buttonUrl: value })} />
        </>
      ) : null}

      {block.type === "image" ? (
        <ImageControls block={block} uploading={uploading} inputRef={imageInputRef} onUpload={uploadImage} onChange={onChange} />
      ) : null}

      {block.type === "twoColumn" ? (
        <>
          <Field label={t("admin.builder.left") + " " + t("admin.common.title")} value={block.leftTitle ?? ""} onChange={(value) => onChange({ leftTitle: value })} />
          <Field label={t("admin.builder.left") + " " + t("admin.builder.bodyText")} value={block.leftText ?? ""} textarea onChange={(value) => onChange({ leftText: value })} />
          <Field label={t("admin.builder.right") + " " + t("admin.common.title")} value={block.rightTitle ?? ""} onChange={(value) => onChange({ rightTitle: value })} />
          <Field label={t("admin.builder.right") + " " + t("admin.builder.bodyText")} value={block.rightText ?? ""} textarea onChange={(value) => onChange({ rightText: value })} />
        </>
      ) : null}

      {block.type === "cards" ? <CardEditor block={block} onChange={onChange} /> : null}

      {isDynamicContentType(block.type) ? (
        <InspectorGroup title={t("admin.builder.dynamicContentScroll")}>
          <p className="field-help">
            {t("admin.builder.itemCount", {
              count: getDynamicContentCount(block.type, dynamicContent),
              itemLabel:
                getDynamicContentCount(block.type, dynamicContent) === 1
                  ? t("admin.builder.itemSingular")
                  : t("admin.builder.itemPlural"),
              type: getBlockTypeLabel(block.type, t)
            })}
          </p>
          <div className="field">
            <label htmlFor="scroll-mode">{t("admin.builder.scrollMode")}</label>
            <select id="scroll-mode" value={block.scrollMode ?? "none"} onChange={(event) => onChange({ scrollMode: event.target.value as BuilderBlock["scrollMode"] })}>
              <option value="none">{t("admin.builder.none")}</option>
              <option value="normal">{t("admin.builder.arrowCarousel")}</option>
              <option value="infinite">{t("admin.builder.infiniteLoop")}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="scroll-direction">{t("admin.builder.scrollDirection")}</label>
            <select id="scroll-direction" value={block.scrollDirection ?? "horizontal"} onChange={(event) => onChange({ scrollDirection: event.target.value as BuilderBlock["scrollDirection"] })}>
              <option value="horizontal">{t("admin.builder.horizontal")}</option>
              <option value="vertical">{t("admin.builder.vertical")}</option>
            </select>
          </div>
          <label className="checkbox-field">
            <input checked={block.showCarouselArrows ?? (block.scrollMode === "normal")} type="checkbox" onChange={(event) => onChange({ showCarouselArrows: event.target.checked })} />
            {t("admin.builder.showCarouselArrows")}
          </label>
          <label className="checkbox-field">
            <input checked={Boolean(block.autoScroll)} type="checkbox" onChange={(event) => onChange({ autoScroll: event.target.checked })} />
            {t("admin.builder.autoScroll")}
          </label>
          <NumberField label={t("admin.builder.autoScrollSpeed")} value={block.autoScrollSpeed ?? 40} min={0} max={240} step={5} suffix="px/s" onChange={(value) => onChange({ autoScrollSpeed: value })} />
          <label className="checkbox-field">
            <input checked={block.titleLinkEnabled ?? true} type="checkbox" onChange={(event) => onChange({ titleLinkEnabled: event.target.checked })} />
            {t("admin.builder.linkSectionTitle")}
          </label>
          <Field label={t("admin.builder.titleLinkUrl")} value={block.titleLinkUrl ?? getDefaultDynamicRoute(block.type) ?? ""} onChange={(value) => onChange({ titleLinkUrl: value })} />
        </InspectorGroup>
      ) : null}

      <InspectorGroup title={t("admin.builder.positionSize")}>
        <NumberField label={t("admin.builder.xPosition")} value={block.canvasX ?? 0} min={0} max={100} step={1} suffix="%" onChange={(value) => onChange({ canvasX: value })} />
        <NumberField label={t("admin.builder.yPosition")} value={block.canvasY ?? 0} min={0} max={5000} step={8} onChange={(value) => onChange({ canvasY: value })} />
        <NumberField label={t("admin.builder.width")} value={block.canvasWidth ?? 30} min={minBlockWidthPercent} max={100} step={1} suffix="%" onChange={(value) => onChange({ canvasWidth: value })} />
        <NumberField label={t("admin.builder.height")} value={block.canvasHeight ?? 180} min={minBlockHeight} max={2000} step={8} onChange={(value) => onChange({ canvasHeight: value })} />
      </InspectorGroup>

      <TextStyleControls
        title={t("admin.builder.titleText")}
        idPrefix="title-text"
        style={block.textStyle?.title}
        fallback={{
          fontFamily: block.fontFamily ?? "",
          fontSize: block.type === "hero" ? 48 : Math.max(20, Math.round((block.fontSize ?? 18) * 1.45)),
          fontWeight: block.bold ? 800 : 700,
          color: block.color ?? "",
          lineHeight: block.lineHeight ?? 1.15,
          letterSpacing: block.letterSpacing ?? 0,
          align: block.align ?? "left",
          wrap: false
        }}
        showWrap
        onChange={(patch) => updateTextStyle("title", patch)}
      />

      <TextStyleControls
        title={t("admin.builder.bodyText")}
        idPrefix="body-text"
        style={block.textStyle?.body}
        fallback={{
          fontFamily: block.fontFamily ?? "",
          fontSize: block.fontSize ?? 18,
          fontWeight: block.bold ? 700 : 400,
          color: block.color ?? "",
          lineHeight: block.lineHeight ?? 1.55,
          letterSpacing: block.letterSpacing ?? 0,
          align: block.align ?? "left"
        }}
        onChange={(patch) => updateTextStyle("body", patch)}
      />

      <InspectorGroup title={t("admin.builder.paragraph")}>
        <NumberField label={t("admin.builder.paragraphSpacing")} value={block.paragraphSpacing ?? 14} min={0} max={80} onChange={(value) => onChange({ paragraphSpacing: value })} />
      </InspectorGroup>

      <InspectorGroup title={t("admin.builder.layout")}>
        <div className="field">
          <label htmlFor="builder-direction">{t("admin.builder.contentDirection")}</label>
          <select id="builder-direction" value={block.contentDirection ?? "horizontal"} onChange={(event) => onChange({ contentDirection: event.target.value as BuilderDirection })}>
            <option value="horizontal">{t("admin.builder.horizontal")}</option>
            <option value="vertical">{t("admin.builder.vertical")}</option>
            <option value="horizontal-reverse">{t("admin.builder.reverseHorizontal")}</option>
            <option value="vertical-reverse">{t("admin.builder.reverseVertical")}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="builder-align">{t("admin.builder.horizontalAlign")}</label>
          <select id="builder-align" value={block.align ?? "left"} onChange={(event) => onChange({ align: event.target.value as BuilderAlign })}>
            <option value="left">{t("admin.builder.left")}</option>
            <option value="center">{t("admin.builder.center")}</option>
            <option value="right">{t("admin.builder.right")}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="builder-valign">{t("admin.builder.verticalAlign")}</label>
          <select id="builder-valign" value={block.verticalAlign ?? "top"} onChange={(event) => onChange({ verticalAlign: event.target.value as BuilderVerticalAlign })}>
            <option value="top">{t("admin.builder.top")}</option>
            <option value="middle">{t("admin.builder.middle")}</option>
            <option value="bottom">{t("admin.builder.bottom")}</option>
          </select>
        </div>
        <NumberField label={t("admin.builder.gap")} value={block.gap ?? 16} min={0} max={120} onChange={(value) => onChange({ gap: value })} />
        <NumberField label={t("admin.builder.padding")} value={block.padding ?? 24} min={0} max={120} onChange={(value) => onChange({ padding: value })} />
        <label className="checkbox-field">
          <input checked={block.stackOnMobile ?? true} type="checkbox" onChange={(event) => onChange({ stackOnMobile: event.target.checked })} />
          {t("admin.builder.stackOnMobile")}
        </label>
      </InspectorGroup>

      <InspectorGroup title={t("admin.builder.blockStyle")}>
        <Field label={t("admin.builder.background")} value={block.background ?? ""} onChange={(value) => onChange({ background: value })} placeholder={t("admin.builder.backgroundPlaceholder")} />
        <Field label={t("admin.builder.borderColor")} value={block.borderColor ?? ""} onChange={(value) => onChange({ borderColor: value })} placeholder={t("admin.builder.borderColorPlaceholder")} />
        <NumberField label={t("admin.builder.borderRadius")} value={block.borderRadius ?? getDefaultBorderRadius(block.type)} min={0} max={80} step={1} onChange={(value) => onChange({ borderRadius: value })} />
        <div className="field">
          <label htmlFor="builder-shadow">{t("admin.builder.shadow")}</label>
          <select id="builder-shadow" value={block.shadow ?? getDefaultShadow(block.type)} onChange={(event) => onChange({ shadow: event.target.value as BuilderShadow })}>
            <option value="none">{t("admin.builder.none")}</option>
            <option value="soft">{t("admin.builder.soft")}</option>
            <option value="medium">{t("admin.builder.medium")}</option>
            <option value="strong">{t("admin.builder.strong")}</option>
          </select>
        </div>
        <NumberField label={t("admin.builder.opacity")} value={block.opacity ?? 1} min={0.1} max={1} step={0.05} suffix="" onChange={(value) => onChange({ opacity: value })} />
        <label className="checkbox-field">
          <input checked={block.hoverEffect ?? hasDefaultHoverEffect(block.type)} type="checkbox" onChange={(event) => onChange({ hoverEffect: event.target.checked })} />
          {t("admin.builder.hoverEffect")}
        </label>
      </InspectorGroup>

      <button className="button danger" type="button" disabled={disabled} onClick={onDelete}>
        <Trash2 size={17} />
        {t("admin.builder.deleteBlock")}
      </button>
    </div>
  );
}

function ImageControls({
  block,
  uploading,
  inputRef,
  onUpload,
  onChange
}: {
  block: BuilderBlock;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChange: (patch: Partial<BuilderBlock>) => void;
}) {
  const { t } = useLanguage();

  return (
    <InspectorGroup title={t("admin.builder.image")}>
      {block.imageId ? (
        <div className="theme-background-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/media/${block.imageId}`} alt="" />
        </div>
      ) : null}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} />
      <p className="field-help">{uploading ? t("admin.builder.uploadingImage") : t("admin.builder.uploadImage")}</p>
      <Field label={t("admin.builder.altText")} value={block.imageAlt ?? ""} onChange={(value) => onChange({ imageAlt: value })} />
      <div className="field">
        <label htmlFor="image-fit">{t("admin.builder.fitMode")}</label>
        <select id="image-fit" value={block.imageFit ?? "cover"} onChange={(event) => onChange({ imageFit: event.target.value as BuilderImageFit })}>
          <option value="cover">{t("admin.builder.cover")}</option>
          <option value="contain">{t("admin.builder.contain")}</option>
          <option value="fill">{t("admin.builder.fill")}</option>
        </select>
      </div>
      <NumberField label={t("admin.builder.zoom")} value={block.imageZoom ?? 1} min={0.25} max={4} step={0.05} suffix="x" onChange={(value) => onChange({ imageZoom: value })} />
      <NumberField label={t("admin.builder.imageXOffset")} value={block.imageOffsetX ?? 0} min={-100} max={100} step={1} suffix="%" onChange={(value) => onChange({ imageOffsetX: value })} />
      <NumberField label={t("admin.builder.imageYOffset")} value={block.imageOffsetY ?? 0} min={-100} max={100} step={1} suffix="%" onChange={(value) => onChange({ imageOffsetY: value })} />
      <NumberField label={t("admin.builder.focalX")} value={block.focalX ?? 50} min={0} max={100} step={1} suffix="%" onChange={(value) => onChange({ focalX: value })} />
      <NumberField label={t("admin.builder.focalY")} value={block.focalY ?? 50} min={0} max={100} step={1} suffix="%" onChange={(value) => onChange({ focalY: value })} />
    </InspectorGroup>
  );
}

function TextStyleControls({
  title,
  idPrefix,
  style,
  fallback,
  showWrap = false,
  onChange
}: {
  title: string;
  idPrefix: string;
  style?: BuilderTextElementStyle;
  fallback: Required<Pick<BuilderTextElementStyle, "fontFamily" | "fontSize" | "fontWeight" | "color" | "lineHeight" | "letterSpacing" | "align">> &
    Pick<BuilderTextElementStyle, "wrap">;
  showWrap?: boolean;
  onChange: (patch: Partial<BuilderTextElementStyle>) => void;
}) {
  const { t } = useLanguage();
  const current = {
    ...fallback,
    ...(style ?? {})
  };

  return (
    <InspectorGroup title={title}>
      <Field label={t("admin.builder.fontFamily")} value={current.fontFamily ?? ""} onChange={(value) => onChange({ fontFamily: value })} placeholder={t("admin.builder.fontFamilyPlaceholder")} />
      <div className="field">
        <label htmlFor={`${idPrefix}-font-size`}>{t("admin.builder.fontSize")}</label>
        <select id={`${idPrefix}-font-size`} value={current.fontSize ?? fallback.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}>
          {fontSizes.map((size) => (
            <option value={size} key={size}>{size}px</option>
          ))}
        </select>
      </div>
      <NumberField label={t("admin.builder.customFontSize")} value={current.fontSize ?? fallback.fontSize} min={8} max={120} onChange={(value) => onChange({ fontSize: value })} />
      <NumberField label={t("admin.builder.fontWeight")} value={current.fontWeight ?? fallback.fontWeight} min={100} max={1000} step={100} suffix="" onChange={(value) => onChange({ fontWeight: value })} />
      <Field label={t("admin.builder.color")} value={current.color ?? ""} onChange={(value) => onChange({ color: value })} placeholder={t("admin.builder.colorPlaceholder")} />
      <NumberField label={t("admin.builder.lineHeight")} value={current.lineHeight ?? fallback.lineHeight} min={0.8} max={3} step={0.05} suffix="" onChange={(value) => onChange({ lineHeight: value })} />
      <NumberField label={t("admin.builder.letterSpacing")} value={current.letterSpacing ?? fallback.letterSpacing} min={-2} max={20} step={0.5} onChange={(value) => onChange({ letterSpacing: value })} />
      <div className="field">
        <label htmlFor={`${idPrefix}-align`}>{t("admin.builder.alignment")}</label>
        <select id={`${idPrefix}-align`} value={current.align ?? fallback.align} onChange={(event) => onChange({ align: event.target.value as BuilderAlign })}>
          <option value="left">{t("admin.builder.left")}</option>
          <option value="center">{t("admin.builder.center")}</option>
          <option value="right">{t("admin.builder.right")}</option>
        </select>
      </div>
      {showWrap ? (
        <label className="checkbox-field">
          <input checked={Boolean(current.wrap)} type="checkbox" onChange={(event) => onChange({ wrap: event.target.checked })} />
          {t("admin.builder.allowTitleWrapping")}
        </label>
      ) : null}
    </InspectorGroup>
  );
}

function InspectorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="visual-builder-inspector-group">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  const generatedId = useId();
  const id = `field-${generatedId.replace(/:/g, "")}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {textarea ? (
        <textarea id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "px",
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const { t } = useLanguage();
  const generatedId = useId();
  const id = `field-${generatedId.replace(/:/g, "")}`;
  return (
    <div className="field number-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
      <div className="number-field__value">
        <input aria-label={t("admin.builder.valueLabel", { label })} type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
        <span>{suffix}</span>
      </div>
    </div>
  );
}

function CardEditor({ block, onChange }: { block: BuilderBlock; onChange: (patch: Partial<BuilderBlock>) => void }) {
  const { t } = useLanguage();
  const cards = block.cards ?? [];
  return (
    <div className="visual-builder-card-editor">
      <h3>{t("admin.builder.cards")}</h3>
      {cards.map((card, index) => (
        <div className="admin-panel" key={index}>
          <Field
            label={t("admin.builder.cardTitle", { index: index + 1 })}
            value={card.title}
            onChange={(value) => {
              const next = [...cards];
              next[index] = { ...card, title: value };
              onChange({ cards: next });
            }}
          />
          <Field
            label={t("admin.builder.cardText", { index: index + 1 })}
            value={card.text}
            textarea
            onChange={(value) => {
              const next = [...cards];
              next[index] = { ...card, text: value };
              onChange({ cards: next });
            }}
          />
          <Field
            label={t("admin.builder.cardUrl", { index: index + 1 })}
            value={card.href ?? ""}
            onChange={(value) => {
              const next = [...cards];
              next[index] = { ...card, href: value };
              onChange({ cards: next });
            }}
          />
        </div>
      ))}
      <button
        className="button secondary"
        type="button"
        onClick={() => onChange({ cards: [...cards, { title: t("admin.builder.newCardTitle"), text: t("admin.builder.newCardText") }] })}
      >
        {t("admin.builder.addCard")}
      </button>
    </div>
  );
}

function getBlockRect(block: BuilderBlock): CanvasRect {
  return {
    x: block.canvasX ?? 0,
    y: block.canvasY ?? 0,
    width: block.canvasWidth ?? 30,
    height: block.canvasHeight ?? 180
  };
}

function rectStyle(rect: CanvasRect): React.CSSProperties {
  return {
    left: `${rect.x}%`,
    top: `${rect.y}px`,
    width: `${rect.width}%`,
    height: `${rect.height}px`
  };
}

function rectFromPoints(start: PointerPoint, end: PointerPoint): CanvasRect {
  return normalizeRect({
    x: Math.min(start.xPercent, end.xPercent),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.xPercent - start.xPercent),
    height: Math.abs(end.y - start.y)
  });
}

function normalizeRect(rect: CanvasRect): CanvasRect {
  return {
    x: snapPercent(clamp(rect.x, 0, 100)),
    y: snap(Math.max(0, rect.y)),
    width: snapPercent(clamp(rect.width, 0, 100 - rect.x)),
    height: snap(Math.max(0, rect.height))
  };
}

function isUsableRect(rect: CanvasRect, canvasWidth: number) {
  return rect.width >= minBlockWidthPercent && rect.height >= minBlockHeight && (rect.width / 100) * canvasWidth >= 96;
}

function rectsOverlap(a: CanvasRect, b: CanvasRect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function resizeRect(
  start: Required<Pick<BuilderBlock, "canvasX" | "canvasY" | "canvasWidth" | "canvasHeight">>,
  deltaXPercent: number,
  deltaY: number,
  handle: NonNullable<CanvasOperation["handle"]>,
  canvasHeight: number
): CanvasRect {
  let x = start.canvasX;
  let y = start.canvasY;
  let width = start.canvasWidth;
  let height = start.canvasHeight;

  if (handle.includes("e")) width = start.canvasWidth + deltaXPercent;
  if (handle.includes("s")) height = start.canvasHeight + deltaY;
  if (handle.includes("w")) {
    x = start.canvasX + deltaXPercent;
    width = start.canvasWidth - deltaXPercent;
  }
  if (handle.includes("n")) {
    y = start.canvasY + deltaY;
    height = start.canvasHeight - deltaY;
  }

  width = snapPercent(clamp(width, minBlockWidthPercent, 100));
  height = snap(clamp(height, minBlockHeight, 2000));
  x = snapPercent(clamp(x, 0, 100 - width));
  y = snap(clamp(y, 0, canvasHeight - height));
  return { x, y, width, height };
}

function makeDefaultRect(index: number): CanvasRect {
  return {
    x: 8 + (index % 3) * 4,
    y: 48 + index * 28,
    width: 42,
    height: 220
  };
}

function snap(value: number) {
  return Math.round(value / snapSize) * snapSize;
}

function snapPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getBlockTypeLabel(type: BuilderBlockType, t: AdminTranslator) {
  return t(`admin.builder.blockTypes.${type}`);
}

function createBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isDynamicContentType(type: BuilderBlockType) {
  return type === "team" || type === "services" || type === "blog";
}

function getDynamicContentCount(type: BuilderBlockType, dynamicContent?: DynamicBuilderContent) {
  if (type === "team") return dynamicContent?.team?.length ?? 0;
  if (type === "services") return dynamicContent?.services?.length ?? 0;
  if (type === "blog") return dynamicContent?.posts?.length ?? 0;
  return 0;
}

function getDefaultDynamicRoute(type: BuilderBlockType) {
  if (type === "team") return "/team";
  if (type === "services") return "/services";
  if (type === "blog") return "/blog";
  return undefined;
}

function getDefaultBorderRadius(type: BuilderBlockType) {
  if (type === "divider" || type === "spacer") return 0;
  if (type === "button") return 999;
  if (type === "image") return 10;
  return 8;
}

function getDefaultShadow(type: BuilderBlockType): BuilderShadow {
  if (type === "hero" || type === "banner" || type === "contactCta") return "soft";
  if (type === "image" || type === "button") return "medium";
  return "none";
}

function hasDefaultHoverEffect(type: BuilderBlockType) {
  return type === "button" || type === "image" || type === "cards";
}
