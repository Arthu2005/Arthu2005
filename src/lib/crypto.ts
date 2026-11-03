import { createHash, createHmac, randomBytes } from "node:crypto";

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Pseudonymised IP (HMAC) so rate limiting and audit work without storing raw IPs. */
export function hashIp(ip: string | null | undefined, secret: string): string | null {
  if (!ip) return null;
  return createHmac("sha256", secret).update(ip).digest("hex");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Human friendly protocol, e.g. PTL-2026-7KQ3M9XA */
export function protocolCode(prefix: string): string {
  const bytes = randomBytes(8);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${new Date().getFullYear()}-${code}`;
}
