import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { hashIp } from "@/lib/crypto";

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip");
}

export async function clientIpHash(): Promise<string | null> {
  return hashIp(await clientIp(), env.APP_SECRET);
}

export async function userAgent(): Promise<string | null> {
  return (await headers()).get("user-agent")?.slice(0, 300) ?? null;
}
