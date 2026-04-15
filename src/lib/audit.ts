import { db } from "@/lib/db";

type AuditPayload = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

function toAuditJson(value: unknown) {
  if (value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
}

export async function createAuditLog(payload: AuditPayload) {
  return db.auditLog.create({
    data: {
      actorUserId: payload.actorUserId ?? null,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      beforeJson: toAuditJson(payload.before),
      afterJson: toAuditJson(payload.after),
      metadata: toAuditJson(payload.metadata),
    },
  });
}
