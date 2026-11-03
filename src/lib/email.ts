import "server-only";
import { env } from "@/lib/env";

export const emailConfigured = () => Boolean(env.SMTP_HOST && env.SMTP_FROM);

type Mail = { to: string; subject: string; text: string; replyTo?: string };

/** Sends a transactional e-mail when SMTP is configured. Never throws: e-mail failure must not lose a submission. */
export async function sendMail(mail: Mail): Promise<"sent" | "skipped" | "failed"> {
  if (!emailConfigured()) return "skipped";
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from: env.SMTP_FROM, to: mail.to, subject: mail.subject, text: mail.text, replyTo: mail.replyTo });
    return "sent";
  } catch (err) {
    console.error("[email] falha no envio:", (err as Error).message);
    return "failed";
  }
}
