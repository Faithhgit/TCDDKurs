"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const RELEASE_VERSION = "1.1.1";
const RELEASE_TRIGGER_KEY = "release_notes_trigger";
const RELEASE_DISMISSED_KEY = "release_notes_dismissed_version";

const updates = [
  "Güvenlik tarafında biraz toparlandık. Admin işlemlerinin önemli kısmı artık daha kontrollü ilerliyor.",
  "Sorulara localde görsel ekleme açıldı. Şimdilik aynı cihazda görünüyor, yine de iş görüyor.",
  "Genel görünüm, yazılar ve bazı sıkıcı detaylar elden geçti. Uygulama biraz daha temiz ve rahat kullanılır hale geldi.",
  "Hata bildir bölümü genişletildi. Bir şey saçmalarsa bize daha hızlı ulaşabiliyorsun.",
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

      if (triggeredVersion !== RELEASE_VERSION || dismissedVersion === RELEASE_VERSION) {
        setVisible(false);
        return;
      }

      setVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  function handleClose() {
    if (dontShowAgain) {
      localStorage.setItem(RELEASE_DISMISSED_KEY, RELEASE_VERSION);
    }

    sessionStorage.removeItem(RELEASE_TRIGGER_KEY);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)]">Küçük Not</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          1.1.1 sürümünde neler değişti?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
          Uygulama biraz daha toparlandı. En görünür değişiklikleri şuraya bıraktık:
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
            Not: Bu hâlâ test sürümü. Garip bir şey görürsen menüdeki hata bildir kısmına bırak.
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
  );
}
