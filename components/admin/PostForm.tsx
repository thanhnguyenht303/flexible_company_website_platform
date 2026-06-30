"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bold, Heading2, ImageIcon, Italic, List, ListOrdered, Quote, Save, Trash2 } from "lucide-react";
import { ArticleContent } from "@/components/shared/ArticleContent";

type FormState = {
  status: "idle" | "saving" | "deleting" | "error";
  message: string;
};

const maxUploadWidth = 1600;
const maxUploadHeight = 1000;
const imageQuality = 0.82;

type PostFormPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featuredImageId: string | null;
};

type PostFormProps = {
  post?: PostFormPost;
};

type InlineImage = {
  token: string;
  file: File;
  previewUrl: string;
  altText: string;
};

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([]);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const inlineImagesRef = useRef<InlineImage[]>([]);
  const isEditing = Boolean(post);

  useEffect(() => {
    inlineImagesRef.current = inlineImages;
  }, [inlineImages]);

  useEffect(() => {
    return () => {
      inlineImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: "Optimizing image size before upload." });

    const payload = new FormData(event.currentTarget);
    const featuredImage = payload.get("featuredImage");

    if (featuredImage instanceof File && featuredImage.size > 0) {
      const optimizedImage = await optimizeImageForUpload(featuredImage).catch(() => featuredImage);
      payload.set("featuredImage", optimizedImage);
    }

    inlineImages.forEach((image) => {
      if (!content.includes(`post-image:${image.token}`)) return;
      payload.append("inlineImages", image.file);
      payload.append("inlineImageTokens", image.token);
      payload.append("inlineImageAltTexts", image.altText);
    });

    setState({ status: "saving", message: "Saving post." });

    const response = await fetch(isEditing ? `/api/admin/posts/${post?.id}` : "/api/admin/posts", {
      method: isEditing ? "PATCH" : "POST",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Post could not be saved."
      });
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  function insertArticleSyntax(kind: "bold" | "italic" | "heading" | "quote" | "ul" | "ol" | "divider") {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end).trim();
    const prefix = content.slice(0, start);
    const suffix = content.slice(end);
    const needsLeadingBreak = prefix.length > 0 && !prefix.endsWith("\n") ? "\n\n" : "";
    const needsTrailingBreak = suffix.length > 0 && !suffix.startsWith("\n") ? "\n\n" : "";

    const inserted =
      kind === "bold"
        ? `**${selected || "bold text"}**`
        : kind === "italic"
          ? `*${selected || "italic text"}*`
          : kind === "heading"
        ? `## ${selected || "Section heading"}`
        : kind === "quote"
          ? `> ${selected || "A memorable line or customer insight."}`
          : kind === "ul"
            ? `- ${selected || "List item"}`
            : kind === "ol"
              ? `1. ${selected || "List item"}`
              : "---";

    const nextContent = `${prefix}${needsLeadingBreak}${inserted}${needsTrailingBreak}${suffix}`;
    setContent(nextContent);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = prefix.length + needsLeadingBreak.length + inserted.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertTextSize(size: "small" | "large" | "xl") {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end).trim();
    const prefix = content.slice(0, start);
    const suffix = content.slice(end);
    const inserted = `{${size}:${selected || "sized text"}}`;
    const nextContent = `${prefix}${inserted}${suffix}`;
    setContent(nextContent);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = prefix.length + inserted.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function onInlineImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setState({ status: "saving", message: "Preparing inline image." });
    const optimizedImage = await optimizeImageForUpload(file).catch(() => file);
    const token = `inline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const altText = getImageAltText(file.name);
    const previewUrl = URL.createObjectURL(optimizedImage);

    setInlineImages((current) => [...current, { token, file: optimizedImage, previewUrl, altText }]);
    insertAtCursor(`![${altText}](post-image:${token})`);
    setState({ status: "idle", message: "" });
  }

  function insertAtCursor(inserted: string) {
    const textarea = contentRef.current;
    if (!textarea) {
      setContent((current) => `${current}${current.endsWith("\n") || !current ? "" : "\n\n"}${inserted}\n\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prefix = content.slice(0, start);
    const suffix = content.slice(end);
    const needsLeadingBreak = prefix.length > 0 && !prefix.endsWith("\n") ? "\n\n" : "";
    const needsTrailingBreak = suffix.length > 0 && !suffix.startsWith("\n") ? "\n\n" : "";
    const nextContent = `${prefix}${needsLeadingBreak}${inserted}${needsTrailingBreak}${suffix}`;
    setContent(nextContent);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = prefix.length + needsLeadingBreak.length + inserted.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function onDelete() {
    if (!post) return;
    const confirmed = window.confirm(`Delete "${post.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Post could not be deleted."
      });
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <form className="post-editor-form" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="post-editor-layout">
        <main className="post-writing-surface">
          <input
            className="post-title-input"
            aria-label="Post title"
            name="title"
            required
            minLength={2}
            maxLength={180}
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="post-subtitle-input"
            aria-label="Post subtitle"
            name="excerpt"
            maxLength={320}
            placeholder="Tell readers what this story is about"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
          />
          <div className="post-editor-toolbar" aria-label="Article formatting">
            <button type="button" onClick={() => insertArticleSyntax("bold")}>
              <Bold size={17} />
              Bold
            </button>
            <button type="button" onClick={() => insertArticleSyntax("italic")}>
              <Italic size={17} />
              Italic
            </button>
            <select
              aria-label="Text size"
              defaultValue=""
              onChange={(event) => {
                const value = event.target.value;
                if (value === "small" || value === "large" || value === "xl") {
                  insertTextSize(value);
                }
                event.target.value = "";
              }}
            >
              <option value="" disabled>
                Size
              </option>
              <option value="small">Small</option>
              <option value="large">Large</option>
              <option value="xl">Extra large</option>
            </select>
            <button type="button" onClick={() => insertArticleSyntax("heading")}>
              <Heading2 size={17} />
              Heading
            </button>
            <button type="button" onClick={() => insertArticleSyntax("quote")}>
              <Quote size={17} />
              Quote
            </button>
            <button type="button" onClick={() => insertArticleSyntax("ul")}>
              <List size={17} />
              List
            </button>
            <button type="button" onClick={() => insertArticleSyntax("ol")}>
              <ListOrdered size={17} />
              Steps
            </button>
            <button type="button" onClick={() => insertArticleSyntax("divider")}>
              Divider
            </button>
            <button type="button" onClick={() => inlineImageInputRef.current?.click()}>
              <ImageIcon size={17} />
              Image
            </button>
          </div>
          <input
            ref={inlineImageInputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onInlineImageSelected}
          />
          <textarea
            ref={contentRef}
            className="post-content-input"
            aria-label="Article body"
            name="content"
            required
            minLength={20}
            placeholder="Write your article. Use ## for section headings, > for quotes, - for lists, and blank lines between paragraphs."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <div className="post-editor-stats">
            <span>{getWordCount(content)} words</span>
            <span>{getReadingTime(content)} min read</span>
          </div>
        </main>

        <aside className="post-editor-side">
          <div className="admin-panel form-grid">
            <div className="field">
              <label htmlFor="slug">Slug</label>
              <input
                id="slug"
                name="slug"
                placeholder="auto-generated from title if blank"
                maxLength={220}
                defaultValue={post?.slug ?? ""}
              />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={post?.status ?? "DRAFT"}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="featuredImage">Cover Image</label>
              {post?.featuredImageId ? (
                <div className="image-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${post.featuredImageId}`} alt="" />
                </div>
              ) : null}
              <input
                id="featuredImage"
                name="featuredImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
              <p className="field-help">Recommended: 1600 x 900px. This becomes the article cover image.</p>
            </div>
            <div className="form-actions">
              <button className="button" type="submit" disabled={state.status === "saving"}>
                <Save size={18} />
                {state.status === "saving" ? "Saving" : "Save Article"}
              </button>
              {post ? (
                <button
                  className="button danger"
                  type="button"
                  disabled={state.status === "deleting"}
                  onClick={onDelete}
                >
                  <Trash2 size={18} />
                  {state.status === "deleting" ? "Deleting" : "Delete"}
                </button>
              ) : null}
            </div>
            {state.message ? (
              <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
            ) : null}
          </div>
        </aside>
      </div>

      {content.trim() || title.trim() || excerpt.trim() ? (
        <section className="post-preview-panel">
          <div className="article-header article-header--preview">
            <div className="article-kicker">Preview</div>
            <h1>{title || "Untitled article"}</h1>
            {excerpt ? <p className="article-deck">{excerpt}</p> : null}
            <div className="article-meta">
              <span>Draft preview</span>
              <span>{getReadingTime(content)} min read</span>
            </div>
          </div>
          <div className="article-content-wrap article-content-wrap--preview">
            <ArticleContent
              content={getPreviewContent(
                content || "Start writing above to see how the article will read on the public blog.",
                inlineImages
              )}
            />
          </div>
        </section>
      ) : null}
    </form>
  );
}

