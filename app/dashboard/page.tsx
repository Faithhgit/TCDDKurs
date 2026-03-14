"use client";

import AppNavbar from "@/components/ui/AppNavbar";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, getUserProfile, signOut, syncUserProfileEmail } from "@/lib/auth";

const featureCards = [
  {
    eyebrow: "Yakında",
    title: "Sınıf Listesi",
    description:
      "Kim var, kim yok, kim yine son dakika yetişmiş... bunları burada toparlarız.",
  },
  {
    eyebrow: "Hazırlanıyor",
    title: "Ders Programı",
    description:
      "Hangi gün ne var, ne zaman var, moral bozacak kadar erken mi başlıyor, hepsi burada olur.",
  },
  {
    eyebrow: "Planlanan",
    title: "Duyurular",
    description:
      "Kısa notlar, değişiklikler ve önemli hatırlatmalar için sade bir alan gelecek.",
  },
  {
    eyebrow: "Sırada",
    title: "Hızlı Notlar",
    description:
      "Kafaya takılan küçük şeyleri unutmadan yazmak için hafif bir bölüm ekleyeceğiz.",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await getUserProfile(data.user.id);
      if (profile) {
        if (profile.is_active === false) {
          await signOut();
          router.push("/auth/login");
          return;
        }

        if (data.user.email) {
          void syncUserProfileEmail(data.user.id, data.user.email);
        }

        setName(profile.name || data.user.user_metadata?.name || data.user.email || "Öğrenci");
        setIsAdmin(profile.role === "admin");
      } else {
        setName(data.user.user_metadata?.name || data.user.email || "Öğrenci");
      }

      setLoading(false);
    }

    void load();
  }, [router]);

  if (loading) {
    return (
      <AppLoadingScreen
        eyebrow="Dashboard"
        title="Ana ekran hazırlanıyor"
        description="Kutular yerleşiyor, düzen kuruluyor."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface)_96%,white),color-mix(in_srgb,var(--surface-muted)_84%,white))] p-6 shadow-[var(--shadow-strong)]">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
                Hoş geldin, {name}
              </h1>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
                Burası artık boş bir yönlendirme alanı değil. Yavaş yavaş işe yarayan şeylerle dolduracağız.
                Şimdilik kutular hazır, içerikleri sırayla oturturuz.
              </p>
              {isAdmin && (
                <p className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)] shadow-[var(--shadow-soft)]">
                  Admin görünümündesin, ama korkma yine sade gideceğiz.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:color-mix(in_srgb,var(--surface-muted)_58%,white)]"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">{card.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)]">
                  {card.description}
                </p>
                <div className="mt-5 h-2 w-24 rounded-full bg-[color:color-mix(in_srgb,var(--primary)_20%,transparent)]" />
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
