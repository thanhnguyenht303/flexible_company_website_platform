"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";

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

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });
  const isEditing = Boolean(post);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: "Optimizing image size before upload." });

    const payload = new FormData(event.currentTarget);
    const featuredImage = payload.get("featuredImage");

    if (featuredImage instanceof File && featuredImage.size > 0) {
      const optimizedImage = await optimizeImageForUpload(featuredImage).catch(() => featuredImage);
      payload.set("featuredImage", optimizedImage);
    }

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
    <form className="admin-panel form-grid" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          required
          minLength={2}
          maxLength={180}
          defaultValue={post?.title ?? ""}
        />
      </div>
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
        <label htmlFor="excerpt">Excerpt</label>
        <textarea id="excerpt" name="excerpt" maxLength={320} defaultValue={post?.excerpt ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" required minLength={20} defaultValue={post?.content ?? ""} />
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
        <label htmlFor="featuredImage">Featured Image</label>
        {post?.featuredImageId ? (
          <div className="image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${post.featuredImageId}`} alt="" />
          </div>
        ) : null}
        <input id="featuredImage" name="featuredImage" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" />
        <p className="field-help">Recommended: 1600 x 900px. Large JPG, PNG, and WEBP files are downscaled before upload.</p>
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? "Saving" : "Save Post"}
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
    </form>
  );
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
