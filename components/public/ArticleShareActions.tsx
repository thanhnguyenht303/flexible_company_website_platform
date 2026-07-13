"use client";

import { useState } from "react";
import { Check, Link2, Linkedin, Share2 } from "lucide-react";
import type { Language } from "@/lib/i18n/translations";

export function ArticleShareActions({ title, url, language }: { title: string; url: string; language: Language }) {
  const [copied, setCopied] = useState(false);
  const isVietnamese = language === "vi";

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="article-share-actions" aria-label={isVietnamese ? "Chia sẻ bài viết" : "Share article"}>
      <button type="button" onClick={() => void share()} aria-label={isVietnamese ? "Chia sẻ" : "Share"} title={isVietnamese ? "Chia sẻ" : "Share"}><Share2 size={18} /></button>
      <button type="button" onClick={() => void copyLink()} aria-label={isVietnamese ? "Sao chép liên kết" : "Copy link"} title={isVietnamese ? "Sao chép liên kết" : "Copy link"}>{copied ? <Check size={18} /> : <Link2 size={18} />}</button>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label={isVietnamese ? "Chia sẻ trên LinkedIn" : "Share on LinkedIn"} title="LinkedIn"><Linkedin size={18} /></a>
      {copied ? <span role="status">{isVietnamese ? "Đã sao chép" : "Copied"}</span> : null}
    </div>
  );
}
