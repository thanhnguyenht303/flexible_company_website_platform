"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
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

const palette: Array<{ type: BuilderBlockType; label: string; icon: "text" | "image" | "pointer" }> = [
  { type: "hero", label: "Hero", icon: "text" },
  { type: "text", label: "Text", icon: "text" },
  { type: "image", label: "Image", icon: "image" },
  { type: "button", label: "Button", icon: "pointer" },
  { type: "banner", label: "Banner", icon: "text" },
  { type: "cards", label: "Cards", icon: "text" },
  { type: "twoColumn", label: "Two columns", icon: "text" },
  { type: "divider", label: "Divider", icon: "pointer" },
  { type: "spacer", label: "Spacer", icon: "pointer" },
  { type: "contactCta", label: "Contact CTA", icon: "pointer" },
  { type: "team", label: "Team", icon: "text" },
  { type: "services", label: "Services", icon: "text" },
  { type: "blog", label: "Blog", icon: "text" }
];

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64];

export function VisualPageBuilder({ page, initialBlocks, dynamicContent, hasDraft = false }: VisualPageBuilderProps) {
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
        setState({ status: "error", message: "Draw a larger area before choosing content." });
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
    setState({ status: "saving", message: status === "PUBLISHED" ? "Publishing page." : "Saving draft." });
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
      setState({ status: "error", message: body?.error?.message ?? "Page could not be saved." });
      return;
    }

    setHistory([]);
    setFuture([]);
    setState({ status: "saved", message: status === "PUBLISHED" ? "Published." : "Draft saved." });
  }

  return (
    <div className="visual-builder-shell">
      <aside className="visual-builder-panel">
        <div className="visual-builder-panel__head">
          <h2>Homepage Tools</h2>
          <p>Draw inside the protected homepage body. Header and footer stay outside the canvas.</p>
        </div>
        <div className="visual-builder-toolgrid" role="toolbar" aria-label="Homepage builder tools">
          <ToolButton active={tool === "draw"} onClick={() => setTool("draw")}>
            <SquareDashedMousePointer size={16} />
            Draw Block
          </ToolButton>
          <ToolButton active={tool === "select"} onClick={() => setTool("select")}>
            <MousePointer2 size={16} />
            Select
          </ToolButton>
          <ToolButton active={tool === "move"} onClick={() => setTool("move")}>
            <Move size={16} />
            Move
          </ToolButton>
          <ToolButton active={tool === "resize"} onClick={() => setTool("resize")}>
            <Crop size={16} />
            Resize
          </ToolButton>
        </div>
        <div className="visual-builder-panel__head">
          <h2>Content Types</h2>
          <p>After drawing an area, choose one of these content blocks.</p>
        </div>
        <div className="visual-builder-palette">
          {palette.map((item) => (
            <button type="button" key={item.type} onClick={() => setPendingContentRect(makeDefaultRect(blocks.length))}>
              {item.icon === "image" ? <ImageIcon size={16} /> : item.icon === "pointer" ? <MousePointer2 size={16} /> : <Type size={16} />}
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="visual-builder-main">
        <div className="visual-builder-toolbar">
          <div>
            <h1>{pageTitle} Canvas</h1>
            <p>
              {enabledBlocks.length} visible block{enabledBlocks.length === 1 ? "" : "s"}
              {hasDraft ? " - showing saved draft" : ""}
            </p>
          </div>
          <div className="row-actions">
            <Link className="button secondary" href={publicHref}>
              View Site
            </Link>
            <button className="button secondary" type="button" onClick={() => setPreview((value) => !value)}>
              <Eye size={17} />
              {preview ? "Edit" : "Preview"}
            </button>
            <button className="button secondary" type="button" disabled={!selectedBlock} onClick={duplicateSelected}>
              <Copy size={17} />
              Duplicate
            </button>
            <button className="button secondary" type="button" disabled={!history.length} onClick={undo}>
              <RotateCcw size={17} />
              Undo
            </button>
            <button className="button secondary" type="button" disabled={!future.length} onClick={redo}>
              <Redo2 size={17} />
              Redo
            </button>
            <button className="button secondary" type="button" onClick={reset}>
              Cancel
            </button>
            <button className="button secondary" type="button" disabled={state.status === "saving"} onClick={() => save("DRAFT")}>
              <Save size={17} />
              Save Draft
            </button>
            <button className="button" type="button" disabled={state.status === "saving"} onClick={() => save("PUBLISHED")}>
              <Send size={17} />
              Publish
            </button>
          </div>
        </div>

        {state.message ? <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p> : null}

        {preview ? (
          <div className="visual-builder-preview">
            <VisualPageRenderer blocks={blocks} dynamicContent={dynamicContent} />
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
                <strong>Draw the first homepage block</strong>
                <span>Click and drag anywhere inside this body canvas.</span>
              </div>
            ) : null}

            <div className="visual-builder-render-layer" aria-hidden="true" inert>
              <VisualPageRenderer blocks={blocks} dynamicContent={dynamicContent} includeDisabled />
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
      <button className="visual-builder-grip" type="button" aria-label="Move block">
        <Move size={16} />
      </button>
      {(["n", "e", "s", "w", "ne", "nw", "se", "sw"] as const).map((handle) => (
        <button
          className={`visual-builder-resize-handle visual-builder-resize-handle--${handle}`}
          type="button"
          aria-label={`Resize ${handle}`}
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
  return (
    <div className="visual-builder-modal" role="dialog" aria-modal="true" aria-labelledby="placement-title">
      <div className="visual-builder-modal__panel">
        <h2 id="placement-title">Block overlaps another block</h2>
        <p>Choose where to place the new block relative to the selected {conflict.block.type} block.</p>
        <div className="visual-builder-modal__grid">
          <button className="button secondary" type="button" onClick={() => onResolve("above")}>Place above</button>
          <button className="button secondary" type="button" onClick={() => onResolve("below")}>Place below</button>
          <button className="button secondary" type="button" onClick={() => onResolve("left")}>Place left</button>
          <button className="button secondary" type="button" onClick={() => onResolve("right")}>Place right</button>
          <button className="button secondary" type="button" onClick={() => onResolve("fit")}>Resize to fit</button>
          <button className="button danger" type="button" onClick={() => onResolve("replace")}>Replace block</button>
        </div>
        <button className="button secondary" type="button" onClick={() => onResolve("cancel")}>Cancel and draw again</button>
      </div>
    </div>
  );
}

function ContentTypeDialog({ rect, onSelect, onCancel }: { rect: CanvasRect; onSelect: (type: BuilderBlockType) => void; onCancel: () => void }) {
  return (
    <div className="visual-builder-modal" role="dialog" aria-modal="true" aria-labelledby="content-title">
      <div className="visual-builder-modal__panel">
        <h2 id="content-title">Choose content for this block</h2>
        <p>
          Area: {Math.round(rect.width)}% wide by {Math.round(rect.height)}px tall.
        </p>
        <div className="visual-builder-content-types">
          {palette.map((item) => (
            <button className="button secondary" type="button" key={item.type} onClick={() => onSelect(item.type)}>
              {item.icon === "image" ? <ImageIcon size={16} /> : item.icon === "pointer" ? <MousePointer2 size={16} /> : <Type size={16} />}
              {item.label}
            </button>
          ))}
        </div>
        <button className="button secondary" type="button" onClick={onCancel}>Cancel</button>
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!block) {
    return (
      <div className="visual-builder-inspector">
        <div className="visual-builder-panel__head">
          <h2>Inspector</h2>
          <p>Draw or select a block to edit its content, layout, and style.</p>
        </div>
        <button className="button danger" type="button" onClick={onClear}>
          <Trash2 size={17} />
          Clear Canvas
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
        <h2>Inspector</h2>
        <p>{block.type} block</p>
      </div>

      <div className="field">
        <label htmlFor="builder-type">Content Type</label>
        <select id="builder-type" value={block.type} onChange={(event) => onTypeChange(event.target.value as BuilderBlockType)}>
          {palette.map((item) => (
            <option value={item.type} key={item.type}>{item.label}</option>
          ))}
        </select>
      </div>

      <label className="checkbox-field">
        <input checked={block.enabled} type="checkbox" onChange={(event) => onChange({ enabled: event.target.checked })} />
        Visible
      </label>

      {["hero", "text", "banner", "cards", "contactCta", "image"].includes(block.type) ? (
        <Field label="Title" value={block.title ?? ""} onChange={(value) => onChange({ title: value })} />
      ) : null}

      {block.type === "hero" ? (
        <Field label="Subtitle" value={block.subtitle ?? ""} textarea onChange={(value) => onChange({ subtitle: value })} />
      ) : null}

      {["text", "banner", "contactCta"].includes(block.type) ? (
        <Field label="Text" value={block.text ?? ""} textarea onChange={(value) => onChange({ text: value })} />
      ) : null}

      {["hero", "button", "contactCta"].includes(block.type) ? (
        <>
          <Field label="Button Text" value={block.buttonText ?? ""} onChange={(value) => onChange({ buttonText: value })} />
          <Field label="Button URL" value={block.buttonUrl ?? ""} onChange={(value) => onChange({ buttonUrl: value })} />
        </>
      ) : null}

      {block.type === "image" ? (
        <ImageControls block={block} uploading={uploading} inputRef={imageInputRef} onUpload={uploadImage} onChange={onChange} />
      ) : null}

      {block.type === "twoColumn" ? (
        <>
          <Field label="Left Title" value={block.leftTitle ?? ""} onChange={(value) => onChange({ leftTitle: value })} />
          <Field label="Left Text" value={block.leftText ?? ""} textarea onChange={(value) => onChange({ leftText: value })} />
          <Field label="Right Title" value={block.rightTitle ?? ""} onChange={(value) => onChange({ rightTitle: value })} />
          <Field label="Right Text" value={block.rightText ?? ""} textarea onChange={(value) => onChange({ rightText: value })} />
        </>
      ) : null}

      {block.type === "cards" ? <CardEditor block={block} onChange={onChange} /> : null}

      {isDynamicContentType(block.type) ? (
        <InspectorGroup title="Dynamic Content Scroll">
          <p className="field-help">
            {getDynamicContentCount(block.type, dynamicContent)} item{getDynamicContentCount(block.type, dynamicContent) === 1 ? "" : "s"} available from the existing {block.type} data.
          </p>
          <div className="field">
            <label htmlFor="scroll-mode">Scroll Mode</label>
            <select id="scroll-mode" value={block.scrollMode ?? "none"} onChange={(event) => onChange({ scrollMode: event.target.value as BuilderBlock["scrollMode"] })}>
              <option value="none">None</option>
              <option value="normal">Arrow carousel</option>
              <option value="infinite">Infinite loop</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="scroll-direction">Scroll Direction</label>
            <select id="scroll-direction" value={block.scrollDirection ?? "horizontal"} onChange={(event) => onChange({ scrollDirection: event.target.value as BuilderBlock["scrollDirection"] })}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
          <label className="checkbox-field">
            <input checked={block.showCarouselArrows ?? (block.scrollMode === "normal")} type="checkbox" onChange={(event) => onChange({ showCarouselArrows: event.target.checked })} />
            Show carousel arrows
          </label>
          <label className="checkbox-field">
            <input checked={Boolean(block.autoScroll)} type="checkbox" onChange={(event) => onChange({ autoScroll: event.target.checked })} />
            Auto-scroll
          </label>
          <NumberField label="Auto-scroll Speed" value={block.autoScrollSpeed ?? 40} min={0} max={240} step={5} suffix="px/s" onChange={(value) => onChange({ autoScrollSpeed: value })} />
          <label className="checkbox-field">
            <input checked={block.titleLinkEnabled ?? true} type="checkbox" onChange={(event) => onChange({ titleLinkEnabled: event.target.checked })} />
            Link section title
          </label>
          <Field label="Title Link URL" value={block.titleLinkUrl ?? getDefaultDynamicRoute(block.type) ?? ""} onChange={(value) => onChange({ titleLinkUrl: value })} />
        </InspectorGroup>
      ) : null}

      <InspectorGroup title="Position and Size">
        <NumberField label="X Position" value={block.canvasX ?? 0} min={0} max={100} step={1} suffix="%" onChange={(value) => onChange({ canvasX: value })} />
        <NumberField label="Y Position" value={block.canvasY ?? 0} min={0} max={5000} step={8} onChange={(value) => onChange({ canvasY: value })} />
        <NumberField label="Width" value={block.canvasWidth ?? 30} min={minBlockWidthPercent} max={100} step={1} suffix="%" onChange={(value) => onChange({ canvasWidth: value })} />
        <NumberField label="Height" value={block.canvasHeight ?? 180} min={minBlockHeight} max={2000} step={8} onChange={(value) => onChange({ canvasHeight: value })} />
      </InspectorGroup>

      <TextStyleControls
        title="Title Text"
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
        title="Body Text"
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

      <InspectorGroup title="Paragraph">
        <NumberField label="Paragraph Spacing" value={block.paragraphSpacing ?? 14} min={0} max={80} onChange={(value) => onChange({ paragraphSpacing: value })} />
      </InspectorGroup>

      <InspectorGroup title="Layout">
        <div className="field">
          <label htmlFor="builder-direction">Content Direction</label>
          <select id="builder-direction" value={block.contentDirection ?? "horizontal"} onChange={(event) => onChange({ contentDirection: event.target.value as BuilderDirection })}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="horizontal-reverse">Reverse horizontal</option>
            <option value="vertical-reverse">Reverse vertical</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="builder-align">Horizontal Align</label>
          <select id="builder-align" value={block.align ?? "left"} onChange={(event) => onChange({ align: event.target.value as BuilderAlign })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="builder-valign">Vertical Align</label>
          <select id="builder-valign" value={block.verticalAlign ?? "top"} onChange={(event) => onChange({ verticalAlign: event.target.value as BuilderVerticalAlign })}>
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        <NumberField label="Gap" value={block.gap ?? 16} min={0} max={120} onChange={(value) => onChange({ gap: value })} />
        <NumberField label="Padding" value={block.padding ?? 24} min={0} max={120} onChange={(value) => onChange({ padding: value })} />
        <label className="checkbox-field">
          <input checked={block.stackOnMobile ?? true} type="checkbox" onChange={(event) => onChange({ stackOnMobile: event.target.checked })} />
          Stack on mobile
        </label>
      </InspectorGroup>

      <InspectorGroup title="Block Style">
        <Field label="Background" value={block.background ?? ""} onChange={(value) => onChange({ background: value })} placeholder="#ffffff or transparent" />
        <Field label="Border Color" value={block.borderColor ?? ""} onChange={(value) => onChange({ borderColor: value })} placeholder="#e5e7eb or transparent" />
        <NumberField label="Border Radius" value={block.borderRadius ?? getDefaultBorderRadius(block.type)} min={0} max={80} step={1} onChange={(value) => onChange({ borderRadius: value })} />
        <div className="field">
          <label htmlFor="builder-shadow">Shadow</label>
          <select id="builder-shadow" value={block.shadow ?? getDefaultShadow(block.type)} onChange={(event) => onChange({ shadow: event.target.value as BuilderShadow })}>
            <option value="none">None</option>
            <option value="soft">Soft</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </select>
        </div>
        <NumberField label="Opacity" value={block.opacity ?? 1} min={0.1} max={1} step={0.05} suffix="" onChange={(value) => onChange({ opacity: value })} />
        <label className="checkbox-field">
          <input checked={block.hoverEffect ?? hasDefaultHoverEffect(block.type)} type="checkbox" onChange={(event) => onChange({ hoverEffect: event.target.checked })} />
          Hover effect
        </label>
      </InspectorGroup>

      <button className="button danger" type="button" disabled={disabled} onClick={onDelete}>
        <Trash2 size={17} />
        Delete Block
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
  return (
    <InspectorGroup title="Image">
      {block.imageId ? (
        <div className="theme-background-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/media/${block.imageId}`} alt="" />
        </div>
      ) : null}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} />
      <p className="field-help">{uploading ? "Uploading image." : "Upload or replace this block image."}</p>
      <Field label="Alt Text" value={block.imageAlt ?? ""} onChange={(value) => onChange({ imageAlt: value })} />
      <div className="field">
        <label htmlFor="image-fit">Fit Mode</label>
        <select id="image-fit" value={block.imageFit ?? "cover"} onChange={(event) => onChange({ imageFit: event.target.value as BuilderImageFit })}>
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </div>
      <NumberField label="Zoom" value={block.imageZoom ?? 1} min={0.25} max={4} step={0.05} suffix="x" onChange={(value) => onChange({ imageZoom: value })} />
      <NumberField label="Image X Offset" value={block.imageOffsetX ?? 0} min={-100} max={100} step={1} suffix="%" onChange={(value) => onChange({ imageOffsetX: value })} />
      <NumberField label="Image Y Offset" value={block.imageOffsetY ?? 0} min={-100} max={100} step={1} suffix="%" onChange={(value) => onChange({ imageOffsetY: value })} />
      <NumberField label="Focal X" value={block.focalX ?? 50} min={0} max={100} step={1} suffix="%" onChange={(value) => onChange({ focalX: value })} />
      <NumberField label="Focal Y" value={block.focalY ?? 50} min={0} max={100} step={1} suffix="%" onChange={(value) => onChange({ focalY: value })} />
    </InspectorGroup>
  );
}

function TextStyleControls({
  title,
  style,
  fallback,
  showWrap = false,
  onChange
}: {
  title: string;
  style?: BuilderTextElementStyle;
  fallback: Required<Pick<BuilderTextElementStyle, "fontFamily" | "fontSize" | "fontWeight" | "color" | "lineHeight" | "letterSpacing" | "align">> &
    Pick<BuilderTextElementStyle, "wrap">;
  showWrap?: boolean;
  onChange: (patch: Partial<BuilderTextElementStyle>) => void;
}) {
  const idPrefix = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const current = {
    ...fallback,
    ...(style ?? {})
  };

  return (
    <InspectorGroup title={title}>
      <Field label={`${title} Font Family`} value={current.fontFamily ?? ""} onChange={(value) => onChange({ fontFamily: value })} placeholder="Inter, Arial, sans-serif" />
      <div className="field">
        <label htmlFor={`${idPrefix}-font-size`}>Font Size</label>
        <select id={`${idPrefix}-font-size`} value={current.fontSize ?? fallback.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })}>
          {fontSizes.map((size) => (
            <option value={size} key={size}>{size}px</option>
          ))}
        </select>
      </div>
      <NumberField label={`${title} Custom Font Size`} value={current.fontSize ?? fallback.fontSize} min={8} max={120} onChange={(value) => onChange({ fontSize: value })} />
      <NumberField label={`${title} Font Weight`} value={current.fontWeight ?? fallback.fontWeight} min={100} max={1000} step={100} suffix="" onChange={(value) => onChange({ fontWeight: value })} />
      <Field label={`${title} Color`} value={current.color ?? ""} onChange={(value) => onChange({ color: value })} placeholder="#111827" />
      <NumberField label={`${title} Line Height`} value={current.lineHeight ?? fallback.lineHeight} min={0.8} max={3} step={0.05} suffix="" onChange={(value) => onChange({ lineHeight: value })} />
      <NumberField label={`${title} Letter Spacing`} value={current.letterSpacing ?? fallback.letterSpacing} min={-2} max={20} step={0.5} onChange={(value) => onChange({ letterSpacing: value })} />
      <div className="field">
        <label htmlFor={`${idPrefix}-align`}>Alignment</label>
        <select id={`${idPrefix}-align`} value={current.align ?? fallback.align} onChange={(event) => onChange({ align: event.target.value as BuilderAlign })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      {showWrap ? (
        <label className="checkbox-field">
          <input checked={Boolean(current.wrap)} type="checkbox" onChange={(event) => onChange({ wrap: event.target.checked })} />
          Allow title wrapping
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
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
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
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="field number-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
      <div className="number-field__value">
        <input aria-label={`${label} value`} type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
        <span>{suffix}</span>
      </div>
    </div>
  );
}

function CardEditor({ block, onChange }: { block: BuilderBlock; onChange: (patch: Partial<BuilderBlock>) => void }) {
  const cards = block.cards ?? [];
  return (
    <div className="visual-builder-card-editor">
      <h3>Cards</h3>
      {cards.map((card, index) => (
        <div className="admin-panel" key={index}>
          <Field
            label={`Card ${index + 1} Title`}
            value={card.title}
            onChange={(value) => {
              const next = [...cards];
              next[index] = { ...card, title: value };
              onChange({ cards: next });
            }}
          />
          <Field
            label={`Card ${index + 1} Text`}
            value={card.text}
            textarea
            onChange={(value) => {
              const next = [...cards];
              next[index] = { ...card, text: value };
              onChange({ cards: next });
            }}
          />
          <Field
            label={`Card ${index + 1} URL`}
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
        onClick={() => onChange({ cards: [...cards, { title: "New card", text: "Card description" }] })}
      >
        Add Card
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
