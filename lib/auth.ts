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

export async function createUserProfile(userId: string, name: string) {
  const { data, error } = await supabase
    .from("users")
    .insert([{ id: userId, name, role: "student", is_active: true }])
    .select();
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
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
