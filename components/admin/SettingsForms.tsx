"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SiteSettingsForm({ site }: { site: Record<string, unknown> }) {
  const router = useRouter();
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [logoCrop, setLogoCrop] = useState<LogoCropState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    return () => {
      if (logoCrop?.src) URL.revokeObjectURL(logoCrop.src);
    };
  }, [logoCrop?.src]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");
    const payload = new FormData(event.currentTarget);

    if (logoCrop) {
      setMessage("Preparing cropped logo.");
      try {
        payload.set("logo", await createCroppedLogoFile(logoCrop));
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Logo crop could not be prepared.");
        return;
      }
    }

    const response = await fetch("/api/admin/settings/site", {
      method: "PUT",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState("error");
      setMessage(body?.error?.message ?? "Save failed.");
      return;
    }

    setState("saved");
    setMessage("Saved.");
    router.refresh();
  }

  function onLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setLogoCrop(null);
      return;
    }

    const src = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      setLogoCrop((current) => {
        if (current?.src) URL.revokeObjectURL(current.src);
        return {
          src,
          fileName: file.name,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          offsetX: 0,
          offsetY: 0,
          zoom: 1
        };
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      setState("error");
      setMessage("Logo preview could not be loaded.");
    };
    image.src = src;
  }

  function onCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!logoCrop) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: logoCrop.offsetX,
      originY: logoCrop.offsetY
    });
  }

  function onCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    setLogoCrop((current) =>
      current
        ? clampLogoCrop({
            ...current,
            offsetX: drag.originX + event.clientX - drag.startX,
            offsetY: drag.originY + event.clientY - drag.startY
          })
        : null
    );
  }

  function onCropPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (drag?.pointerId === event.pointerId) setDrag(null);
  }

  function onZoomChange(event: React.ChangeEvent<HTMLInputElement>) {
    const zoom = Number(event.target.value);
    setLogoCrop((current) => (current ? clampLogoCrop({ ...current, zoom }) : null));
  }

  return (
    <form className="admin-panel form-grid" encType="multipart/form-data" onSubmit={submit}>
      {["siteName", "tagline", "description", "email", "phone", "address", "domain"].map((name) => (
        <div className="field" key={name}>
          <label htmlFor={name}>{labelize(name)}</label>
          <input id={name} name={name} defaultValue={stringValue(site[name])} />
        </div>
      ))}
      <div className="field">
        <label htmlFor="logo">Site Logo</label>
        {stringValue(site.logoId) ? (
          <div className="site-logo-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${stringValue(site.logoId)}`} alt="" />
          </div>
        ) : null}
        <input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onLogoChange} />
        <p className="field-help">Upload a logo, drag it inside the square, then save it for the top-left brand area.</p>
        {logoCrop ? (
          <div className="site-logo-crop-workspace">
            <div
              className="site-logo-cropper"
              role="application"
              aria-label="Drag logo crop position"
              onPointerDown={onCropPointerDown}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerEnd}
              onPointerCancel={onCropPointerEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoCrop.src} alt="" style={getLogoCropImageStyle(logoCrop)} draggable={false} />
            </div>
            <div className="field site-logo-zoom">
              <label htmlFor="logoZoom">Zoom</label>
              <input
                id="logoZoom"
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={logoCrop.zoom}
                onChange={onZoomChange}
              />
            </div>
          </div>
        ) : null}
      </div>
      <button className="button" type="submit" disabled={state === "saving"}>
        <Save size={18} />
        {state === "saving" ? "Saving" : "Save"}
      </button>
      <StatusMessage state={state} message={message} />
    </form>
  );
}

