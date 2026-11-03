import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicationEvents, applications, files } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { storage } from "@/lib/storage";
import { audit } from "@/lib/audit";

/** Private file download (resumes). Requires an authenticated user with resumes.download. Every access is audited. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Não encontrado", { status: 404 });
  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) return new NextResponse("Não encontrado", { status: 404 });
  const permission = file.purpose === "resume" ? "resumes.download" : "media.manage";
  if (!can(user.role, permission)) return new NextResponse("Acesso negado", { status: 403 });
  const data = await storage().get(file.storageKey);
  if (!data) return new NextResponse("Arquivo indisponível", { status: 404 });

  await audit(user, "file.downloaded", "file", file.id, { purpose: file.purpose });
  if (file.purpose === "resume") {
    const [app] = await db.select({ id: applications.id }).from(applications).where(eq(applications.resumeFileId, file.id)).limit(1);
    if (app) await db.insert(applicationEvents).values({ applicationId: app.id, userId: user.id, userName: user.name, type: "resume_downloaded" });
  }
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
