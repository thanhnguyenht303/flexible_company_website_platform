"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Check,
  ChevronLeft,
  Clock3,
  Eye,
  FileClock,
  Globe2,
  ImagePlus,
  LoaderCircle,
  MoreHorizontal,
  Save,
  Send,
  Settings2,
  Trash2,
  X
} from "lucide-react";
import { RichArticleEditor } from "@/components/admin/article-editor/RichArticleEditor";
import { useLanguage } from "@/components/public/LanguageProvider";
import { ArticleContent } from "@/components/shared/ArticleContent";
import {
  articleDocumentToText,
  getArticleReadingTime,
  getArticleWordCount,
  legacyArticleToDocument,
  normalizeArticleDocument,
  type ArticleDocument
} from "@/modules/blog/article-document";

type PublishStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNLISTED" | "ARCHIVED";
type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "offline";

type PostFormPost = {
  id: string;
  title: string;
  titleVi: string | null;
  slug: string;
  excerpt: string | null;
  excerptVi: string | null;
  content: string;
  contentVi: string | null;
  contentJson: unknown;
  contentJsonVi: unknown;
  status: PublishStatus;
  tagNames: string[];
  featuredImageId: string | null;
  featuredImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  scheduledAt: string | null;
  revisionNumber: number;
};

type PostFormProps = { post?: PostFormPost };
type EditorLocale = "en" | "vi";
type PendingImage = {
  file: File;
  kind: "inline" | "featured";
  locale: EditorLocale;
  insertAfter?: number;
};

type SavedPost = {
  id: string;
  slug: string;
  status: PublishStatus;
  revisionNumber: number;
  featuredImageId?: string | null;
};

