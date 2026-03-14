import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";

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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id, role, is_active, name, email")
    .eq("id", user.id)
    .single();

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

  if (authResult.profile.role !== "admin") {
    return { error: "Bu işlem için admin yetkisi gerekiyor.", status: 403 as const };
  }

  return authResult;
}
