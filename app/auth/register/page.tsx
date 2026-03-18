"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createUserProfile, registerWithEmail, signInWithEmail } from "@/lib/auth";
import { markSessionActiveForCurrentVersion, triggerReleaseNotesForCurrentVersion } from "@/lib/clientSession";

const termsSections = [
  {
    title: "1. Kullanım Amacı",
    body:
      "Bu platform yalnızca bireysel çalışma, soru çözme, soru ekleme ve kurs içi eğitim desteği amacıyla kullanılabilir. Sistem ticari kullanım, toplu dağıtım, dış paylaşım veya kurumsal yayın amacıyla tasarlanmamıştır.",
  },
  {
    title: "2. Kişisel Kullanım Sınırı",
    body:
      "Kullanıcı, platformda yer alan soru içeriklerini, açıklamaları, konu yapılarını, ekran görüntülerini, veri düzenini ve sistem içindeki diğer içerikleri izinsiz şekilde çoğaltmayacağını, kopyalamayacağını, paylaşmayacağını, yayımlamayacağını, üçüncü kişilere aktarmayacağını ve başka platformlarda kullanmayacağını kabul eder.",
  },
  {
    title: "3. İçerik ve Sorumluluk",
    body:
      "Kullanıcının sisteme eklediği soru, açıklama ve benzeri tüm içeriklerden kullanıcı kendisi sorumludur. Hukuka aykırı, hak ihlali doğuran, yanıltıcı, saldırgan veya üçüncü kişilere ait izinsiz içerik yüklenemez.",
  },
  {
    title: "4. Eğitim ve Referans Niteliği",
    body:
      "Bu platformda yer alan içerikler yalnızca eğitim ve çalışma desteği amacı taşır. Platformdaki soru ve açıklamalar resmi görüş, resmi eğitim materyali, resmi kurum açıklaması veya bağlayıcı kaynak niteliği taşımaz.",
  },
  {
    title: "5. Kurumsal Bağlantı Bulunmaması",
    body:
      "Bu platform, içinde bulunduğunuz kurs ortamında kişisel kullanım amacıyla hazırlanmış bağımsız bir çalışma aracıdır. Platformun TCDD Taşımacılık A.Ş., kursun yürütüldüğü kurum, herhangi bir resmi kuruluş, özel kuruluş, eğitim kurumu veya herhangi bir gerçek ya da tüzel kişi ile doğrudan, resmi veya temsil yetkisi doğuran bir bağlantısı yoktur.",
  },
  {
    title: "6. Yetkisiz Kullanım Yasağı",
    body:
      "Kullanıcı; başka kullanıcıların hesabına erişmeye çalışmamayı, sisteme zarar verecek işlem yapmamayı, verileri izinsiz toplamamayı ve sistem işleyişini bozacak kullanımda bulunmamayı kabul eder.",
  },
  {
    title: "7. İçerik Denetimi",
    body:
      "Platform yöneticileri, sisteme eklenen soruları inceleme, onaylama, reddetme, düzenleme veya silme hakkına sahiptir. Uygunsuz olduğu düşünülen içerikler gerekli görülürse ayrıca bildirim yapılmaksızın kaldırılabilir.",
  },
  {
    title: "8. Hesap ve Erişim",
    body:
      "Platforma erişim hakkı yöneticiler tarafından gerekli görüldüğünde sınırlandırılabilir, askıya alınabilir veya sonlandırılabilir. Kullanıcı, hesabını ve giriş bilgilerini güvenli şekilde korumakla yükümlüdür.",
  },
  {
    title: "9. Veri ve Sistem Kullanımı",
    body:
      "Platform makul ölçüde güvenli kullanım hedefiyle hazırlanmış olsa da hiçbir dijital sistem için kesintisiz erişim veya mutlak veri güvenliği garantisi verilmez. Kullanıcı, teknik aksaklık veya hizmet kesintisi ihtimalini peşinen kabul eder.",
  },
  {
    title: "10. Kabul Beyanı",
    body:
      "Kullanıcı, kayıt işlemini tamamlayarak bu koşulları okuduğunu, anladığını ve kabul ettiğini beyan eder. Koşulları kabul etmeyen kullanıcı platforma kayıt olmamalı ve sistemi kullanmamalıdır.",
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
      setError(signInResult.error.message || "Kayıt tamamlandı fakat giriş yapılamadı.");
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
      <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Yeni Hesap Oluştur</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Öğrenci hesabını oluştur ve soru çözmeye başla.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Ad Soyad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none focus:border-[var(--primary)]"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">E-posta</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none focus:border-[var(--primary)]"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Şifre</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none focus:border-[var(--primary)]"
              autoComplete="new-password"
            />
          </div>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Kullanım Koşulları ve Sorumluluk Beyanı
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Kayıt olmadan önce koşulları okuyup kabul etmelisiniz.
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
              <div className="mt-4 max-h-80 space-y-4 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--foreground-muted)]">
                <p>
                  Bu platform, sınırlı kullanıcı grubu tarafından kişisel eğitim ve soru çözme amacıyla
                  kullanılmak üzere hazırlanmıştır. Platforma kayıt olan ve kullanan her kullanıcı
                  aşağıdaki koşulları kabul etmiş sayılır.
                </p>

                {termsSections.map((section) => (
                  <div key={section.title}>
                    <p className="font-semibold text-[var(--foreground)]">{section.title}</p>
                    <p className="mt-1">{section.body}</p>
                  </div>
                ))}

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-[var(--foreground)]">
                  Kullanıcı, platform içeriğini izinsiz çoğaltması, kopyalaması, dış ortamda
                  paylaşması veya platformun amacına aykırı kullanması halinde erişim yetkisinin
                  kaldırılabileceğini kabul eder.
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
                Kullanım Koşulları ve Sorumluluk Beyanı&apos;nı okudum, anladım ve kabul ediyorum.
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

        <p className="mt-4 text-sm text-[var(--foreground-muted)]">
          Zaten hesabın var mı?{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--primary)]">
            Giriş Yap
          </Link>
        </p>
      </div>
    </main>
  );
}
