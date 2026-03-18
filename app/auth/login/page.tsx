"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import AdsenseBanner from "@/components/ui/AdsenseBanner";
import { APP_VERSION } from "@/lib/appConfig";
import { signInWithEmail } from "@/lib/auth";
import {
  markSessionActiveForCurrentVersion,
  triggerReleaseNotesForCurrentVersion,
} from "@/lib/clientSession";

const highlights = [
  {
    title: "Çözüm modları",
    description: "Klasik Mod, Doğru / Yanlış ve Quiz tek yerde duruyor.",
  },
  {
    title: "Ana ekran",
    description: "Duyurular, ders durumu ve sınıf bilgileri tek bakışta önünde.",
  },
  {
    title: "Hızlı geri bildirim",
    description: "Takılan yeri içeriden haber verip hızlıca düzelttirebilirsin.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("E-posta ve şifreyi boş bırakma.");
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      setError(error.message || "Girişte ufak bir terslik oldu.");
      return;
    }

    markSessionActiveForCurrentVersion();
    triggerReleaseNotesForCurrentVersion();
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <AdsenseBanner />

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_82%,white))] p-6 shadow-[var(--shadow-strong)] sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_68%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Giriş Alanı</p>
                <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
                  Kaldığın yerden devam et
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-[15px]">
                  Hesabına gir, çözüm modlarından istediğini seç ve direkt çalışmaya başla.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                v{APP_VERSION}
              </span>
            </div>

            <div className="mt-8 grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_86%,white),color-mix(in_srgb,var(--surface-muted)_72%,white))] px-4 py-4"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_76%,white))] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Hesabın</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Giriş yap</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Bilgilerini girmen yeterli. Geri kalanı sistem halleder.
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

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Şifre</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none transition focus:border-[var(--primary)]"
                  autoComplete="current-password"
                  placeholder="Şifren"
                />
                <div className="mt-2 text-right">
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-[var(--primary)]">
                    Şifremi unuttum
                  </Link>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="min-h-12 w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)] disabled:opacity-70"
              >
                {loading ? "Giriliyor..." : "Giriş Yap"}
              </button>
            </form>
          </div>

          <div className="mt-4 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/80 p-4 text-sm leading-6 text-[var(--foreground-muted)]">
            Küçük not: Uygulama arkadaş çevresi ve kurs içi kullanım için hazırlandı. İçeride bir şey saçmalarsa haber verebilirsin.
          </div>

          <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm leading-6 text-[var(--foreground-muted)]">
              Henüz hesabın yok mu?{" "}
              <Link href="/auth/register" className="font-semibold text-[var(--primary)]">
                Kayıt ol
              </Link>{" "}
              ve birkaç dakikada hazır ol.
            </p>
          </div>
        </section>
        </div>

        <AdsenseBanner />
      </div>
    </main>
  );
}
