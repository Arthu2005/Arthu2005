import type { Role } from "@/lib/db/schema";

export const PERMISSIONS = {
  "dashboard.view": ["admin", "recruiter", "editor"],
  "jobs.manage": ["admin", "recruiter"],
  "applications.view": ["admin", "recruiter"],
  "applications.manage": ["admin", "recruiter"],
  "applications.export": ["admin", "recruiter"],
  "resumes.download": ["admin", "recruiter"],
  "applications.delete": ["admin"],
  "talent.manage": ["admin", "recruiter"],
  "pipeline.configure": ["admin"],
  "contact.manage": ["admin", "editor"],
  "content.manage": ["admin", "editor"],
  "media.manage": ["admin", "editor"],
  "settings.manage": ["admin"],
  "users.manage": ["admin"],
  "audit.view": ["admin"],
  "retention.run": ["admin"],
  "demo.purge": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  recruiter: "Recrutador",
  editor: "Editor de conteúdo",
};
