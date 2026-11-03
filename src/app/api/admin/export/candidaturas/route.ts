import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listApplications, parseAppFilters } from "@/lib/careers/admin-queries";
import { audit } from "@/lib/audit";

/** Neutralises spreadsheet formula injection and escapes CSV. */
function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  if (!can(user.role, "applications.export")) return new NextResponse("Acesso negado", { status: 403 });
  const f = parseAppFilters(Object.fromEntries(req.nextUrl.searchParams));
  const rows = await listApplications(f, 10000);
  const header = ["Protocolo", "Recebida em", "Vaga", "Etapa", "Nome", "E-mail", "Telefone", "Cidade", "UF", "LinkedIn", "Respostas", "Demonstração"];
  const lines = rows.map((r) =>
    [
      r.protocol,
      r.createdAt.toISOString(),
      r.jobTitle,
      r.stageLabel,
      r.fullName,
      r.email,
      r.phone,
      r.city,
      r.state,
      r.linkedinUrl ?? "",
      r.answers.map((a) => `${a.label}: ${a.answer}`).join(" | "),
      r.isDemo ? "sim" : "não",
    ]
      .map(cell)
      .join(";"),
  );
  await audit(user, "applications.exported", "application", null, { filters: f, count: rows.length });
  const csv = "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidaturas-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
