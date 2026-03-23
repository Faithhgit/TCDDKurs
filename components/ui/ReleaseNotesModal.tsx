"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { APP_VERSION, RELEASE_DISMISSED_KEY, RELEASE_TRIGGER_KEY } from "@/lib/appConfig";

const updates = [
  "Yeni ders programı eklendi.",
  "Bazı hatalar giderildi ve düzenlemeler yapıldı.",
];

function shouldCheckPath(pathname: string) {
  return pathname.startsWith("/dashboard");
}

export default function ReleaseNotesModal() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!shouldCheckPath(pathname)) {
        setVisible(false);
        return;
      }

      const triggeredVersion = sessionStorage.getItem(RELEASE_TRIGGER_KEY);
      const dismissedVersion = localStorage.getItem(RELEASE_DISMISSED_KEY);

      if (triggeredVersion !== APP_VERSION || dismissedVersion === APP_VERSION) {
        setVisible(false);
        return;
      }

      setVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  function handleClose() {
    if (dontShowAgain) {
      localStorage.setItem(RELEASE_DISMISSED_KEY, APP_VERSION);
    }

    sessionStorage.removeItem(RELEASE_TRIGGER_KEY);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-3 py-4 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="flex min-h-full items-center justify-center sm:min-h-0">
        <div className="my-auto w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] max-sm:max-h-[calc(100dvh-2rem)] max-sm:overflow-y-auto sm:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)]">Sürüm Notu</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            1.5.3 sürümünde neler değişti?
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
            Bu sürümde ders programı güncellendi ve çeşitli düzenlemeler yapıldı.
          </p>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <ul className="space-y-3 text-sm leading-6 text-[var(--foreground)]">
              {updates.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-[0.35rem] h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <input
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            />
            <span className="text-sm leading-6 text-[var(--foreground)]">
              Bir sonraki sürüm çıkana kadar bunu bir daha gösterme
            </span>
          </label>

          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/70 p-4">
            <p className="text-xs leading-5 text-[var(--foreground-muted)]">
              Not: Garip bir durum görürsen menüdeki hata bildir alanından iletebilirsin.
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
