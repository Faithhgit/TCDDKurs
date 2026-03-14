import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, requireManager } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string | null;
    email?: string | null;
    role?: "student" | "admin" | "manager";
    is_active?: boolean;
    admin_note?: string | null;
  };

  const onlyBanToggle =
    Object.keys(body).length === 1 &&
    typeof body.is_active === "boolean";

  const auth = onlyBanToggle ? await requireAdmin(request) : await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const patch = onlyBanToggle
    ? { is_active: body.is_active }
    : {
        name: body.name?.trim() || null,
        email: body.email?.trim() || null,
        role: body.role,
        is_active: body.is_active,
        admin_note: body.admin_note?.trim() || null,
      };

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(patch)
    .eq("id", id)
    .select("id, name, email, role, is_active, admin_note, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
