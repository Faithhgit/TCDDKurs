"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { APP_VERSION } from "@/lib/appConfig";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("E-posta alanını boş bırakma.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await requestPasswordReset(email.trim());
    setLoading(false);

    if (resetError) {
      setError(resetError.message || "Şifre sıfırlama maili gönderilemedi.");
      return;
    }

    setSuccess("Şifre sıfırlama bağlantısı mail adresine gönderildi. Gelen kutunu kontrol et.");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_82%,white))] p-6 shadow-[var(--shadow-strong)] sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Şifre Sıfırlama</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
                Şifreni yenile
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-[15px]">
                Mail adresini yaz, sıfırlama bağlantısını gönderelim. Linke tıklayınca yeni şifreni belirleyebilirsin.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
              v{APP_VERSION}
            </span>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--surface)]/85 p-4 text-sm leading-6 text-[var(--foreground-muted)]">
            Küçük not: Mevcut şifren görünmez. Buradan sadece yeni şifre belirleme bağlantısı gönderilir.
          </div>
        </section>

        <section className="rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_76%,white))] p-5">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Mail gönder</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Sistemde kayıtlı mail adresini girmen yeterli.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">E-posta</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none transition focus:border-[var(--primary)]"
                  autoComplete="email"
                  placeholder="ornek@mail.com"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="min-h-12 w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)] disabled:opacity-70"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          </div>

          <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm leading-6 text-[var(--foreground-muted)]">
              Şifreni hatırladın mı?{" "}
              <Link href="/auth/login" className="font-semibold text-[var(--primary)]">
                Giriş ekranına dön
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
