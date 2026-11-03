import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { storage } from "@/lib/storage";

/** Public media (images/PDFs uploaded by editors). Private files (resumes) are never served here. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clean = id.replace(/\.[a-z0-9]+$/i, "");
  if (!/^[0-9a-f-]{36}$/i.test(clean)) return new NextResponse("Não encontrado", { status: 404 });
  const [file] = await db.select().from(files).where(and(eq(files.id, clean), eq(files.visibility, "public"))).limit(1);
  if (!file) return new NextResponse("Não encontrado", { status: 404 });
  const data = await storage().get(file.storageKey);
  if (!data) return new NextResponse("Não encontrado", { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(file.mimeType === "application/pdf" ? { "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}` } : {}),
    },
  });
}
