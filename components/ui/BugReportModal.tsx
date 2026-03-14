"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { authorizedFetch } from "@/lib/clientApi";

type BugReportModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function BugReportModal({ open, onClose }: BugReportModalProps) {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setMessage("");
    setFeedback("");
    setError("");
    setSaving(false);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFeedback("");

    if (!message.trim()) {
      setError("Lütfen hata açıklamasını yazın.");
      return;
    }

    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setSaving(false);
      setError("Önce giriş yapmanız gerekiyor.");
      return;
    }

    const response = await authorizedFetch("/api/bug-reports", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    setSaving(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error || "Hata bildirimi gönderilemedi.");
      return;
    }

    setFeedback("Hata bildirimin gönderildi.");
    setMessage("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(31,37,32,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Hata Bildir</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Yaşadığın sorunu kısa ve net şekilde yaz.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground)]"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Örnek: Soru çöz ekranında cevap verdikten sonra sayfa dondu."
            className="min-h-36 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
          />

          {error && (
            <div className="rounded-2xl bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          {feedback && (
            <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              {feedback}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Kapat
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-70"
            >
              {saving ? "Gönderiliyor..." : "Gönder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
