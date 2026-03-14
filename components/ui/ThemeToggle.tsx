"use client";

import { useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  return "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-base font-semibold text-[var(--foreground)]"
      aria-label="Temayı değiştir"
      title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
