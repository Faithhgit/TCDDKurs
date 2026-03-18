export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function asOptionalTrimmedString(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateRequiredString(
  value: unknown,
  options: { field: string; min?: number; max: number }
) {
  const normalized = asTrimmedString(value);

  if (!normalized) {
    return { ok: false as const, error: `${options.field} boş bırakılamaz.` };
  }

  if (options.min && normalized.length < options.min) {
    return { ok: false as const, error: `${options.field} çok kısa.` };
  }

  if (normalized.length > options.max) {
    return { ok: false as const, error: `${options.field} çok uzun.` };
  }

  return { ok: true as const, value: normalized };
}

export function validateOptionalString(
  value: unknown,
  options: { field: string; max: number }
) {
  const normalized = asOptionalTrimmedString(value);

  if (!normalized) {
    return { ok: true as const, value: null };
  }

  if (normalized.length > options.max) {
    return { ok: false as const, error: `${options.field} çok uzun.` };
  }

  return { ok: true as const, value: normalized };
}

export function validateEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string
) {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    return { ok: false as const, error: `${field} geçersiz.` };
  }

  return { ok: true as const, value: value as T };
}

export function validateBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    return { ok: false as const, error: `${field} geçersiz.` };
  }

  return { ok: true as const, value };
}

export function validatePositiveNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return { ok: false as const, error: `${field} geçersiz.` };
  }

  return { ok: true as const, value };
}
