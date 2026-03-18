"use client";

import { supabase } from "./supabaseClient";
import { clearClientSessionMetadata } from "./clientSession";

export async function registerWithEmail(email: string, password: string, name: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  });

  const result = (await response.json().catch(() => null)) as
    | {
        error?: string;
        user?: unknown;
        session?: { access_token: string; refresh_token: string } | null;
      }
    | null;

  if (!response.ok) {
    return {
      data: null,
      error: { message: result?.error || "Kayıt sırasında bir hata oldu." },
    };
  }

  if (result?.session?.access_token && result.session.refresh_token) {
    await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
  }

  return {
    data: { user: result?.user ?? null, session: result?.session ?? null },
    error: null,
  };
}

export async function createUserProfile(userId: string, name: string, email?: string) {
  const primary = await supabase
    .from("users")
    .insert([{ id: userId, name, email: email ?? null, role: "student", is_active: true }])
    .select();

  if (!primary.error) {
    return primary;
  }

  const fallback = await supabase
    .from("users")
    .insert([{ id: userId, name, role: "student", is_active: true }])
    .select();

  return fallback;
}

export async function signInWithEmail(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = (await response.json().catch(() => null)) as
    | {
        error?: string;
        user?: { id: string };
        session?: { access_token: string; refresh_token: string };
      }
    | null;

  if (!response.ok || !result?.session || !result?.user) {
    return {
      data: null,
      error: { message: result?.error || "Giriş yapılamadı." },
    };
  }

  const sessionResult = await supabase.auth.setSession({
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
  });

  if (sessionResult.error) {
    return {
      data: null,
      error: { message: sessionResult.error.message },
    };
  }

  const profile = await getUserProfile(result.user.id);

  if (profile.data?.is_active === false) {
    await signOut();
    return {
      data: null,
      error: {
        message: "Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.",
      },
    };
  }

  if (email) {
    await syncUserProfileEmail(result.user.id, email);
  }

  return {
    data: {
      user: result.user,
      session: result.session,
    },
    error: null,
  };
}

export async function signOut() {
  clearClientSessionMetadata();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function requestPasswordReset(email: string) {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/reset-password`
      : undefined;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return { data, error };
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  return { data, error };
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  return { data, error };
}

export async function syncUserProfileEmail(userId: string, email: string) {
  const normalized = email.trim();
  if (!normalized) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from("users")
    .update({ email: normalized })
    .eq("id", userId)
    .select();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
