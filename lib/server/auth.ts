import { NextRequest } from "next/server";

import { supabaseAdmin } from "./supabaseAdmin";

export type StaffRole = "admin" | "manager";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function requireUser(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: "Oturum doğrulanamadı.", status: 401 as const };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { error: "Geçersiz oturum.", status: 401 as const };
  }

  const primaryProfileRes = await supabaseAdmin
    .from("users")
    .select("id, role, is_active, name, email, can_access_makinist_guide, makinist_guide_message")
    .eq("id", user.id)
    .single();

  const fallbackProfileRes =
    primaryProfileRes.error?.message?.includes("can_access_makinist_guide") ||
    primaryProfileRes.error?.message?.includes("makinist_guide_message")
      ? await supabaseAdmin.from("users").select("id, role, is_active, name, email").eq("id", user.id).single()
      : null;

  const profile = (fallbackProfileRes?.data ?? primaryProfileRes.data)
    ? {
        ...(fallbackProfileRes?.data ?? primaryProfileRes.data),
        can_access_makinist_guide:
          (primaryProfileRes.data as { can_access_makinist_guide?: boolean } | null)?.can_access_makinist_guide ??
          false,
        makinist_guide_message:
          (primaryProfileRes.data as { makinist_guide_message?: string | null } | null)?.makinist_guide_message ??
          null,
      }
    : null;
  const profileError = fallbackProfileRes?.error ?? primaryProfileRes.error;

  if (profileError || !profile) {
    return { error: "Kullanıcı profili bulunamadı.", status: 403 as const };
  }

  if (profile.is_active === false) {
    return { error: "Hesap pasif durumda.", status: 403 as const };
  }

  return { user, profile };
}

export async function requireAdmin(request: NextRequest) {
  const authResult = await requireUser(request);
  if ("error" in authResult) {
    return authResult;
  }

  if (!["admin", "manager"].includes(String(authResult.profile.role))) {
    return { error: "Bu işlem için yönetim yetkisi gerekiyor.", status: 403 as const };
  }

  return authResult;
}

export async function requireManager(request: NextRequest) {
  const authResult = await requireUser(request);
  if ("error" in authResult) {
    return authResult;
  }

  if (authResult.profile.role !== "manager") {
    return { error: "Bu işlem sadece yöneticiye açık.", status: 403 as const };
  }

  return authResult;
}
