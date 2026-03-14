"use client";

import { supabase } from "./supabaseClient";

export type UserRole = "student" | "admin";

export type UserRow = {
  id: string;
  name: string;
  email?: string | null;
  role: UserRole;
  is_active: boolean;
  admin_note?: string | null;
  created_at?: string | null;
};

export async function fetchUsersForAdmin() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, admin_note, created_at")
    .order("created_at", { ascending: false });

  if (!error) {
    return { data, error };
  }

  const fallback = await supabase
    .from("users")
    .select("id, name, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return fallback;
}

export async function updateUserForAdmin(
  id: string,
  input: Partial<Pick<UserRow, "name" | "email" | "role" | "is_active" | "admin_note">>
) {
  return await supabase.from("users").update(input).eq("id", id);
}
