import "server-only";
import { env } from "@/lib/env";
import { clientIp } from "@/lib/request";

/**
 * Layered spam protection for public forms:
 * 1. Honeypot field ("website") that humans never see/fill.
 * 2. Minimum fill time (signed timestamp issued when the form renders).
 * 3. Rate limiting per pseudonymised IP (see rate-limit.ts, applied by each action).
 * 4. Optional Cloudflare Turnstile when TURNSTILE_SECRET_KEY is configured.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const MIN_FILL_MS = 2500;
const MAX_AGE_MS = 1000 * 60 * 60 * 6;

export function issueFormToken(): string {
  const ts = Date.now().toString();
  const sig = createHmac("sha256", env.APP_SECRET).update(`form:${ts}`).digest("base64url");
  return `${ts}.${sig}`;
}

function validToken(token: string | null): boolean {
  if (!token) return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  const expected = createHmac("sha256", env.APP_SECRET).update(`form:${ts}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const age = Date.now() - Number(ts);
  return age >= MIN_FILL_MS && age <= MAX_AGE_MS;
}

export async function checkSpam(form: FormData): Promise<string | null> {
  if (String(form.get("website") ?? "").length > 0) return "Não foi possível enviar o formulário.";
  if (!validToken(form.get("_t") as string | null)) {
    return "Não foi possível validar o envio. Recarregue a página e tente novamente.";
  }
  if (env.TURNSTILE_SECRET_KEY) {
    const token = String(form.get("cf-turnstile-response") ?? "");
    if (!token) return "Confirme a verificação de segurança.";
    try {
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: (await clientIp()) ?? "" }),
      });
      const json = (await res.json()) as { success?: boolean };
      if (!json.success) return "A verificação de segurança falhou. Tente novamente.";
    } catch {
      return "Não foi possível validar a verificação de segurança. Tente novamente.";
    }
  }
  return null;
}