export function ThemeSettingsForm({ theme }: { theme: Record<string, unknown> }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [backgroundCrop, setBackgroundCrop] = useState<LogoCropState | null>(null);
  const [backgroundDrag, setBackgroundDrag] = useState<DragState | null>(null);
  const colorFields = ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor"];

  useEffect(() => {
    return () => {
      if (backgroundCrop?.src) URL.revokeObjectURL(backgroundCrop.src);
    };
  }, [backgroundCrop?.src]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveTheme(new FormData(event.currentTarget));
  }

  async function saveTheme(payload: FormData) {
    setState("saving");
    setMessage("");
    const shouldRemoveBackground = payload.get("removeBackgroundImage") === "true";

    if (backgroundCrop && !shouldRemoveBackground) {
      setMessage("Preparing cropped background.");
      try {
        payload.set("backgroundImage", await createCroppedBackgroundFile(backgroundCrop));
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Background crop could not be prepared.");
        return;
      }
    }

    const response = await fetch("/api/admin/settings/theme", {
      method: "PUT",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState("error");
      setMessage(body?.error?.message ?? "Save failed.");
      return;
    }

    setState("saved");
    setMessage("Saved.");
    router.refresh();
  }

  async function removeBackgroundImage() {
    if (backgroundCrop && !stringValue(theme.backgroundImageId)) {
      setBackgroundCrop(null);
      if (backgroundInputRef.current) backgroundInputRef.current.value = "";
      return;
    }

    const confirmed = window.confirm("Remove the theme background image and use the background color only?");
    if (!confirmed || !formRef.current) return;

    setBackgroundCrop(null);
    if (backgroundInputRef.current) backgroundInputRef.current.value = "";
    const payload = new FormData(formRef.current);
    payload.set("removeBackgroundImage", "true");
    payload.delete("backgroundImage");
    await saveTheme(payload);
  }

  function onBackgroundChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setBackgroundCrop(null);
      return;
    }

    const src = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      setBackgroundCrop((current) => {
        if (current?.src) URL.revokeObjectURL(current.src);
        return {
          src,
          fileName: file.name,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          offsetX: 0,
          offsetY: 0,
          zoom: 1
        };
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      setState("error");
      setMessage("Background preview could not be loaded.");
    };
    image.src = src;
  }

  function onBackgroundPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!backgroundCrop) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setBackgroundDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: backgroundCrop.offsetX,
      originY: backgroundCrop.offsetY
    });
  }

  function onBackgroundPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!backgroundDrag || backgroundDrag.pointerId !== event.pointerId) return;
    setBackgroundCrop((current) =>
      current
        ? clampBackgroundCrop({
            ...current,
            offsetX: backgroundDrag.originX + event.clientX - backgroundDrag.startX,
            offsetY: backgroundDrag.originY + event.clientY - backgroundDrag.startY
          })
        : null
    );
  }

  function onBackgroundPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (backgroundDrag?.pointerId === event.pointerId) setBackgroundDrag(null);
  }

  function onBackgroundZoomChange(event: React.ChangeEvent<HTMLInputElement>) {
    const zoom = Number(event.target.value);
    setBackgroundCrop((current) => (current ? clampBackgroundCrop({ ...current, zoom }) : null));
  }

  return (
    <form ref={formRef} className="admin-panel form-grid" encType="multipart/form-data" onSubmit={submit}>
      {colorFields.map((name) => (
        <div className="field" key={name}>
          <label htmlFor={name}>{labelize(name)}</label>
          <input id={name} name={name} type="color" defaultValue={stringValue(theme[name]) || "#2563EB"} />
        </div>
      ))}
      <div className="field">
        <label htmlFor="fontFamily">Font Family</label>
        <input id="fontFamily" name="fontFamily" defaultValue={stringValue(theme.fontFamily) || "Inter"} />
      </div>
      <div className="field">
        <label htmlFor="borderRadius">Border Radius</label>
        <select id="borderRadius" name="borderRadius" defaultValue={stringValue(theme.borderRadius) || "medium"}>
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="backgroundImage">Background Image</label>
        {stringValue(theme.backgroundImageId) ? (
          <div className="theme-background-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${stringValue(theme.backgroundImageId)}`} alt="" />
          </div>
        ) : null}
        <input
          ref={backgroundInputRef}
          id="backgroundImage"
          name="backgroundImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onBackgroundChange}
        />
        <p className="field-help">
          Upload a theme background, drag it inside the wide crop area, and save. Background color remains the fallback.
        </p>
        {backgroundCrop ? (
          <div className="theme-background-crop-workspace">
            <div
              className="theme-background-cropper"
              role="application"
              aria-label="Drag background crop position"
              onPointerDown={onBackgroundPointerDown}
              onPointerMove={onBackgroundPointerMove}
              onPointerUp={onBackgroundPointerEnd}
              onPointerCancel={onBackgroundPointerEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backgroundCrop.src} alt="" style={getBackgroundCropImageStyle(backgroundCrop)} draggable={false} />
            </div>
            <div className="field theme-background-zoom">
              <label htmlFor="backgroundZoom">Zoom</label>
              <input
                id="backgroundZoom"
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={backgroundCrop.zoom}
                onChange={onBackgroundZoomChange}
              />
            </div>
          </div>
        ) : null}
        {stringValue(theme.backgroundImageId) || backgroundCrop ? (
          <button className="button danger" type="button" disabled={state === "saving"} onClick={removeBackgroundImage}>
            Remove Background Image
          </button>
        ) : null}
      </div>
      <input type="hidden" name="headerLayout" value={stringValue(theme.headerLayout) || "classic"} />
      <input type="hidden" name="footerLayout" value={stringValue(theme.footerLayout) || "standard"} />
      <button className="button" type="submit" disabled={state === "saving"}>
        <Save size={18} />
        {state === "saving" ? "Saving" : "Save"}
      </button>
      <StatusMessage state={state} message={message} />
    </form>
  );
}