const maxUploadWidth = 2000;
const maxUploadHeight = 1400;
const imageQuality = 0.84;

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const ui = useCallback((english: string, vietnamese: string) => language === "vi" ? vietnamese : english, [language]);

  const [postId, setPostId] = useState(post?.id ?? null);
  const [revisionNumber, setRevisionNumber] = useState(post?.revisionNumber ?? 0);
  const [status, setStatus] = useState<PublishStatus>(post?.status ?? "DRAFT");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeLocale, setActiveLocale] = useState<EditorLocale>("en");

  const [title, setTitle] = useState(post?.title ?? "");
  const [titleVi, setTitleVi] = useState(post?.titleVi ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [excerptVi, setExcerptVi] = useState(post?.excerptVi ?? "");
  const [englishDocument, setEnglishDocument] = useState<ArticleDocument>(() =>
    normalizeArticleDocument(post?.contentJson) ?? legacyArticleToDocument(post?.content ?? "")
  );
  const [vietnameseDocument, setVietnameseDocument] = useState<ArticleDocument>(() =>
    normalizeArticleDocument(post?.contentJsonVi) ?? legacyArticleToDocument(post?.contentVi ?? "")
  );

  const [slug, setSlug] = useState(post?.slug ?? "");
  const [tags, setTags] = useState<string[]>(post?.tagNames ?? []);
  const [tagInput, setTagInput] = useState("");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [featuredImageId, setFeaturedImageId] = useState(post?.featuredImageId ?? null);
  const [featuredImageAlt, setFeaturedImageAlt] = useState(post?.featuredImageAlt ?? post?.title ?? "");
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTime(post?.scheduledAt));
  const [publishMode, setPublishMode] = useState<"PUBLISHED" | "UNLISTED" | "SCHEDULED">(
    post?.status === "UNLISTED" || post?.status === "SCHEDULED" ? post.status : "PUBLISHED"
  );

  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [revisions, setRevisions] = useState<Array<{
    id: string;
    locale: string;
    revisionNumber: number;
    title: string;
    createdAt: string;
    createdBy?: { displayName: string | null; username: string } | null;
  }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const inlineImageInsertAfterRef = useRef<number | undefined>(undefined);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const subtitleInputRef = useRef<HTMLTextAreaElement | null>(null);

  const postIdRef = useRef(postId);
  const revisionRef = useRef(revisionNumber);
  const currentSignatureRef = useRef("");
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => { postIdRef.current = postId; }, [postId]);
  useEffect(() => { revisionRef.current = revisionNumber; }, [revisionNumber]);
  const resizeStoryField = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resizeStoryField(titleInputRef.current);
    resizeStoryField(subtitleInputRef.current);
  }, [activeLocale, excerpt, excerptVi, resizeStoryField, title, titleVi]);

  const draftPayload = useMemo(() => ({
    title,
    titleVi,
    excerpt,
    excerptVi,
    content: articleDocumentToText(englishDocument),
    contentVi: articleDocumentToText(vietnameseDocument),
    contentJson: englishDocument,
    contentJsonVi: vietnameseDocument,
    slug,
    tagNames: tags,
    featuredImageAlt,
    seoTitle,
    seoDescription,
    canonicalUrl
  }), [
    canonicalUrl,
    englishDocument,
    excerpt,
    excerptVi,
    featuredImageAlt,
    seoDescription,
    seoTitle,
    slug,
    tags,
    title,
    titleVi,
    vietnameseDocument
  ]);

  const currentSignature = useMemo(() => JSON.stringify(draftPayload), [draftPayload]);
  const lastSavedSignatureRef = useRef(currentSignature);
  currentSignatureRef.current = currentSignature;

  const persistArticle = useCallback((
    overrides: Record<string, unknown> = {},
    signatureAtRequest = currentSignature,
    force = false
  ): Promise<SavedPost | null> => {
    if (!force && signatureAtRequest === lastSavedSignatureRef.current) return Promise.resolve(null);
    setSaveStatus(navigator.onLine ? "saving" : "offline");
    setMessage("");

    const task = saveQueueRef.current.then(async () => {
      if (!navigator.onLine) {
        setSaveStatus("offline");
        return null;
      }

      const currentPostId = postIdRef.current;
      const response = await fetch(currentPostId ? `/api/admin/posts/${currentPostId}` : "/api/admin/posts", {
        method: currentPostId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draftPayload,
          ...overrides,
          ...(currentPostId ? { revisionNumber: revisionRef.current } : { status: overrides.status ?? "DRAFT" })
        })
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const errors = body?.error?.fields ?? {};
        setFieldErrors(errors);
        setMessage(body?.error?.message ?? ui("The article could not be saved.", "Không thể lưu bài viết."));
        setSaveStatus(response.status === 409 ? "error" : navigator.onLine ? "error" : "offline");
        return null;
      }

      const saved = body.data as SavedPost;
      if (!currentPostId) {
        postIdRef.current = saved.id;
        setPostId(saved.id);
        window.history.replaceState(null, "", `/admin/posts/${saved.id}/edit`);
      }
      revisionRef.current = saved.revisionNumber;
      setRevisionNumber(saved.revisionNumber);
      setStatus(saved.status);
      if (saved.slug) setSlug(saved.slug);
      lastSavedSignatureRef.current = signatureAtRequest;
      setFieldErrors({});
      setSaveStatus(currentSignatureRef.current === signatureAtRequest ? "saved" : "dirty");
      return saved;
    });

    saveQueueRef.current = task.catch(() => undefined);
    return task.catch(() => {
      setSaveStatus(navigator.onLine ? "error" : "offline");
      setMessage(ui("The article could not be saved.", "Không thể lưu bài viết."));
      return null;
    });
  }, [currentSignature, draftPayload, ui]);

  useEffect(() => {
    if (saveStatus === "saving") return;
    if (currentSignature === lastSavedSignatureRef.current) return;
    setSaveStatus(navigator.onLine ? "dirty" : "offline");
    const timer = window.setTimeout(() => void persistArticle({}, currentSignature), 1000);
    return () => window.clearTimeout(timer);
  }, [currentSignature, persistArticle, saveStatus]);

  useEffect(() => {
    const onOnline = () => {
      if (currentSignatureRef.current !== lastSavedSignatureRef.current) {
        setSaveStatus("dirty");
        void persistArticle({}, currentSignatureRef.current, true);
      }
    };
    const onOffline = () => setSaveStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [persistArticle]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentSignatureRef.current === lastSavedSignatureRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pendingImage) {
        if (!uploadingImage) setPendingImage(null);
      } else if (publishOpen) setPublishOpen(false);
      else if (previewOpen) setPreviewOpen(false);
      else if (historyOpen) setHistoryOpen(false);
      else setMoreOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [historyOpen, pendingImage, previewOpen, publishOpen, uploadingImage]);

  async function publishArticle() {
    const publishDate = publishMode === "SCHEDULED" && scheduledAt
      ? new Date(scheduledAt).toISOString()
      : null;
    const saved = await persistArticle({
      status: publishMode,
      scheduledAt: publishDate,
      createRevision: true
    }, currentSignature, true);
    if (!saved) return;
    setPublishOpen(false);
    setMessage(
      publishMode === "SCHEDULED"
        ? ui("Article scheduled.", "Bài viết đã được lên lịch.")
        : ui("Article published.", "Bài viết đã được xuất bản.")
    );
    router.replace(`/admin/posts/${saved.id}/edit`, { scroll: false });
  }

  async function archiveArticle() {
    const saved = await persistArticle({ status: "ARCHIVED", createRevision: true }, currentSignature, true);
    if (saved) {
      setMoreOpen(false);
      setMessage(ui("Article archived.", "Bài viết đã được lưu trữ."));
      router.replace(`/admin/posts/${saved.id}/edit`, { scroll: false });
    }
  }

  async function saveVersion() {
    const saved = await persistArticle({ createRevision: true }, currentSignature, true);
    if (!saved) return;
    setMoreOpen(false);
    setMessage(ui("Version saved.", "Phiên bản đã được lưu."));
  }

  async function deleteArticle() {
    const currentPostId = postIdRef.current;
    if (!currentPostId) {
      router.push("/admin/posts");
      return;
    }
    if (!window.confirm(ui(`Delete “${title || "Untitled story"}”? This cannot be undone.`, `Xóa “${title || "Bài viết chưa có tiêu đề"}”? Không thể hoàn tác.`))) return;
    const response = await fetch(`/api/admin/posts/${currentPostId}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage(ui("The article could not be deleted.", "Không thể xóa bài viết."));
      return;
    }
    router.push("/admin/posts");
    router.refresh();
  }

  function chooseImage(kind: "inline" | "featured", insertAfter?: number) {
    if (kind === "inline") {
      inlineImageInsertAfterRef.current = insertAfter;
      inlineImageInputRef.current?.click();
    } else {
      featuredImageInputRef.current?.click();
    }
  }

  function onImageSelected(event: React.ChangeEvent<HTMLInputElement>, kind: "inline" | "featured") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageAlt(getImageAltText(file.name));
    setImageCaption("");
    setPendingImage({
      file,
      kind,
      locale: activeLocale,
      ...(kind === "inline" && Number.isInteger(inlineImageInsertAfterRef.current)
        ? { insertAfter: inlineImageInsertAfterRef.current }
        : {})
    });
  }

  async function uploadSelectedImage() {
    if (!pendingImage || !imageAlt.trim()) return;
    const selectedImage = pendingImage;
    setUploadingImage(true);
    setMessage("");

    try {
      const saved = await persistArticle({}, currentSignatureRef.current, true);
      if (!saved) return;

      const optimized = await optimizeImageForUpload(selectedImage.file).catch(() => selectedImage.file);
      const payload = new FormData();
      payload.set("image", optimized);
      payload.set("kind", selectedImage.kind);
      payload.set("alt", imageAlt.trim());
      payload.set("revisionNumber", String(saved.revisionNumber));
      if (selectedImage.kind === "inline") {
        payload.set("caption", imageCaption.trim());
        payload.set("locale", selectedImage.locale);
        if (Number.isInteger(selectedImage.insertAfter)) {
          payload.set("insertAfter", String(selectedImage.insertAfter));
        }
      }

      const response = await fetch(`/api/admin/posts/${saved.id}/images`, { method: "POST", body: payload });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(body?.error?.message ?? ui("The image could not be uploaded.", "Không thể tải hình ảnh lên."));
        return;
      }

      if (selectedImage.kind === "featured") {
        setFeaturedImageId(body.data.id);
        setFeaturedImageAlt(body.data.alt);
      } else {
        const document = normalizeArticleDocument(body?.data?.document);
        if (!document || typeof body?.data?.revisionNumber !== "number") {
          setMessage(ui(
            "The image was saved, but the editor could not load the updated article. Reload the editor before continuing.",
            "Hình đã được lưu nhưng trình soạn thảo không thể tải bài viết đã cập nhật. Hãy tải lại trình soạn thảo trước khi tiếp tục."
          ));
          setSaveStatus("error");
          setPendingImage(null);
          return;
        }

        const locale = body.data.locale === "vi" ? "vi" : "en";
        const nextPayload = locale === "en"
          ? { ...draftPayload, content: articleDocumentToText(document), contentJson: document }
          : { ...draftPayload, contentVi: articleDocumentToText(document), contentJsonVi: document };
        const nextSignature = JSON.stringify(nextPayload);

        revisionRef.current = body.data.revisionNumber;
        setRevisionNumber(body.data.revisionNumber);
        if (locale === "en") setEnglishDocument(document);
        else setVietnameseDocument(document);
        lastSavedSignatureRef.current = nextSignature;
        currentSignatureRef.current = nextSignature;
        setSaveStatus("saved");
        setMessage(ui("Image added and saved.", "Hình ảnh đã được thêm và lưu."));
      }
      setPendingImage(null);
    } catch {
      setMessage(ui("The image could not be uploaded. Please try again.", "Không thể tải hình ảnh lên. Vui lòng thử lại."));
    } finally {
      setUploadingImage(false);
    }
  }

  async function openHistory() {
    const currentPostId = postIdRef.current;
    if (!currentPostId) return;
    setMoreOpen(false);
    setHistoryOpen(true);
    setHistoryLoading(true);
    const response = await fetch(`/api/admin/posts/${currentPostId}/revisions`);
    const body = await response.json().catch(() => null);
    setHistoryLoading(false);
    if (response.ok) setRevisions(body.data);
  }

  async function restoreRevision(revisionId: string) {
    const currentPostId = postIdRef.current;
    if (!currentPostId || !window.confirm(ui("Restore this version? Your current version will remain in history.", "Khôi phục phiên bản này? Phiên bản hiện tại vẫn được giữ trong lịch sử."))) return;
    const response = await fetch(`/api/admin/posts/${currentPostId}/revisions/${revisionId}`, { method: "POST" });
    if (!response.ok) {
      setMessage(ui("The revision could not be restored.", "Không thể khôi phục phiên bản."));
      return;
    }
    window.location.reload();
  }

  function addTag() {
    const value = tagInput.trim();
    if (!value || tags.includes(value) || tags.length >= 5) return;
    setTags((current) => [...current, value]);
    setTagInput("");
  }

  const activeTitle = activeLocale === "en" ? title : titleVi;
  const activeExcerpt = activeLocale === "en" ? excerpt : excerptVi;
  const activeDocument = activeLocale === "en" ? englishDocument : vietnameseDocument;
  const wordCount = getArticleWordCount(activeDocument);
  const readingTime = getArticleReadingTime(activeDocument);

  return (
    <div className="medium-post-editor-shell">
      <header className="medium-editor-topbar">
        <a className="medium-editor-back" href="/admin/posts">
          <ChevronLeft size={19} />
          <span>{ui("Stories", "Bài viết")}</span>
        </a>
        <div className="medium-editor-document-state" aria-live="polite">
          <span className={`medium-status-dot is-${saveStatus}`} aria-hidden="true" />
          <span>{getSaveLabel(saveStatus, ui)}</span>
          <span className="medium-document-status">{getStatusLabel(status, ui)}</span>
        </div>
        <div className="medium-editor-topbar-actions">
          <button className="medium-text-button" type="button" onClick={() => { setMoreOpen(false); setPreviewOpen(true); }}>
            <Eye size={18} /> {ui("Preview", "Xem trước")}
          </button>
          <button className="medium-publish-button" type="button" onClick={() => { setMoreOpen(false); setPublishOpen(true); }}>
            <Send size={17} />
            {status === "PUBLISHED" || status === "UNLISTED" ? ui("Publish changes", "Xuất bản thay đổi") : ui("Publish", "Xuất bản")}
          </button>
          <div className="medium-more-menu-wrap">
            <button className="medium-icon-button" aria-label={ui("More article actions", "Thêm thao tác")} type="button" onClick={() => setMoreOpen((open) => !open)}>
              <MoreHorizontal size={20} />
            </button>
            {moreOpen ? (
              <div className="medium-more-menu">
                <button type="button" onClick={() => void saveVersion()}>
                  <Save size={17} /> {ui("Save version", "Lưu phiên bản")}
                </button>
                <button type="button" disabled={!postId} onClick={() => void openHistory()}>
                  <FileClock size={17} /> {ui("Revision history", "Lịch sử phiên bản")}
                </button>
                <button type="button" disabled={!postId} onClick={() => void archiveArticle()}>
                  <Archive size={17} /> {ui("Archive story", "Lưu trữ bài viết")}
                </button>
                <button className="danger" type="button" onClick={() => void deleteArticle()}>
                  <Trash2 size={17} /> {ui("Delete story", "Xóa bài viết")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="medium-locale-tabs" role="tablist" aria-label={ui("Article language", "Ngôn ngữ bài viết")}>
        <button className={activeLocale === "en" ? "is-active" : ""} role="tab" aria-selected={activeLocale === "en"} type="button" onClick={() => setActiveLocale("en")}>
          English
        </button>
        <button className={activeLocale === "vi" ? "is-active" : ""} role="tab" aria-selected={activeLocale === "vi"} type="button" onClick={() => setActiveLocale("vi")}>
          Tiếng Việt
          {titleVi.trim() || articleDocumentToText(vietnameseDocument) ? <Check size={15} /> : null}
        </button>
      </div>

      <main className="medium-writing-canvas">
        <label className="visually-hidden" htmlFor="medium-story-title">{ui("Story title", "Tiêu đề bài viết")}</label>
        <textarea
          ref={titleInputRef}
          id="medium-story-title"
          className="medium-story-title"
          rows={1}
          maxLength={180}
          placeholder={activeLocale === "en" ? "Title" : "Tiêu đề"}
          value={activeTitle}
          onChange={(event) => activeLocale === "en" ? setTitle(event.target.value) : setTitleVi(event.target.value)}
          onInput={(event) => resizeStoryField(event.currentTarget)}
        />
        {fieldErrors.title && activeLocale === "en" ? <p className="medium-field-error">{fieldErrors.title}</p> : null}

        <label className="visually-hidden" htmlFor="medium-story-subtitle">{ui("Story subtitle", "Phụ đề bài viết")}</label>
        <textarea
          ref={subtitleInputRef}
          id="medium-story-subtitle"
          className="medium-story-subtitle"
          rows={2}
          maxLength={320}
          placeholder={activeLocale === "en" ? "Tell readers what this story is about" : "Cho độc giả biết câu chuyện này nói về điều gì"}
          value={activeExcerpt}
          onChange={(event) => activeLocale === "en" ? setExcerpt(event.target.value) : setExcerptVi(event.target.value)}
          onInput={(event) => resizeStoryField(event.currentTarget)}
        />

        <RichArticleEditor
          key={activeLocale}
          document={activeDocument}
          onChange={activeLocale === "en" ? setEnglishDocument : setVietnameseDocument}
          onRequestImage={(insertAfter) => chooseImage("inline", insertAfter)}
          placeholder={activeLocale === "en" ? "Tell your story…" : "Viết câu chuyện của bạn…"}
          uploadingImage={uploadingImage}
        />
        {fieldErrors.contentJson && activeLocale === "en" ? <p className="medium-field-error">{fieldErrors.contentJson}</p> : null}

        <div className="medium-writing-stats">
          <span>{wordCount} {ui("words", "từ")}</span>
          <span>{readingTime} {ui("min read", "phút đọc")}</span>
        </div>
        {message ? <p className={`medium-editor-message ${saveStatus === "error" ? "error" : ""}`} aria-live="polite">{message}</p> : null}
      </main>

      <input ref={inlineImageInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageSelected(event, "inline")} />
      <input ref={featuredImageInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageSelected(event, "featured")} />

      {publishOpen ? (
        <div className="medium-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPublishOpen(false); }}>
          <section className="medium-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title">
            <header>
              <div>
                <span className="medium-dialog-eyebrow">{ui("Ready to share?", "Sẵn sàng chia sẻ?")}</span>
                <h2 id="publish-dialog-title">{ui("Publish your story", "Xuất bản bài viết")}</h2>
              </div>
              <button className="medium-icon-button" aria-label={ui("Close publish dialog", "Đóng hộp thoại xuất bản")} type="button" onClick={() => setPublishOpen(false)}><X size={20} /></button>
            </header>

            <div className="medium-publish-grid">
              <div className="medium-publish-preview">
                <span>{ui("Story preview", "Xem trước bài viết")}</span>
                <button className="medium-cover-picker" type="button" onClick={() => chooseImage("featured")}>
                  {featuredImageId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/media/${featuredImageId}`} alt={featuredImageAlt} />
                  ) : (
                    <><ImagePlus size={26} /><strong>{ui("Add a preview image", "Thêm ảnh xem trước")}</strong></>
                  )}
                </button>
                <strong className="medium-preview-title">{title || ui("Untitled story", "Bài viết chưa có tiêu đề")}</strong>
                <p>{excerpt || ui("Add a subtitle to help readers understand your story.", "Thêm phụ đề để độc giả hiểu bài viết của bạn.")}</p>
                <small>{readingTime} {ui("min read", "phút đọc")}</small>
              </div>

              <div className="medium-publish-settings">
                <div className="field">
                  <label htmlFor="featured-image-alt">{ui("Featured image alt text", "Văn bản thay thế cho ảnh bìa")}</label>
                  <input id="featured-image-alt" value={featuredImageAlt} maxLength={300} onChange={(event) => setFeaturedImageAlt(event.target.value)} />
                  {fieldErrors.featuredImageAlt ? <p className="medium-field-error">{fieldErrors.featuredImageAlt}</p> : null}
                </div>
                <div className="field">
                  <label htmlFor="story-topics">{ui("Topics", "Chủ đề")} <span>{tags.length}/5</span></label>
                  <div className="medium-tag-editor">
                    {tags.map((tag) => <button type="button" key={tag} onClick={() => setTags((current) => current.filter((item) => item !== tag))}>{tag}<X size={14} /></button>)}
                    {tags.length < 5 ? (
                      <input
                        id="story-topics"
                        value={tagInput}
                        placeholder={ui("Add a topic", "Thêm chủ đề")}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); }
                        }}
                        onBlur={addTag}
                      />
                    ) : null}
                  </div>
                </div>

                <fieldset className="medium-publish-options">
                  <legend>{ui("Visibility and timing", "Hiển thị và thời gian")}</legend>
                  <label><input type="radio" name="publishMode" checked={publishMode === "PUBLISHED"} onChange={() => setPublishMode("PUBLISHED")} /><Globe2 size={18} /><span><strong>{ui("Publish now", "Xuất bản ngay")}</strong><small>{ui("Visible on your blog and in listings", "Hiển thị trên blog và danh sách")}</small></span></label>
                  <label><input type="radio" name="publishMode" checked={publishMode === "UNLISTED"} onChange={() => setPublishMode("UNLISTED")} /><Eye size={18} /><span><strong>{ui("Unlisted", "Không liệt kê")}</strong><small>{ui("Anyone with the link can read it", "Bất kỳ ai có liên kết đều có thể đọc")}</small></span></label>
                  <label><input type="radio" name="publishMode" checked={publishMode === "SCHEDULED"} onChange={() => setPublishMode("SCHEDULED")} /><Clock3 size={18} /><span><strong>{ui("Schedule for later", "Lên lịch sau")}</strong><small>{ui("Choose a future date and time", "Chọn ngày và giờ trong tương lai")}</small></span></label>
                </fieldset>
                {publishMode === "SCHEDULED" ? (
                  <div className="field">
                    <label htmlFor="scheduled-at">{ui("Publication date and time", "Ngày giờ xuất bản")}</label>
                    <input id="scheduled-at" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                    {fieldErrors.scheduledAt ? <p className="medium-field-error">{fieldErrors.scheduledAt}</p> : null}
                  </div>
                ) : null}

                <details className="medium-advanced-settings">
                  <summary><Settings2 size={17} /> {ui("SEO and advanced settings", "SEO và cài đặt nâng cao")}</summary>
                  <div className="field"><label htmlFor="story-slug">URL slug</label><input id="story-slug" value={slug} maxLength={220} onChange={(event) => setSlug(event.target.value)} /></div>
                  <div className="field"><label htmlFor="seo-title">SEO title</label><input id="seo-title" value={seoTitle} maxLength={180} onChange={(event) => setSeoTitle(event.target.value)} /></div>
                  <div className="field"><label htmlFor="seo-description">SEO description</label><textarea id="seo-description" value={seoDescription} maxLength={320} onChange={(event) => setSeoDescription(event.target.value)} /></div>
                  <div className="field"><label htmlFor="canonical-url">Canonical URL</label><input id="canonical-url" type="url" value={canonicalUrl} placeholder="https://example.com/original-story" onChange={(event) => setCanonicalUrl(event.target.value)} /></div>
                </details>
              </div>
            </div>

            <footer>
              <button className="button secondary" type="button" onClick={() => setPublishOpen(false)}>{ui("Cancel", "Hủy")}</button>
              <button className="medium-publish-button large" type="button" disabled={saveStatus === "saving" || (publishMode === "SCHEDULED" && !scheduledAt)} onClick={() => void publishArticle()}>
                {saveStatus === "saving" ? <LoaderCircle className="spin" size={18} /> : publishMode === "SCHEDULED" ? <Clock3 size={18} /> : <Send size={18} />}
                {publishMode === "SCHEDULED" ? ui("Schedule", "Lên lịch") : ui("Publish", "Xuất bản")}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="medium-modal-backdrop preview" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
          <section className="medium-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <div className="medium-preview-toolbar">
              <span>{ui("Reader preview", "Xem trước cho độc giả")}</span>
              <button className="medium-icon-button" aria-label={ui("Close preview", "Đóng xem trước")} type="button" onClick={() => setPreviewOpen(false)}><X size={20} /></button>
            </div>
            <article className="article-page medium-reader-preview">
              <header className="article-header">
                <div className="article-kicker">{ui("Preview", "Xem trước")}</div>
                <h1 id="preview-title">{activeTitle || ui("Untitled story", "Bài viết chưa có tiêu đề")}</h1>
                {activeExcerpt ? <p className="article-deck">{activeExcerpt}</p> : null}
                <div className="article-meta"><span>{ui("Draft", "Bản nháp")}</span><span>{readingTime} {ui("min read", "phút đọc")}</span></div>
              </header>
              {featuredImageId ? (
                <figure className="article-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${featuredImageId}`} alt={featuredImageAlt} />
                </figure>
              ) : null}
              <div className="article-content-wrap"><ArticleContent document={activeDocument} /></div>
            </article>
          </section>
        </div>
      ) : null}

      {pendingImage ? (
        <div className="medium-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploadingImage) setPendingImage(null); }}>
          <section className="medium-image-dialog" role="dialog" aria-modal="true" aria-labelledby="image-dialog-title">
            <header><div><span className="medium-dialog-eyebrow">{pendingImage.kind === "featured" ? ui("Story preview", "Xem trước bài viết") : ui("Article image", "Hình trong bài")}</span><h2 id="image-dialog-title">{ui("Describe this image", "Mô tả hình ảnh")}</h2></div><button className="medium-icon-button" aria-label={ui("Close image dialog", "Đóng hộp thoại hình ảnh")} type="button" disabled={uploadingImage} onClick={() => setPendingImage(null)}><X size={20} /></button></header>
            <p>{pendingImage.file.name}</p>
            <div className="field"><label htmlFor="image-alt">{ui("Alt text", "Văn bản thay thế")}</label><textarea id="image-alt" autoFocus value={imageAlt} maxLength={300} onChange={(event) => setImageAlt(event.target.value)} /><small>{ui("Briefly describe what matters in the image for readers who cannot see it.", "Mô tả ngắn gọn nội dung quan trọng cho độc giả không thể xem hình.")}</small></div>
            {pendingImage.kind === "inline" ? <div className="field"><label htmlFor="image-caption">{ui("Caption (optional)", "Chú thích (tùy chọn)")}</label><input id="image-caption" value={imageCaption} maxLength={500} onChange={(event) => setImageCaption(event.target.value)} /></div> : null}
            <footer><button className="button secondary" type="button" disabled={uploadingImage} onClick={() => setPendingImage(null)}>{ui("Cancel", "Hủy")}</button><button className="button" type="button" disabled={!imageAlt.trim() || uploadingImage} onClick={() => void uploadSelectedImage()}>{uploadingImage ? <LoaderCircle className="spin" size={18} /> : <ImagePlus size={18} />}{uploadingImage ? ui("Uploading…", "Đang tải lên…") : ui("Add image", "Thêm hình")}</button></footer>
          </section>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="medium-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryOpen(false); }}>
          <section className="medium-history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title">
            <header><div><span className="medium-dialog-eyebrow">{ui("Saved versions", "Các phiên bản đã lưu")}</span><h2 id="history-dialog-title">{ui("Revision history", "Lịch sử phiên bản")}</h2></div><button className="medium-icon-button" aria-label={ui("Close history", "Đóng lịch sử")} type="button" onClick={() => setHistoryOpen(false)}><X size={20} /></button></header>
            {historyLoading ? <p><LoaderCircle className="spin" size={18} /> {ui("Loading history…", "Đang tải lịch sử…")}</p> : revisions.length ? <div className="medium-revision-list">{revisions.map((revision) => <article key={revision.id}><div><strong>{revision.title || ui("Untitled story", "Bài viết chưa có tiêu đề")}</strong><small>{revision.locale.toUpperCase()} · {new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.createdAt))} · {revision.createdBy?.displayName || revision.createdBy?.username || ui("Editor", "Biên tập viên")}</small></div><button className="button secondary compact" type="button" onClick={() => void restoreRevision(revision.id)}>{ui("Restore", "Khôi phục")}</button></article>)}</div> : <p>{ui("No saved versions yet. Publish or choose Save version to create one.", "Chưa có phiên bản nào. Hãy xuất bản hoặc chọn Lưu phiên bản.")}</p>}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function getSaveLabel(status: SaveStatus, ui: (english: string, vietnamese: string) => string) {
  if (status === "saving") return ui("Saving…", "Đang lưu…");
  if (status === "saved") return ui("Saved", "Đã lưu");
  if (status === "dirty") return ui("Unsaved changes", "Thay đổi chưa lưu");
  if (status === "offline") return ui("Offline — changes will retry", "Ngoại tuyến — sẽ thử lưu lại");
  if (status === "error") return ui("Save failed", "Lưu thất bại");
  return ui("Ready", "Sẵn sàng");
}

function getStatusLabel(status: PublishStatus, ui: (english: string, vietnamese: string) => string) {
  const labels = {
    DRAFT: ui("Draft", "Bản nháp"),
    SCHEDULED: ui("Scheduled", "Đã lên lịch"),
    PUBLISHED: ui("Published", "Đã xuất bản"),
    UNLISTED: ui("Unlisted", "Không liệt kê"),
    ARCHIVED: ui("Archived", "Đã lưu trữ")
  };
  return labels[status];
}

function getImageAltText(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "Article image";
}

function toLocalDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

async function optimizeImageForUpload(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const image = await loadImage(file);
  const scale = Math.min(maxUploadWidth / image.width, maxUploadHeight / image.height, 1);
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  if (scale === 1 && file.size <= 1_500_000) {
    URL.revokeObjectURL(image.src);
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  URL.revokeObjectURL(image.src);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", imageQuality));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "article-image"}.webp`, { type: "image/webp", lastModified: Date.now() });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { URL.revokeObjectURL(image.src); reject(new Error("Image could not be loaded.")); };
    image.src = URL.createObjectURL(file);
  });
}
