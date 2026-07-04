"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/components/public/LanguageProvider";

type SubmitState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

export function ServiceReviewForm({ serviceSlug }: { serviceSlug: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "" });

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`/api/public/services/${serviceSlug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setState({
        status: "error",
        message: t("forms.review.error")
      });
      return;
    }

    form.reset();
    setState({ status: "success", message: t("forms.review.success") });
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="review-website">{t("common.website")}</label>
        <input id="review-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="review-name">{t("common.name")}</label>
        <input id="review-name" name="name" required minLength={2} maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="review-email">{t("common.email")}</label>
        <input id="review-email" name="email" type="email" required maxLength={180} />
        <p className="field-help">{t("forms.review.emailHelp")}</p>
      </div>
      <div className="field">
        <label htmlFor="review-rating">{t("forms.review.rating")}</label>
        <select id="review-rating" name="rating" defaultValue="5" required>
          <option value="5">{t("forms.review.options.excellent")}</option>
          <option value="4">{t("forms.review.options.veryGood")}</option>
          <option value="3">{t("forms.review.options.good")}</option>
          <option value="2">{t("forms.review.options.fair")}</option>
          <option value="1">{t("forms.review.options.poor")}</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="review-comment">{t("forms.review.comment")}</label>
        <textarea id="review-comment" name="comment" required minLength={10} maxLength={2000} />
      </div>
      <button className="button" disabled={state.status === "submitting"} type="submit">
        <Send size={18} />
        {state.status === "submitting" ? t("common.posting") : t("forms.review.postReview")}
      </button>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
