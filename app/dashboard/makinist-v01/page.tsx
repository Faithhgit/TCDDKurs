"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import MakinistGuideClient from "@/components/makinist/MakinistGuideClient";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { getUser, getUserProfile, signOut, syncUserProfileEmail } from "@/lib/auth";
import { authorizedFetch } from "@/lib/clientApi";
import type { MakinistGuideEntry } from "@/lib/makinistGuideData";

type GuidePayload = {
  access?: boolean;
  message?: string;
  entries?: MakinistGuideEntry[];
  error?: string;
};

export default function MakinistV01Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MakinistGuideEntry[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  useEffect(() => {
    async function load() {
      const { data } = await getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await getUserProfile(data.user.id);
      if (profile?.is_active === false) {
        await signOut();
        router.push("/auth/login");
        return;
      }

      if (data.user.email) {
        void syncUserProfileEmail(data.user.id, data.user.email);
      }

      const response = await authorizedFetch("/api/makinist-guide", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as GuidePayload | null;

      if (!response.ok) {
        setRedirectCountdown(10);
        setEntries([]);
        setLockedMessage(
          response.status === 403
            ? payload?.message || "Bu modul su an hesabina acik degil."
            : payload?.error || "Rehber yuklenemedi."
        );
        setLoading(false);
        return;
      }

      setEntries(payload?.entries ?? []);
      setLockedMessage(null);
      setLoading(false);
    }

    void load();
  }, [router]);

  useEffect(() => {
    if (!lockedMessage) {
      return;
    }

    const countdownTimer = window.setInterval(() => {
      setRedirectCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 10000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [lockedMessage, router]);

  if (loading) {
    return (
      <AppLoadingScreen
        eyebrow="Lokomotif Rehberi"
        title="Rehber hazırlanıyor"
        description="İçerikler yükleniyor, birazdan hazır."
      />
    );
  }

  if (lockedMessage) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[var(--background)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_45%),linear-gradient(180deg,color-mix(in_srgb,var(--surface)_92%,black),var(--background))]" />
        <div className="absolute inset-0 flex items-center justify-center p-6 opacity-90 sm:p-10">
          <Image
            src="/makinist/nah.jpg"
            alt="Erisim kapali"
            fill
            priority
            sizes="100vw"
            className="object-contain object-center"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,6,0.12),rgba(4,7,6,0.68))]" />

        <div className="relative z-10 flex min-h-screen items-end justify-center p-4 pb-5 sm:p-8 sm:pb-8">
          <div className="w-full max-w-md rounded-[20px] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_64%,transparent),color-mix(in_srgb,var(--surface-muted)_56%,transparent))] p-3 shadow-[var(--shadow-strong)] backdrop-blur-xl sm:rounded-[24px] sm:p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--primary)]">Lokomotif Bilgi Rehberi</p>
            <h1 className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-2xl">
              Erişim Açık Değil
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--foreground-muted)] sm:text-sm sm:leading-6">
              {lockedMessage}
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border)_68%,transparent)] bg-[color-mix(in_srgb,var(--surface)_52%,transparent)] px-3 py-1.5 text-sm leading-6 text-[var(--foreground)]">
                Ana sayfaya{" "}
                <span className="font-semibold text-[var(--primary)]">{redirectCountdown}</span> saniye içinde
                yönlendirileceksin.
              </div>

              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="rounded-2xl bg-[color-mix(in_srgb,var(--primary)_88%,white)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 sm:self-auto"
              >
                Hemen Dön
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <MakinistGuideClient entries={entries} lockedMessage={null} />;
}
