import { supabaseAdmin } from "./supabaseAdmin";

type AuditActor = {
  id: string;
  name: string | null;
  role: string | null;
};

type WriteAuditLogInput = {
  actor: AuditActor;
  action: string;
  target_type: string;
  target_id?: string | null;
  summary: string;
};

export async function writeAuditLog(input: WriteAuditLogInput) {
  try {
    await supabaseAdmin.from("audit_logs").insert([
      {
        actor_user_id: input.actor.id,
        actor_name: input.actor.name ?? "Bilinmeyen Kullanıcı",
        actor_role: input.actor.role ?? "unknown",
        action: input.action,
        target_type: input.target_type,
        target_id: input.target_id ?? null,
        summary: input.summary,
      },
    ]);
  } catch (error) {
    console.error("Audit log yazılamadı:", error);
  }
}
