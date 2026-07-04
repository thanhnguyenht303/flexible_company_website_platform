"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type FooterPartnerFormPartner = {
  id: string;
  name: string;
  websiteUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  logoId: string;
};

type FooterPartnerFormProps = {
  partner?: FooterPartnerFormPartner;
};

type FormState = {
  status: "idle" | "saving" | "deleting" | "error";
  message: string;
};

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

const cropPreviewWidth = 360;
const cropPreviewHeight = 240;
const cropOutputWidth = 720;
const cropOutputHeight = 480;

export function FooterPartnerForm({ partner }: FooterPartnerFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const isEditing = Boolean(partner);
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });
  const [logoCrop, setLogoCrop] = useState<LogoCropState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    return () => {
      if (logoCrop?.src) URL.revokeObjectURL(logoCrop.src);
    };
  }, [logoCrop?.src]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "saving", message: t("admin.messages.collaboratorSaving") });

    const payload = new FormData(event.currentTarget);

    if (!isEditing && !logoCrop) {
      setState({ status: "error", message: t("admin.messages.collaboratorUploadLogo") });
      return;
    }

    if (logoCrop) {
      setState({ status: "saving", message: t("admin.messages.preparingLogo") });
      try {
        payload.set("logo", await createCroppedLogoFile(logoCrop));
      } catch {
        setState({ status: "error", message: t("admin.messages.logoCropFailed") });
        return;
      }
    }

    const response = await fetch(isEditing ? `/api/admin/footer/${partner?.id}` : "/api/admin/footer", {
      method: isEditing ? "PATCH" : "POST",
      body: payload
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.collaboratorSaveFailed")
      });
      return;
    }

    router.push("/admin/footer");
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
      setState({ status: "error", message: t("admin.messages.logoPreviewFailed") });
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
    const nextOffsetX = drag.originX + event.clientX - drag.startX;
    const nextOffsetY = drag.originY + event.clientY - drag.startY;
    setLogoCrop((current) => (current ? clampCrop({ ...current, offsetX: nextOffsetX, offsetY: nextOffsetY }) : null));
  }

  function onCropPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (drag?.pointerId === event.pointerId) setDrag(null);
  }

  function onZoomChange(event: React.ChangeEvent<HTMLInputElement>) {
    const zoom = Number(event.target.value);
    setLogoCrop((current) => (current ? clampCrop({ ...current, zoom }) : null));
  }

  async function onDelete() {
    if (!partner) return;
    const confirmed = window.confirm(t("admin.confirm.deleteFooter", { title: partner.name }));
    if (!confirmed) return;

    setState({ status: "deleting", message: "" });
    const response = await fetch(`/api/admin/footer/${partner.id}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? t("admin.messages.collaboratorDeleteFailed")
      });
      return;
    }

    router.push("/admin/footer");
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">{t("admin.forms.labels.companyName")}</label>
        <input id="name" name="name" required minLength={2} maxLength={180} defaultValue={partner?.name ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="websiteUrl">{t("admin.forms.labels.websiteUrl")}</label>
        <input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          placeholder={t("admin.forms.placeholders.websiteUrl")}
          defaultValue={partner?.websiteUrl ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="sortOrder">{t("admin.common.sortOrder")}</label>
        <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={partner?.sortOrder ?? 0} />
      </div>
      <div className="field">
        <label htmlFor="isVisible">{t("admin.forms.labels.visibility")}</label>
        <select id="isVisible" name="isVisible" defaultValue={String(partner?.isVisible ?? true)}>
          <option value="true">{t("admin.common.visible")}</option>
          <option value="false">{t("admin.common.hidden")}</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="logo">{t("admin.forms.labels.companyLogo")}</label>
        {partner?.logoId ? (
          <div className="footer-logo-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${partner.logoId}`} alt="" />
          </div>
        ) : null}
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={!isEditing}
          onChange={onLogoChange}
        />
        <p className="field-help">
          {t("admin.forms.help.footerLogo")}
        </p>
        {logoCrop ? (
          <div className="footer-logo-crop-workspace">
            <div
              className="footer-logo-cropper"
              role="application"
              aria-label={t("admin.settings.dragLogoCrop")}
              onPointerDown={onCropPointerDown}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerEnd}
              onPointerCancel={onCropPointerEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoCrop.src} alt="" style={getCropImageStyle(logoCrop)} draggable={false} />
            </div>
            <div className="field footer-logo-zoom">
              <label htmlFor="logoZoom">{t("admin.common.zoom")}</label>
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
      <div className="form-actions">
        <button className="button" type="submit" disabled={state.status === "saving"}>
          <Save size={18} />
          {state.status === "saving" ? t("admin.common.saving") : t("admin.forms.buttons.saveCollaborator")}
        </button>
        {partner ? (
          <button
            className="button danger"
            type="button"
            disabled={state.status === "deleting"}
            onClick={onDelete}
          >
            <Trash2 size={18} />
            {state.status === "deleting" ? t("admin.common.deleting") : t("admin.common.delete")}
          </button>
        ) : null}
      </div>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function getCropImageStyle(crop: LogoCropState): React.CSSProperties {
  const layout = getCropLayout(crop);

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

function getCropLayout(crop: LogoCropState) {
  const baseScale = Math.max(cropPreviewWidth / crop.naturalWidth, cropPreviewHeight / crop.naturalHeight);
  const scale = baseScale * crop.zoom;
  const width = crop.naturalWidth * scale;
  const height = crop.naturalHeight * scale;

  return {
    scale,
    width,
    height,
    left: (cropPreviewWidth - width) / 2 + crop.offsetX,
    top: (cropPreviewHeight - height) / 2 + crop.offsetY
  };
}

function clampCrop(crop: LogoCropState): LogoCropState {
  const layout = getCropLayout(crop);
  const maxX = Math.max(0, (layout.width - cropPreviewWidth) / 2);
  const maxY = Math.max(0, (layout.height - cropPreviewHeight) / 2);

  return {
    ...crop,
    zoom: Math.max(1, Math.min(3, crop.zoom)),
    offsetX: Math.max(-maxX, Math.min(maxX, crop.offsetX)),
    offsetY: Math.max(-maxY, Math.min(maxY, crop.offsetY))
  };
}

async function createCroppedLogoFile(crop: LogoCropState) {
  const image = await loadImage(crop.src);
  const layout = getCropLayout(crop);
  const scaleX = cropOutputWidth / cropPreviewWidth;
  const scaleY = cropOutputHeight / cropPreviewHeight;
  const canvas = document.createElement("canvas");
  canvas.width = cropOutputWidth;
  canvas.height = cropOutputHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Logo crop could not be prepared.");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    layout.left * scaleX,
    layout.top * scaleY,
    layout.width * scaleX,
    layout.height * scaleY
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Logo crop could not be saved."))), "image/png");
  });

  return new File([blob], `${getFilenameStem(crop.fileName)}-cropped.png`, { type: "image/png" });
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
