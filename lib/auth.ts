"use client";

import { supabase } from "./supabaseClient";

export async function registerWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  return { data, error };
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { data, error };
  }

  const profile = await getUserProfile(data.user.id);

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
    await syncUserProfileEmail(data.user.id, email);
  }

  return { data, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
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
