export type AllowedKind = "pdf" | "docx" | "doc" | "jpeg" | "png" | "webp" | "avif";

type Detected = { kind: AllowedKind; mime: string; ext: string };

const startsWith = (buf: Buffer, sig: number[], offset = 0) => sig.every((b, i) => buf[offset + i] === b);

/** Detects file type from magic bytes. */
export function detectFileType(buf: Buffer): Detected | null {
  if (buf.length < 12) return null;
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { kind: "pdf", mime: "application/pdf", ext: "pdf" };
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { kind: "jpeg", mime: "image/jpeg", ext: "jpg" };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "png", mime: "image/png", ext: "png" };
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8))
    return { kind: "webp", mime: "image/webp", ext: "webp" };
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], 4)) return { kind: "avif", mime: "image/avif", ext: "avif" };
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { kind: "doc", mime: "application/msword", ext: "doc" };
  // DOCX = ZIP container with a word/ entry. Check ZIP header + presence of "word/" in the central directory.
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) {
    const tail = buf.subarray(Math.max(0, buf.length - 65536)).toString("latin1");
    const head = buf.subarray(0, Math.min(buf.length, 65536)).toString("latin1");
    if ((tail + head).includes("word/")) {
      return { kind: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx" };
    }
  }
  return null;
}

export const RESUME_KINDS: AllowedKind[] = ["pdf", "docx", "doc"];
export const IMAGE_KINDS: AllowedKind[] = ["jpeg", "png", "webp", "avif"];
export const DOCUMENT_KINDS: AllowedKind[] = ["pdf"];
