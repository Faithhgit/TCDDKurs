"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonVariant = "primary" | "secondary" | "outline" | "danger" | "success" | "warning" | "ghost";
type AppButtonSize = "sm" | "md" | "lg";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

const baseClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-150 ease-out active:scale-[0.985] active:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_42%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

const sizeClassNames: Record<AppButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm",
};

const variantClassNames: Record<AppButtonVariant, string> = {
  primary: "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-soft)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] shadow-[0_8px_24px_rgba(46,39,29,0.06)]",
  outline: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
  danger: "bg-rose-600 text-white shadow-[0_12px_28px_rgba(190,24,93,0.18)]",
  success: "bg-emerald-600 text-white shadow-[0_12px_28px_rgba(5,150,105,0.18)]",
  warning: "bg-amber-500 text-white shadow-[0_12px_28px_rgba(217,119,6,0.18)]",
  ghost: "bg-transparent text-[var(--foreground)]",
};

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent opacity-90"
    />
  );
}

export default function AppButton({
  loading = false,
  loadingText,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: AppButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      data-loading={loading ? "true" : "false"}
      className={[
        baseClassName,
        sizeClassNames[size],
        variantClassNames[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? <Spinner /> : null}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}
