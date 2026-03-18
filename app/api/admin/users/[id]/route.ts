import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, requireManager } from "@/lib/server/auth";
import { writeAuditLog } from "@/lib/server/audit";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  isRecord,
  isValidEmail,
  validateBoolean,
  validateEnum,
  validateOptionalString,
  validateRequiredString,
} from "@/lib/server/validation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawBody = (await request.json()) as unknown;

  if (!isRecord(rawBody)) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const onlyBanToggle =
    Object.keys(rawBody).length === 1 &&
    typeof rawBody.is_active === "boolean";

  const auth = onlyBanToggle ? await requireAdmin(request) : await requireManager(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (onlyBanToggle) {
    const isActive = validateBoolean(rawBody.is_active, "Ban durumu");
    if (!isActive.ok) {
      return NextResponse.json({ error: isActive.error }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ is_active: isActive.value })
      .eq("id", id)
      .select("id, name, email, role, is_active, admin_note, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await writeAuditLog({
      actor: {
        id: auth.profile.id,
        name: auth.profile.name ?? null,
        role: auth.profile.role ?? null,
      },
      action: isActive.value ? "user_unbanned" : "user_banned",
      target_type: "user",
      target_id: id,
      summary: `${data.name} kullanıcısının ban durumu ${isActive.value ? "açıldı" : "kapatıldı"}.`,
    });

    return NextResponse.json({ data });
  }

  const name = validateRequiredString(rawBody.name, {
    field: "Ad",
    min: 2,
    max: 120,
  });
  if (!name.ok) {
    return NextResponse.json({ error: name.error }, { status: 400 });
  }

  const email = validateOptionalString(rawBody.email, {
    field: "E-posta",
    max: 255,
  });
  if (!email.ok) {
    return NextResponse.json({ error: email.error }, { status: 400 });
  }

  if (email.value && !isValidEmail(email.value)) {
    return NextResponse.json({ error: "E-posta formatı geçersiz." }, { status: 400 });
  }

  const role = validateEnum(rawBody.role, ["student", "admin", "manager"] as const, "Rol");
  if (!role.ok) {
    return NextResponse.json({ error: role.error }, { status: 400 });
  }

  const isActive = validateBoolean(rawBody.is_active, "Aktiflik durumu");
  if (!isActive.ok) {
    return NextResponse.json({ error: isActive.error }, { status: 400 });
  }

  const adminNote = validateOptionalString(rawBody.admin_note, {
    field: "İç not",
    max: 1000,
  });
  if (!adminNote.ok) {
    return NextResponse.json({ error: adminNote.error }, { status: 400 });
  }

  const patch = {
    name: name.value,
    email: email.value,
    role: role.value,
    is_active: isActive.value,
    admin_note: adminNote.value,
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

  await writeAuditLog({
    actor: {
      id: auth.profile.id,
      name: auth.profile.name ?? null,
      role: auth.profile.role ?? null,
    },
    action: "user_updated",
    target_type: "user",
    target_id: id,
    summary: `${data.name} kullanıcısının bilgileri güncellendi.`,
  });

  return NextResponse.json({ data });
}
