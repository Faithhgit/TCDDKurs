import type { Metadata, Viewport } from "next";

import ReleaseNotesModal from "@/components/ui/ReleaseNotesModal";
import SessionGuard from "@/components/ui/SessionGuard";
import { APP_VERSION } from "@/lib/appConfig";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soru Çözme Uygulaması",
  description: "Kurs için soru çözme ve soru ekleme platformu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ece6dc" },
    { media: "(prefers-color-scheme: dark)", color: "#111614" },
  ],
};

const themeScript = `
  (() => {
    try {
      const storedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = storedTheme || (prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
    } catch (_) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SessionGuard />
        <ReleaseNotesModal />
        <div className="app-shell">
          <div className="app-content">{children}</div>
          <footer className="app-footer">
            <p>© 2026 Fatih Çetinkaya. Tüm hakları saklıdır. Sürüm {APP_VERSION}</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