type LogoCropState = {
  src: string;
  fileName: string;
  naturalWidth: number;
  naturalHeight: number;
  offsetX: number;
  offsetY: number;
  zoom: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const logoCropPreviewSize = 280;
const logoCropOutputSize = 512;
const backgroundCropPreviewWidth = 480;
const backgroundCropPreviewHeight = 270;
const backgroundCropOutputWidth = 1920;
const backgroundCropOutputHeight = 1080;

function StatusMessage({ state, message }: { state: SaveState; message?: string }) {
  if (state === "idle" || state === "saving") return null;
  return (
    <p className={`message ${state === "error" ? "error" : ""}`}>
      {message || (state === "saved" ? "Saved." : "Save failed.")}
    </p>
  );
}

function getLogoCropImageStyle(crop: LogoCropState): React.CSSProperties {
  const layout = getLogoCropLayout(crop);

  return {
    position: "absolute",
    left: `${layout.left}px`,
    top: `${layout.top}px`,
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    maxWidth: "none",
    userSelect: "none",
    touchAction: "none"
  };
}

function getLogoCropLayout(crop: LogoCropState) {
  const baseScale = Math.max(logoCropPreviewSize / crop.naturalWidth, logoCropPreviewSize / crop.naturalHeight);
  const scale = baseScale * crop.zoom;
  const width = crop.naturalWidth * scale;
  const height = crop.naturalHeight * scale;

  return {
    scale,
    width,
    height,
    left: (logoCropPreviewSize - width) / 2 + crop.offsetX,
    top: (logoCropPreviewSize - height) / 2 + crop.offsetY
  };
}

function getBackgroundCropImageStyle(crop: LogoCropState): React.CSSProperties {
  const layout = getBackgroundCropLayout(crop);

  return {
    position: "absolute",
    left: `${layout.left}px`,
    top: `${layout.top}px`,
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    maxWidth: "none",
    userSelect: "none",
    touchAction: "none"
  };
}

function getBackgroundCropLayout(crop: LogoCropState) {
  const baseScale = Math.max(
    backgroundCropPreviewWidth / crop.naturalWidth,
    backgroundCropPreviewHeight / crop.naturalHeight
  );
  const scale = baseScale * crop.zoom;
  const width = crop.naturalWidth * scale;
  const height = crop.naturalHeight * scale;

  return {
    scale,
    width,
    height,
    left: (backgroundCropPreviewWidth - width) / 2 + crop.offsetX,
    top: (backgroundCropPreviewHeight - height) / 2 + crop.offsetY
  };
}

function clampLogoCrop(crop: LogoCropState): LogoCropState {
  const layout = getLogoCropLayout(crop);
  const maxX = Math.max(0, (layout.width - logoCropPreviewSize) / 2);
  const maxY = Math.max(0, (layout.height - logoCropPreviewSize) / 2);

  return {
    ...crop,
    zoom: Math.max(1, Math.min(3, crop.zoom)),
    offsetX: Math.max(-maxX, Math.min(maxX, crop.offsetX)),
    offsetY: Math.max(-maxY, Math.min(maxY, crop.offsetY))
  };
}

function clampBackgroundCrop(crop: LogoCropState): LogoCropState {
  const layout = getBackgroundCropLayout(crop);
  const maxX = Math.max(0, (layout.width - backgroundCropPreviewWidth) / 2);
  const maxY = Math.max(0, (layout.height - backgroundCropPreviewHeight) / 2);

  return {
    ...crop,
    zoom: Math.max(1, Math.min(3, crop.zoom)),
    offsetX: Math.max(-maxX, Math.min(maxX, crop.offsetX)),
    offsetY: Math.max(-maxY, Math.min(maxY, crop.offsetY))
  };
}

async function createCroppedLogoFile(crop: LogoCropState) {
  const image = await loadImage(crop.src);
  const layout = getLogoCropLayout(crop);
  const scale = logoCropOutputSize / logoCropPreviewSize;
  const canvas = document.createElement("canvas");
  canvas.width = logoCropOutputSize;
  canvas.height = logoCropOutputSize;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Logo crop could not be prepared.");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, layout.left * scale, layout.top * scale, layout.width * scale, layout.height * scale);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Logo crop could not be saved."))), "image/png");
  });

  return new File([blob], `${getFilenameStem(crop.fileName)}-site-logo.png`, { type: "image/png" });
}

async function createCroppedBackgroundFile(crop: LogoCropState) {
  const image = await loadImage(crop.src);
  const layout = getBackgroundCropLayout(crop);
  const scaleX = backgroundCropOutputWidth / backgroundCropPreviewWidth;
  const scaleY = backgroundCropOutputHeight / backgroundCropPreviewHeight;
  const canvas = document.createElement("canvas");
  canvas.width = backgroundCropOutputWidth;
  canvas.height = backgroundCropOutputHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Background crop could not be prepared.");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    layout.left * scaleX,
    layout.top * scaleY,
    layout.width * scaleX,
    layout.height * scaleY
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Background crop could not be saved."))),
      "image/jpeg",
      0.88
    );
  });

  return new File([blob], `${getFilenameStem(crop.fileName)}-theme-background.jpg`, { type: "image/jpeg" });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Logo crop could not be loaded."));
    image.src = src;
  });
}

function getFilenameStem(filename: string) {
  return filename.replace(/\.[^.]+$/, "") || "logo";
}

function labelize(value: string) {
  return value.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase());
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
