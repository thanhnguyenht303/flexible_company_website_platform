"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";

type SubmitState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

export function ServiceReviewForm({ serviceSlug }: { serviceSlug: string }) {
  const router = useRouter();
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
      const body = await response.json().catch(() => null);
      setState({
        status: "error",
        message: body?.error?.message ?? "Review could not be submitted."
      });
      return;
    }

    form.reset();
    setState({ status: "success", message: "Thank you. Your review has been submitted." });
    router.refresh();
  }

  return (
    <form className="admin-panel form-grid" onSubmit={onSubmit}>
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="review-website">Website</label>
        <input id="review-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="review-name">Name</label>
        <input id="review-name" name="name" required minLength={2} maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="review-email">Email</label>
        <input id="review-email" name="email" type="email" required maxLength={180} />
        <p className="field-help">Your email is required but will not be shown publicly.</p>
      </div>
      <div className="field">
        <label htmlFor="review-rating">Rating</label>
        <select id="review-rating" name="rating" defaultValue="5" required>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Very good</option>
          <option value="3">3 - Good</option>
          <option value="2">2 - Fair</option>
          <option value="1">1 - Poor</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="review-comment">Comment</label>
        <textarea id="review-comment" name="comment" required minLength={10} maxLength={2000} />
      </div>
      <button className="button" disabled={state.status === "submitting"} type="submit">
        <Send size={18} />
        {state.status === "submitting" ? "Posting" : "Post Review"}
      </button>
      {state.message ? (
        <p className={`message ${state.status === "error" ? "error" : ""}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