function getPreviewContent(content: string, inlineImages: InlineImage[]) {
  return inlineImages.reduce(
    (nextContent, image) => nextContent.replaceAll(`post-image:${image.token}`, image.previewUrl),
    content
  );
}

function getImageAltText(filename: string) {
  return (
    filename
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Article image"
  );
}

function getWordCount(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function getReadingTime(content: string) {
  return Math.max(1, Math.ceil(getWordCount(content) / 220));
}

async function optimizeImageForUpload(file: File) {
  if (file.type === "image/svg+xml" || !file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(maxUploadWidth / image.width, maxUploadHeight / image.height, 1);
  const targetWidth = Math.round(image.width * scale);
  const targetHeight = Math.round(image.height * scale);

  if (scale === 1 && file.size <= 1_500_000) {
    URL.revokeObjectURL(image.src);
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(image.src);
    return file;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  URL.revokeObjectURL(image.src);

  const webpBlob = await canvasToBlob(canvas, "image/webp", imageQuality);
  const outputBlob = webpBlob ?? (await canvasToBlob(canvas, "image/jpeg", imageQuality));

  if (!outputBlob || outputBlob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "post-image";
  const extension = outputBlob.type === "image/webp" ? "webp" : "jpg";

  return new File([outputBlob], `${baseName}.${extension}`, {
    type: outputBlob.type,
    lastModified: Date.now()
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(image.src);
      reject(new Error("Image could not be loaded."));
    };
    image.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}
