"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import AdsenseBanner from "@/components/ui/AdsenseBanner";
import { APP_VERSION } from "@/lib/appConfig";
import { createUserProfile, registerWithEmail, signInWithEmail } from "@/lib/auth";
import {
  markSessionActiveForCurrentVersion,
  triggerReleaseNotesForCurrentVersion,
} from "@/lib/clientSession";

const termsSections = [
  {
    title: "1. Kullanım amacı",
    body:
      "Bu alan soru çözmek, soru eklemek ve kurs içi çalışmayı toparlamak için kullanılır.",
  },
  {
    title: "2. İçerik kullanımı",
    body:
      "İçerikler izinsiz şekilde dışarı taşınamaz, kopyalanamaz veya başka yerde yayımlanamaz.",
  },
  {
    title: "3. Sorumluluk",
    body:
      "Eklenen soru, görsel ve açıklama gibi içeriklerden kullanıcı sorumludur. Uygunsuz içerik kaldırılabilir.",
  },
  {
    title: "4. Yönetim hakkı",
    body:
      "Yöneticiler içerikleri inceleyebilir, onaylayabilir, reddedebilir, düzenleyebilir veya kaldırabilir.",
  },
  {
    title: "5. Hesap erişimi",
    body:
      "Gerekli durumlarda erişim sınırlandırılabilir veya hesap pasife alınabilir. Giriş bilgilerini korumak kullanıcıya aittir.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email || !password) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    if (!acceptedTerms) {
      setError("Devam etmek için kullanım koşullarını kabul etmelisiniz.");
      return;
    }

    setLoading(true);
    const { data, error: registerError } = await registerWithEmail(email, password, name.trim());

    if (registerError) {
      setLoading(false);
      setError(registerError.message || "Kayıt sırasında bir hata oldu.");
      return;
    }

    const signInResult = await signInWithEmail(email, password);
    if (signInResult.error) {
      setLoading(false);
      setError(signInResult.error.message || "Kayıt tamamlandı ama giriş yapılamadı.");
      return;
    }

    const signedInUser = signInResult.data?.user as { id?: string } | undefined;
    const registeredUser = data?.user as { id?: string } | null | undefined;
    const userId = signedInUser?.id ?? registeredUser?.id;

    if (!userId) {
      setLoading(false);
      setError("Kullanıcı bilgisi alınamadı. Lütfen tekrar deneyin.");
      return;
    }

    const profileResult = await createUserProfile(userId, name.trim(), email.trim());
    if (profileResult.error) {
      setLoading(false);
      setError(`Profil oluşturulamadı: ${profileResult.error.message}`);
      return;
    }

    markSessionActiveForCurrentVersion();
    triggerReleaseNotesForCurrentVersion();
    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AdsenseBanner />

        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_82%,white))] p-6 shadow-[var(--shadow-strong)] sm:p-7">
          <div className="pointer-events-none absolute left-0 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_68%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Kayıt alanı</p>
                <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
                  Hesabını aç, direkt başla.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--foreground-muted)]">
                  Kayıt olduktan sonra soru çözebilir, soru ekleyebilir ve modlar arasında rahatça
                  gezebilirsin.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                v{APP_VERSION}
              </span>
            </div>

            <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_90%,white),color-mix(in_srgb,var(--surface-muted)_74%,white))] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Kısa not</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Burada süreç uzamıyor. Hesabı aç, şartları onayla, sonra içeride devam et.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_76%,white))] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Yeni hesap</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Kayıt ol</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Bilgilerini gir, koşulları onayla ve birkaç dakikada içeri geç.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Ad soyad</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none transition focus:border-[var(--primary)]"
                  autoComplete="name"
                  placeholder="Adın soyadın"
                />
              </div>

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
                  autoComplete="new-password"
                  placeholder="Kendine bir şifre belirle"
                />
              </div>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Kullanım koşulları ve sorumluluk beyanı
                    </p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      Kısa metni açıp onaylaman gerekiyor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTerms((current) => !current)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                  >
                    {showTerms ? "Metni Gizle" : "Metni Oku"}
                  </button>
                </div>

                {showTerms && (
                  <div className="mt-4 max-h-72 space-y-4 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--foreground-muted)]">
                    <p>
                      Bu platform sınırlı kullanıcı grubu için hazırlanmış kişisel bir çalışma alanıdır.
                      Kayıt olan herkes aşağıdaki maddeleri kabul etmiş sayılır.
                    </p>

                    {termsSections.map((section) => (
                      <div key={section.title}>
                        <p className="font-semibold text-[var(--foreground)]">{section.title}</p>
                        <p className="mt-1">{section.body}</p>
                      </div>
                    ))}

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-[var(--foreground)]">
                      İçeriğin izinsiz paylaşılması veya amaç dışı kullanılması durumunda erişim
                      kaldırılabilir.
                    </div>
                  </div>
                )}

                <label className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <input
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-[var(--border)]"
                  />
                  <span className="text-sm leading-6 text-[var(--foreground)]">
                    Kullanım koşullarını okudum, anladım ve kabul ediyorum.
                  </span>
                </label>
              </section>

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
                {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
              </button>
            </form>
          </div>

          <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm leading-6 text-[var(--foreground-muted)]">
              Zaten hesabın var mı?{" "}
              <Link href="/auth/login" className="font-semibold text-[var(--primary)]">
                Giriş yap
              </Link>{" "}
              ve direkt devam et.
            </p>
          </div>
        </section>
        </div>

        <AdsenseBanner />
      </div>
    </main>
  );
}
