import { test } from "node:test";
import assert from "node:assert/strict";
import { jobAvailability } from "../../src/lib/careers/availability";
import { detectFileType } from "../../src/lib/storage/sniff";
import { coerceObject, isSafeUrl, missingRequired, type Field } from "../../src/lib/content/fields";
import { applicationSchema, contactSchema } from "../../src/lib/validation/forms";
import { can } from "../../src/lib/auth/rbac";
import { hashPassword, passwordPolicyError, verifyPassword } from "../../src/lib/auth/password";

test("job availability respects status, deadline and limit", () => {
  const base = { status: "published" as const, deadline: null, maxApplications: null };
  assert.equal(jobAvailability(base, 0).open, true);
  assert.equal(jobAvailability({ ...base, status: "paused" }, 0).open, false);
  assert.equal(jobAvailability({ ...base, status: "closed" }, 0).open, false);
  assert.equal(jobAvailability({ ...base, deadline: "2020-01-01" }, 0).open, false);
  assert.equal(jobAvailability({ ...base, deadline: "2026-11-03" }, 0, new Date("2026-11-03T20:00:00-03:00")).open, true);
  assert.equal(jobAvailability({ ...base, maxApplications: 2 }, 2).open, false);
  assert.equal(jobAvailability({ ...base, maxApplications: 2 }, 1).open, true);
});

test("file sniffing uses magic bytes, not extensions", () => {
  assert.equal(detectFileType(Buffer.from("%PDF-1.7\n%âãÏÓ\n1 0 obj"))?.kind, "pdf");
  assert.equal(detectFileType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))?.kind, "png");
  assert.equal(detectFileType(Buffer.from("<html><script>alert(1)</script></html>")), null);
  assert.equal(detectFileType(Buffer.from("MZ\x90\x00 executable......")), null);
});

test("content coercion strips unsafe urls and unknown keys", () => {
  const fields: Field[] = [
    { name: "title", label: "T", type: "text", required: true },
    { name: "link", label: "L", type: "url" },
    { name: "items", label: "I", type: "list" },
    { name: "kind", label: "K", type: "select", options: [{ value: "a", label: "A" }] },
  ];
  const out = coerceObject(fields, { title: "  Olá ", link: "javascript:alert(1)", items: "a\n\nb", kind: "zzz", evil: 1 });
  assert.deepEqual(out, { title: "Olá", link: "", items: ["a", "b"], kind: "a" });
  assert.deepEqual(missingRequired(fields, { ...out, title: "" }), ["T"]);
  assert.ok(isSafeUrl("/carreiras") && isSafeUrl("https://x.com") && !isSafeUrl("//evil.com") && !isSafeUrl("data:text/html,x"));
});

test("application/contact validation", () => {
  assert.equal(applicationSchema.safeParse({ fullName: "Ana", email: "x", phone: "1", city: "", state: "XX" }).success, false);
  assert.equal(
    applicationSchema.safeParse({ fullName: "Ana Souza", email: "ANA@EXEMPLO.COM", phone: "(31) 99999-0000", city: "Sete Lagoas", state: "MG", consent: "on" }).success,
    true,
  );
  assert.equal(contactSchema.safeParse({ name: "Jo", email: "jo@x.com", topic: "coleta", message: "curta", consent: "on" }).success, false);
});

test("RBAC matrix", () => {
  assert.ok(can("admin", "users.manage"));
  assert.ok(!can("recruiter", "users.manage"));
  assert.ok(can("recruiter", "resumes.download"));
  assert.ok(!can("editor", "resumes.download"));
  assert.ok(!can("editor", "applications.view"));
  assert.ok(can("editor", "content.manage"));
  assert.ok(!can("recruiter", "content.manage"));
  assert.ok(!can(null, "dashboard.view"));
});

test("password hashing and policy", async () => {
  const h = await hashPassword("SenhaForte-123");
  assert.ok(await verifyPassword("SenhaForte-123", h));
  assert.ok(!(await verifyPassword("errada-123456", h)));
  assert.ok(passwordPolicyError("curta1"));
  assert.equal(passwordPolicyError("umaSenhaLonga123"), null);
});
