import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soru Çözme Uygulaması",
  description: "Kurs için soru çözme ve soru ekleme platformu",
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
        {children}
      </body>
    </html>
  );
}
