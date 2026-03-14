"use client";

import { supabase } from "./supabaseClient";

export async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function authorizedFetch(input: string, init?: RequestInit) {
  const token = await getAccessToken();

  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
