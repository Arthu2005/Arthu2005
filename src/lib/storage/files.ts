import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files, type FileRecord } from "@/lib/db/schema";
import { randomToken, sha256 } from "@/lib/crypto";
import { uploadMaxBytes } from "@/lib/env";
import { storage } from "./index";
import { detectFileType, type AllowedKind } from "./sniff";

export class UploadError extends Error {}

/**
 * Validates and stores an uploaded file.
 * - checks size limit
 * - checks the REAL type by magic bytes (the browser-provided MIME is not trusted)
 * - stores under a random key (original name kept only as metadata)
 */
export async function saveUpload(
  file: File,
  opts: { kinds: AllowedKind[]; purpose: "resume" | "media" | "document"; visibility: "public" | "private"; uploadedBy?: string | null; alt?: string | null; maxBytes?: number },
): Promise<FileRecord> {
  const max = opts.maxBytes ?? uploadMaxBytes;
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) throw new UploadError("Selecione um arquivo.");
  if (file.size > max) throw new UploadError(`O arquivo excede o limite de ${Math.round(max / 1024 / 1024)} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const detected = detectFileType(buf);
  if (!detected || !opts.kinds.includes(detected.kind)) {
    throw new UploadError("Formato de arquivo não permitido.");
  }
  const key = `${opts.visibility}/${opts.purpose}/${new Date().toISOString().slice(0, 7)}/${randomToken(18)}.${detected.ext}`;
  await storage().put(key, buf, detected.mime);
  const name = (file.name || `arquivo.${detected.ext}`).replace(/[\r\n"\\/]/g, "_").slice(0, 200);
  const [row] = await db
    .insert(files)
    .values({
      storageKey: key,
      originalName: name,
      mimeType: detected.mime,
      size: buf.length,
      sha256: sha256(buf),
      visibility: opts.visibility,
      purpose: opts.purpose,
      uploadedBy: opts.uploadedBy ?? null,
      alt: opts.alt ?? null,
    })
    .returning();
  return row!;
}

export async function deleteFile(id: string) {
  const [row] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!row) return;
  await storage().remove(row.storageKey).catch(() => {});
  await db.delete(files).where(eq(files.id, id));
}
