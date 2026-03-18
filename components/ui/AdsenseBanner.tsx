"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT_ID = "ca-pub-1086260801913853";
const ADSENSE_SLOT_ID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID ?? "";

export default function AdsenseBanner() {
  useEffect(() => {
    if (!ADSENSE_SLOT_ID) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  if (!ADSENSE_SLOT_ID) {
    return (
      <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface-muted))] px-5 py-5 shadow-[var(--shadow-soft)]">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--primary)]">Sponsorlu Alan</p>
        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">AdSense scripti bağlandı.</p>
        <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
          Gerçek banner&apos;ın görünmesi için sadece `ad slot id` eksik.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface-muted))] px-4 py-4 shadow-[var(--shadow-soft)]">
      <p className="px-1 text-[11px] uppercase tracking-[0.18em] text-[var(--primary)]">Sponsorlu Alan</p>
      <div className="mt-3 min-h-[110px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ADSENSE_SLOT_ID}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
