"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Eye, GripVertical, ImageIcon, MousePointer2, Plus, RotateCcw, Save, Send, Trash2, Type } from "lucide-react";
import { VisualPageRenderer } from "@/components/shared/VisualPageRenderer";
import { createBuilderBlock } from "@/modules/page-builder/page-builder.defaults";
import type { BuilderAlign, BuilderBlock, BuilderBlockType, BuilderWidth } from "@/modules/page-builder/page-builder.types";

type VisualPageBuilderProps = {
  page: {
    title: string;
    slug: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
  initialBlocks: BuilderBlock[];
  hasDraft?: boolean;
};

type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  message: string;
};

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
  { type: "contactCta", label: "Contact CTA", icon: "pointer" }
];

export function VisualPageBuilder({ page, initialBlocks, hasDraft = false }: VisualPageBuilderProps) {
  const [blocks, setBlocks] = useState<BuilderBlock[]>(initialBlocks);
  const [history, setHistory] = useState<BuilderBlock[][]>([]);
  const [selectedId, setSelectedId] = useState(initialBlocks[0]?.id ?? "");
  const [preview, setPreview] = useState(false);
  const [state, setState] = useState<SaveState>({ status: "idle", message: "" });
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const selectedBlock = blocks.find((block) => block.id === selectedId) ?? blocks[0] ?? null;
  const pageTitle = page.title || "Home";
  const publicHref = page.slug === "home" ? "/" : `/${page.slug}`;

  const enabledBlocks = useMemo(() => blocks.filter((block) => block.enabled), [blocks]);

  function commit(nextBlocks: BuilderBlock[], nextSelectedId = selectedId) {
    setHistory((current) => [...current.slice(-19), blocks]);
    setBlocks(nextBlocks);
    setSelectedId(nextSelectedId);
    setState({ status: "idle", message: "" });
  }

  function addBlock(type: BuilderBlockType, index = blocks.length) {
    const block = createBuilderBlock(type);
    const nextBlocks = [...blocks];
    nextBlocks.splice(index, 0, block);
    commit(nextBlocks, block.id);
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

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setBlocks(previous);
    setHistory((current) => current.slice(0, -1));
    setSelectedId(previous[0]?.id ?? "");
  }

  function reset() {
    setHistory((current) => [...current.slice(-19), blocks]);
    setBlocks(initialBlocks);
    setSelectedId(initialBlocks[0]?.id ?? "");
  }

  function onPaletteDragStart(event: React.DragEvent<HTMLButtonElement>, type: BuilderBlockType) {
    event.dataTransfer.setData("application/x-builder-new", type);
  }

  function onBlockDragStart(event: React.DragEvent<HTMLDivElement>, blockId: string) {
    setDraggedBlockId(blockId);
    event.dataTransfer.setData("application/x-builder-existing", blockId);
  }

  function onDropAt(event: React.DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    const newType = event.dataTransfer.getData("application/x-builder-new") as BuilderBlockType;
    const existingId = event.dataTransfer.getData("application/x-builder-existing");

    if (newType) {
      addBlock(newType, index);
      return;
    }

    if (existingId) {
      const moving = blocks.find((block) => block.id === existingId);
      if (!moving) return;
      const without = blocks.filter((block) => block.id !== existingId);
      const nextIndex = Math.min(index, without.length);
      without.splice(nextIndex, 0, moving);
      commit(without, moving.id);
      setDraggedBlockId(null);
    }
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
    setState({ status: "saved", message: status === "PUBLISHED" ? "Published." : "Draft saved." });
  }

  return (
    <div className="visual-builder-shell">
      <aside className="visual-builder-panel">
        <div className="visual-builder-panel__head">
          <h2>Blocks</h2>
          <p>Drag blocks into the page or click to add.</p>
        </div>
        <div className="visual-builder-palette">
          {palette.map((item) => (
            <button
              draggable
              type="button"
              key={item.type}
              onClick={() => addBlock(item.type)}
              onDragStart={(event) => onPaletteDragStart(event, item.type)}
            >
              {item.icon === "image" ? <ImageIcon size={16} /> : item.icon === "pointer" ? <MousePointer2 size={16} /> : <Type size={16} />}
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="visual-builder-main">
        <div className="visual-builder-toolbar">
          <div>
            <h1>{pageTitle} Builder</h1>
            <p>
              {enabledBlocks.length} visible block{enabledBlocks.length === 1 ? "" : "s"}
              {hasDraft ? " · showing saved draft" : ""}
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
            <button className="button secondary" type="button" disabled={!history.length} onClick={undo}>
              <RotateCcw size={17} />
              Undo
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
            <VisualPageRenderer blocks={blocks} editing />
          </div>
        ) : (
          <div className="visual-builder-canvas">
            <DropZone onDrop={(event) => onDropAt(event, 0)} />
            {blocks.map((block, index) => (
              <div key={block.id}>
                <div
                  className={`visual-builder-block${selectedId === block.id ? " is-selected" : ""}${draggedBlockId === block.id ? " is-dragging" : ""}`}
                  data-block-type={block.type}
                  draggable
                  onClick={() => setSelectedId(block.id)}
                  onDragStart={(event) => onBlockDragStart(event, block.id)}
                  onDragEnd={() => setDraggedBlockId(null)}
                >
                  <button className="visual-builder-grip" type="button" aria-label="Drag block">
                    <GripVertical size={18} />
                  </button>
                  <VisualPageRenderer blocks={[block]} editing />
                </div>
                <DropZone onDrop={(event) => onDropAt(event, index + 1)} />
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className="visual-builder-panel">
        <BlockInspector
          block={selectedBlock}
          pageSlug={page.slug}
          onChange={updateSelected}
          onDelete={removeSelected}
          disabled={state.status === "saving"}
        />
      </aside>
    </div>
  );
}

function DropZone({ onDrop }: { onDrop: (event: React.DragEvent<HTMLDivElement>) => void }) {
  return (
    <div
      className="visual-builder-dropzone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <Plus size={16} />
      Drop block here
    </div>
  );
}

function BlockInspector({
  block,
  pageSlug,
  onChange,
  onDelete,
  disabled
}: {
  block: BuilderBlock | null;
  pageSlug: string;
  onChange: (patch: Partial<BuilderBlock>) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!block) {
    return (
      <div className="visual-builder-panel__head">
        <h2>Inspector</h2>
        <p>Add a block to start editing.</p>
      </div>
    );
  }
  const currentBlock = block;

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
        <p>{block.type}</p>
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
        <>
          {block.imageId ? (
            <div className="theme-background-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${block.imageId}`} alt="" />
            </div>
          ) : null}
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} />
          <p className="field-help">{uploading ? "Uploading image." : "Upload or replace this block image."}</p>
          <Field label="Alt Text" value={block.imageAlt ?? ""} onChange={(value) => onChange({ imageAlt: value })} />
        </>
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

      <div className="visual-builder-size-controls">
        <h3>Block Size</h3>
        <NumberField
          label="Page Width"
          value={block.blockWidth ?? 100}
          min={25}
          max={100}
          step={5}
          suffix="%"
          onChange={(value) => onChange({ blockWidth: value })}
        />
        <NumberField
          label="Minimum Height"
          value={block.minHeight ?? 0}
          min={0}
          max={1000}
          step={20}
          onChange={(value) => onChange({ minHeight: value })}
        />
        <div className="visual-builder-size-presets" aria-label="Block width presets">
          {[25, 50, 75, 100].map((size) => (
            <button
              className={block.blockWidth === size ? "button" : "button secondary"}
              type="button"
              key={size}
              onClick={() => onChange({ blockWidth: size })}
            >
              {size}%
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="builder-width">Content Width</label>
        <select id="builder-width" value={block.width ?? "normal"} onChange={(event) => onChange({ width: event.target.value as BuilderWidth })}>
          <option value="narrow">Narrow</option>
          <option value="normal">Normal</option>
          <option value="wide">Wide</option>
          <option value="full">Full</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="builder-align">Alignment</label>
        <select id="builder-align" value={block.align ?? "left"} onChange={(event) => onChange({ align: event.target.value as BuilderAlign })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
        <span className="field-help">Block positioning is most visible when Page Width is below 100%.</span>
      </div>

      <Field label="Background" value={block.background ?? ""} onChange={(value) => onChange({ background: value })} placeholder="#ffffff or transparent" />
      <Field label="Text Color" value={block.color ?? ""} onChange={(value) => onChange({ color: value })} placeholder="#111827" />
      <NumberField label="Font Size" value={block.fontSize ?? 18} min={12} max={64} onChange={(value) => onChange({ fontSize: value })} />
      <NumberField label="Vertical Space" value={block.paddingY ?? 56} min={0} max={180} onChange={(value) => onChange({ paddingY: value })} />
      {block.type === "spacer" ? (
        <NumberField label="Spacer Height" value={block.height ?? 48} min={0} max={240} onChange={(value) => onChange({ height: value })} />
      ) : null}

      <button className="button danger" type="button" disabled={disabled} onClick={onDelete}>
        <Trash2 size={17} />
        Delete Block
      </button>
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
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="field-help">{value}{suffix}</span>
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
