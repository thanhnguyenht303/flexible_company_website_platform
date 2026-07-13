"use client";

import { useEffect, type ReactNode } from "react";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2
} from "lucide-react";
import { ArticleImageExtension } from "@/components/admin/article-editor/ArticleImageExtension";
import {
  createEmptyArticleDocument,
  normalizeArticleDocument,
  type ArticleDocument
} from "@/modules/blog/article-document";

type RichArticleEditorProps = {
  document: ArticleDocument | null;
  onChange: (document: ArticleDocument) => void;
  onRequestImage: (insertAfter: number) => void;
  placeholder?: string;
  uploadingImage?: boolean;
};

export function RichArticleEditor({
  document,
  onChange,
  onRequestImage,
  placeholder = "Tell your story…",
  uploadingImage = false
}: RichArticleEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    content: document ?? createEmptyArticleDocument(),
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https"
        }
      }),
      Placeholder.configure({ placeholder, showOnlyCurrent: true }),
      CharacterCount,
      ArticleImageExtension
    ],
    editorProps: {
      attributes: {
        class: "medium-editor-content",
        "aria-label": "Article body"
      }
    },
    onUpdate: ({ editor: nextEditor }) => {
      const normalized = normalizeArticleDocument(nextEditor.getJSON());
      if (normalized) onChange(normalized);
    }
  });

  useEffect(() => {
    if (!editor || !document) return;
    const currentDocument = normalizeArticleDocument(editor.getJSON());
    if (JSON.stringify(currentDocument) === JSON.stringify(document)) return;
    editor.commands.setContent(document, { emitUpdate: false });
  }, [document, editor]);

  if (!editor) {
    return <div className="medium-editor-loading" aria-live="polite">Preparing editor…</div>;
  }
  const activeEditor = editor;

  function editLink() {
    const previousUrl = activeEditor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Paste or enter a link", previousUrl ?? "https://");
    if (nextUrl === null) return;
    if (!nextUrl.trim()) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: nextUrl.trim() }).run();
  }

  const selectedImage = editor.isActive("articleImage");
  const imageAttributes = selectedImage ? editor.getAttributes("articleImage") : null;

  return (
    <div className="medium-editor">
      <div className="medium-editor-history" aria-label="Writing history controls">
        <EditorButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 size={18} />
        </EditorButton>
        <EditorButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 size={18} />
        </EditorButton>
      </div>

      <div className="medium-insert-toolbar" role="toolbar" aria-label="Insert and format article blocks">
        <span className="medium-insert-toolbar__label">Insert</span>
        <EditorButton
          label="Image"
          showLabel
          onClick={() => onRequestImage(editor.state.selection.$from.index(0))}
          disabled={uploadingImage}
        >
          <ImagePlus size={18} />
        </EditorButton>
        <EditorButton label="Heading" showLabel active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={18} />
        </EditorButton>
        <EditorButton label="Subheading" showLabel active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={18} />
        </EditorButton>
        <EditorButton label="Quote" showLabel active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={18} />
        </EditorButton>
        <EditorButton label="Bullets" showLabel active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={18} />
        </EditorButton>
        <EditorButton label="Numbers" showLabel active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={18} />
        </EditorButton>
        <EditorButton label="Divider" showLabel onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={18} />
        </EditorButton>
        <EditorButton label="Code" showLabel active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={18} />
        </EditorButton>
      </div>

      <BubbleMenu editor={editor} className="medium-bubble-menu">
        <EditorButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={17} />
        </EditorButton>
        <EditorButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={17} />
        </EditorButton>
        <EditorButton label="Link" active={editor.isActive("link")} onClick={editLink}>
          <Link2 size={17} />
        </EditorButton>
        <span className="medium-menu-divider" aria-hidden="true" />
        <EditorButton label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={17} />
        </EditorButton>
        <EditorButton label="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={17} />
        </EditorButton>
        <EditorButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={17} />
        </EditorButton>
      </BubbleMenu>

      <EditorContent editor={editor} />

      {selectedImage && imageAttributes ? (
        <div className="medium-image-inspector" aria-label="Selected image settings">
          <div className="field">
            <label htmlFor="selected-image-alt">Alt text</label>
            <input
              id="selected-image-alt"
              value={typeof imageAttributes.alt === "string" ? imageAttributes.alt : ""}
              onChange={(event) => editor.commands.updateAttributes("articleImage", { alt: event.target.value })}
              maxLength={300}
            />
          </div>
          <div className="field">
            <label htmlFor="selected-image-caption">Caption</label>
            <input
              id="selected-image-caption"
              value={typeof imageAttributes.caption === "string" ? imageAttributes.caption : ""}
              onChange={(event) => editor.commands.updateAttributes("articleImage", { caption: event.target.value })}
              maxLength={500}
            />
          </div>
          <button className="button danger compact" type="button" onClick={() => editor.chain().focus().deleteSelection().run()}>
            Remove image
          </button>
        </div>
      ) : null}

      <div className="medium-editor-footer">
        <span>{editor.storage.characterCount.words()} words</span>
        <span>Use Ctrl/Cmd + B, I, or K to format quickly</span>
      </div>
    </div>
  );
}

function EditorButton({
  label,
  active = false,
  disabled = false,
  showLabel = false,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active || undefined}
      className={active ? "is-active" : ""}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
