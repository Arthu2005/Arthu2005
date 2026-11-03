/**
 * End-to-end smoke tests against a running instance (default http://localhost:3000).
 * Requires: database seeded with `npm run db:seed -- --demo` and the three test users below
 * (create them with `npm run admin:create`, passing ADMIN_PASSWORD).
 *
 *   E2E_BASE_URL=http://localhost:3000 \
 *   E2E_ADMIN=admin@petrolub.test:senha E2E_RECRUITER=rh@petrolub.test:senha E2E_EDITOR=editor@petrolub.test:senha \
 *   npm run test:e2e
 *
 * Uses the Playwright installed on the machine (global or local).
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import type { Browser, Page } from "playwright";

const require = createRequire(import.meta.url);
function loadPlaywright(): typeof import("playwright") {
  try {
    return require("playwright");
  } catch {
    return require(`${execSync("npm root -g").toString().trim()}/playwright`);
  }
}
const { chromium } = loadPlaywright();

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const cred = (v: string | undefined, fallback: string) => (v ?? fallback).split(":") as [string, string];
const ADMIN = cred(process.env.E2E_ADMIN, "admin@petrolub.test:TesteLocal-2026-x9");
const RECRUITER = cred(process.env.E2E_RECRUITER, "rh@petrolub.test:TesteLocal-2026-r1");
const EDITOR = cred(process.env.E2E_EDITOR, "editor@petrolub.test:TesteLocal-2026-e1");

const tmp = "test-results";
mkdirSync(tmp, { recursive: true });
const PDF = `${tmp}/curriculo.pdf`;
writeFileSync(PDF, "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
const FAKE = `${tmp}/falso.pdf`;
writeFileSync(FAKE, "<html><script>alert(1)</script></html>");

let passed = 0;
const failures: string[] = [];
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  ✗ ${name}\n    ${(err as Error).message.split("\n")[0]}`);
  }
}

async function login(browser: Browser, [email, password]: [string, string]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([page.waitForURL(/\/admin(\/conta.*)?$/), page.click("button[type=submit]")]);
  return page;
}

async function fillApplication(page: Page, email: string, file = PDF) {
  await page.locator('input[name="fullName"]').fill("Pessoa Teste Automatizado");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Telefone / WhatsApp").fill("(31) 98888-7777");
  await page.locator('input[name="city"]').fill("Sete Lagoas");
  await page.getByLabel("UF").selectOption("MG");
  await page.setInputFiles('input[name="resume"]', file);
  const cnh = page.getByLabel("Qual categoria da sua CNH?");
  if (await cnh.count()) await cnh.selectOption("E");
  const mopp = page.getByText("Sim", { exact: true });
  if (await mopp.count()) await mopp.first().click();
  await page.locator('input[name="consent"]').check();
  await page.waitForTimeout(2800); // anti-spam minimum fill time
}

const email = `e2e+${Date.now()}@example.com`;

const browser = await chromium.launch();
const pub = await (await browser.newContext()).newPage();

console.log("Site público");
await step("candidatura válida gera protocolo", async () => {
  await pub.goto(`${BASE}/carreiras/vagas/demo-motorista-de-coleta-sete-lagoas`);
  await fillApplication(pub, email);
  await pub.getByRole("button", { name: "Enviar candidatura" }).click();
  await pub.getByText("Candidatura enviada!").waitFor({ timeout: 15000 });
  assert.match(await pub.getByRole("status").locator("p.font-mono").innerText(), /^PTL-\d{4}-[A-Z0-9]{8}$/);
});
await step("candidatura duplicada é bloqueada", async () => {
  await pub.goto(`${BASE}/carreiras/vagas/demo-motorista-de-coleta-sete-lagoas`);
  await fillApplication(pub, email);
  await pub.getByRole("button", { name: "Enviar candidatura" }).click();
  await pub.getByText("Já recebemos uma candidatura com este e-mail").first().waitFor({ timeout: 15000 });
});
await step("arquivo disfarçado de PDF é rejeitado", async () => {
  await pub.goto(`${BASE}/carreiras/vagas/demo-analista-de-laboratorio`);
  await fillApplication(pub, `fake+${Date.now()}@example.com`, FAKE);
  await pub.getByRole("button", { name: "Enviar candidatura" }).click();
  await pub.getByText("Formato de arquivo não permitido").first().waitFor({ timeout: 15000 });
});
await step("vaga encerrada não exibe formulário", async () => {
  await pub.goto(`${BASE}/carreiras/vagas/demo-jovem-aprendiz-encerrada`);
  await pub.getByText("Candidaturas indisponíveis").waitFor();
  assert.equal(await pub.locator('input[name="resume"]').count(), 0);
});
await step("filtros de vagas", async () => {
  await pub.goto(`${BASE}/carreiras/vagas?modelo=hibrido`);
  assert.equal(await pub.locator("article").count(), 1);
  await pub.goto(`${BASE}/carreiras/vagas?q=inexistente-xyz`);
  await pub.getByText("Nenhuma vaga corresponde aos filtros.").waitFor();
});
await step("banco de talentos", async () => {
  await pub.goto(`${BASE}/carreiras/banco-de-talentos`);
  await pub.locator('input[name="fullName"]').fill("Talento Teste Automatizado");
  await pub.getByLabel("E-mail").fill(`talento+${Date.now()}@example.com`);
  await pub.getByLabel("Telefone / WhatsApp").fill("(31) 97777-6666");
  await pub.locator('input[name="city"]').fill("Belo Horizonte");
  await pub.getByLabel("UF").selectOption("MG");
  await pub.getByText("Manutenção", { exact: true }).click();
  await pub.setInputFiles('input[name="resume"]', PDF);
  await pub.locator('input[name="consent"]').check();
  await pub.waitForTimeout(2800);
  await pub.getByRole("button", { name: "Cadastrar currículo" }).click();
  await pub.getByText("Cadastro realizado!").waitFor({ timeout: 15000 });
});
await step("formulário de contato (com validação)", async () => {
  await pub.goto(`${BASE}/contato?assunto=coleta`);
  await pub.getByLabel("Nome").first().fill("Cliente Teste");
  await pub.getByLabel("E-mail").fill("cliente@example.com");
  await pub.getByLabel("Mensagem").fill("curta");
  await pub.locator('input[name="consent"]').check();
  await pub.waitForTimeout(2800);
  await pub.getByRole("button", { name: "Enviar mensagem" }).click();
  await pub.getByText("pelo menos 10 caracteres").waitFor({ timeout: 15000 });
  await pub.getByLabel("Mensagem").fill("Gostaria de agendar uma coleta de óleo usado na nossa unidade.");
  await pub.locator('input[name="consent"]').check();
  await pub.waitForTimeout(2800);
  await pub.getByRole("button", { name: "Enviar mensagem" }).click();
  await pub.getByText("Mensagem recebida!").waitFor({ timeout: 15000 });
});
await step("honeypot bloqueia robôs", async () => {
  await pub.goto(`${BASE}/contato`);
  await pub.evaluate(() => ((document.querySelector('input[name="website"]') as HTMLInputElement).value = "spam"));
  await pub.getByLabel("Assunto").selectOption("outros");
  await pub.getByLabel("Nome").first().fill("Robo");
  await pub.getByLabel("E-mail").fill("robo@example.com");
  await pub.getByLabel("Mensagem").fill("mensagem automática de spam aqui");
  await pub.locator('input[name="consent"]').check();
  await pub.waitForTimeout(2800);
  await pub.getByRole("button", { name: "Enviar mensagem" }).click();
  await pub.getByText("Não foi possível enviar o formulário.").waitFor({ timeout: 15000 });
});
await step("sem rolagem horizontal em 360/390/768/1024", async () => {
  for (const width of [360, 390, 768, 1024]) {
    for (const path of ["/", "/empresa", "/carreiras", "/carreiras/vagas", "/carreiras/vagas/demo-motorista-de-coleta-sete-lagoas", "/contato"]) {
      await pub.setViewportSize({ width, height: 800 });
      await pub.goto(`${BASE}${path}`);
      const overflow = await pub.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `${path} @${width}px overflow ${overflow}px`);
    }
  }
});
await step("admin exige autenticação", async () => {
  const res = await pub.request.get(`${BASE}/api/admin/export/candidaturas`);
  assert.equal(res.status(), 401);
  await pub.goto(`${BASE}/admin/candidaturas`);
  assert.match(pub.url(), /\/admin\/login/);
});

console.log("Permissões (editor)");
const editor = await login(browser, EDITOR);
await step("editor não acessa candidaturas, currículos nem exportação", async () => {
  await editor.goto(`${BASE}/admin/candidaturas`);
  await editor.getByText("Você não tem permissão").waitFor();
  assert.equal((await editor.request.get(`${BASE}/api/admin/export/candidaturas`)).status(), 403);
});
await step("editor altera conteúdo e o site reflete", async () => {
  await editor.goto(`${BASE}/admin/conteudo/home`);
  const title = editor.locator("#home-hero-title");
  const original = await title.inputValue();
  await title.fill("Título temporário de teste E2E");
  await editor.getByRole("button", { name: "Salvar e publicar seção" }).first().click();
  await editor.getByText("Seção salva e publicada.").first().waitFor({ timeout: 15000 });
  const html = await (await editor.request.get(`${BASE}/`)).text();
  assert.ok(html.includes("Título temporário de teste E2E"));
  await title.fill(original);
  await editor.getByRole("button", { name: "Salvar e publicar seção" }).first().click();
  await editor.getByText("Seção salva e publicada.").first().waitFor({ timeout: 15000 });
});

console.log("Recrutamento (recrutador)");
const rh = await login(browser, RECRUITER);
let resumeUrl = "";
await step("recrutador vê candidatura, muda etapa e registra observação", async () => {
  await rh.goto(`${BASE}/admin/candidaturas?q=${encodeURIComponent(email)}`);
  await rh.getByRole("link", { name: "Pessoa Teste Automatizado" }).first().click();
  await rh.getByText("Dados do candidato").waitFor();
  await rh.locator("#stage").selectOption({ label: "Entrevista" });
  await rh.getByRole("button", { name: "Atualizar etapa" }).click();
  await rh.getByText("Etapa alterada para “Entrevista”.").waitFor({ timeout: 15000 });
  await rh.locator("#note").fill("Observação interna de teste.");
  await rh.getByRole("button", { name: "Registrar observação" }).click();
  await rh.getByText("Observação registrada.").waitFor({ timeout: 15000 });
  resumeUrl = (await rh.getByRole("link", { name: /Baixar currículo/ }).getAttribute("href")) ?? "";
  assert.ok(resumeUrl.startsWith("/api/admin/arquivos/"));
});
await step("download de currículo autorizado e privado", async () => {
  const res = await rh.request.get(`${BASE}${resumeUrl}`);
  assert.equal(res.status(), 200);
  assert.equal(res.headers()["content-type"], "application/pdf");
  assert.match(res.headers()["cache-control"] ?? "", /no-store/);
  assert.equal((await editor.request.get(`${BASE}${resumeUrl}`)).status(), 403);
  assert.equal((await pub.request.get(`${BASE}${resumeUrl}`)).status(), 401);
  assert.equal((await pub.request.get(`${BASE}${resumeUrl.replace("/api/admin/arquivos/", "/media/")}`)).status(), 404);
});
await step("exportação CSV", async () => {
  const res = await rh.request.get(`${BASE}/api/admin/export/candidaturas?q=${encodeURIComponent(email)}`);
  assert.equal(res.status(), 200);
  const csv = await res.text();
  assert.ok(csv.includes(email) && csv.includes("Entrevista"));
});
await step("recrutador não acessa usuários", async () => {
  await rh.goto(`${BASE}/admin/usuarios`);
  await rh.getByText("Você não tem permissão").waitFor();
});
await step("criar, publicar e pausar vaga", async () => {
  const title = `Vaga E2E ${Date.now()}`;
  await rh.goto(`${BASE}/admin/vagas/nova`);
  await rh.locator("#job-title").fill(title);
  await rh.locator("#job-department").fill("Manutenção");
  await rh.locator("#job-city").fill("Sete Lagoas");
  await rh.locator("#job-summary").fill("Vaga criada pelo teste automatizado.");
  await rh.getByRole("button", { name: "Salvar e publicar" }).click();
  await rh.waitForURL(/\/admin\/vagas\/[0-9a-f-]{36}/, { timeout: 15000 });
  const href = await rh.getByRole("link", { name: /Pré-visualizar/ }).getAttribute("href");
  const slug = href!.split("/").pop()!.split("?")[0];
  const pubRes = await pub.request.get(`${BASE}/carreiras/vagas/${slug}`);
  assert.equal(pubRes.status(), 200);
  assert.ok((await pubRes.text()).includes("Inscrições abertas"));
  await rh.getByRole("button", { name: "Pausar inscrições" }).click();
  await rh.waitForTimeout(1500);
  assert.ok((await (await pub.request.get(`${BASE}/carreiras/vagas/${slug}`)).text()).includes("temporariamente pausadas"));
});

console.log("Administração (admin)");
const admin = await login(browser, ADMIN);
await step("auditoria registra download de currículo e exportação", async () => {
  await admin.goto(`${BASE}/admin/auditoria?acao=file.downloaded`);
  await admin.getByText("file.downloaded").first().waitFor();
  await admin.goto(`${BASE}/admin/auditoria?acao=applications.exported`);
  await admin.getByText("applications.exported").first().waitFor();
});
await step("admin acessa usuários e configurações", async () => {
  await admin.goto(`${BASE}/admin/usuarios`);
  await admin.getByText("Matriz de permissões").waitFor();
  await admin.goto(`${BASE}/admin/configuracoes`);
  await admin.getByText("Dados de demonstração").first().waitFor();
});

await browser.close();
console.log(`\n${passed} passaram, ${failures.length} falharam`);
if (failures.length) process.exit(1);
