"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Job, JobQuestion } from "@/lib/db/schema";
import { saveJob } from "@/lib/actions/admin/jobs";
import { CONTRACT_TYPES } from "@/lib/labels";
import { UFS } from "@/lib/validation/forms";
import { AdminButton, ResultMessage } from "./ActionForm";
import { Card, inputCls, labelCls } from "./ui";

type Errors = Record<string, string> | undefined;

function Field({ name, label, errors, children, help }: { name: string; label: string; errors: Errors; children: React.ReactNode; help?: string }) {
  return (
    <div>
      <label htmlFor={`job-${name}`} className={labelCls}>
        {label}
      </label>
      {children}
      {help && !errors?.[name] && <p className="mt-1 text-xs text-steel">{help}</p>}
      {errors?.[name] && <p className="mt-1 text-xs text-signal">{errors[name]}</p>}
    </div>
  );
}

const newId = () => Math.random().toString(36).slice(2, 10);

function QuestionsBuilder({ initial }: { initial: JobQuestion[] }) {
  const [qs, setQs] = useState<JobQuestion[]>(initial);
  const update = (i: number, patch: Partial<JobQuestion>) => setQs((a) => a.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: number) =>
    setQs((a) => {
      const b = [...a];
      const [x] = b.splice(i, 1);
      b.splice(i + d, 0, x!);
      return b;
    });
  return (
    <div className="space-y-3">
      <input type="hidden" name="questions" value={JSON.stringify(qs.map((q) => ({ ...q, options: q.type === "select" ? (q.options ?? []).filter(Boolean) : undefined })))} />
      {qs.map((q, i) => (
        <div key={q.id} className="rounded-xl border border-line bg-paper p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_11rem_auto]">
            <div>
              <label className={labelCls} htmlFor={`q-${q.id}`}>
                Pergunta {i + 1}
              </label>
              <input id={`q-${q.id}`} className={inputCls} value={q.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Ex.: Possui CNH categoria E?" />
            </div>
            <div>
              <label className={labelCls} htmlFor={`qt-${q.id}`}>
                Tipo
              </label>
              <select id={`qt-${q.id}`} className={inputCls} value={q.type} onChange={(e) => update(i, { type: e.target.value as JobQuestion["type"] })}>
                <option value="text">Resposta curta</option>
                <option value="textarea">Resposta longa</option>
                <option value="yesno">Sim / Não</option>
                <option value="select">Lista de opções</option>
              </select>
            </div>
            <div className="flex items-end gap-1">
              <AdminButton type="button" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima">
                <ArrowUp className="h-4 w-4" />
              </AdminButton>
              <AdminButton type="button" variant="ghost" onClick={() => move(i, 1)} disabled={i === qs.length - 1} aria-label="Mover para baixo">
                <ArrowDown className="h-4 w-4" />
              </AdminButton>
              <AdminButton type="button" variant="ghost" onClick={() => setQs((a) => a.filter((_, j) => j !== i))} aria-label="Remover pergunta">
                <Trash2 className="h-4 w-4 text-signal" />
              </AdminButton>
            </div>
          </div>
          {q.type === "select" && (
            <div className="mt-3">
              <label className={labelCls} htmlFor={`qo-${q.id}`}>
                Opções (uma por linha)
              </label>
              <textarea id={`qo-${q.id}`} rows={3} className={inputCls} value={(q.options ?? []).join("\n")} onChange={(e) => update(i, { options: e.target.value.split("\n") })} />
            </div>
          )}
          <label className="mt-3 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} /> Resposta obrigatória
          </label>
        </div>
      ))}
      <AdminButton type="button" variant="secondary" onClick={() => setQs((a) => [...a, { id: newId(), label: "", type: "text", required: false }])}>
        <Plus className="h-4 w-4" /> Adicionar pergunta
      </AdminButton>
    </div>
  );
}

export function JobEditor({ job, departments }: { job?: Job; departments: string[] }) {
  const [result, action, pending] = useActionState(saveJob, null);
  const [mode, setMode] = useState(job?.applicationMode ?? "internal");
  const e = result?.errors;
  const text = (name: keyof Job, label: string, opts: { help?: string; list?: string; required?: boolean; placeholder?: string } = {}) => (
    <Field name={name} label={label} errors={e} help={opts.help}>
      <input id={`job-${name}`} name={name} defaultValue={(job?.[name] as string) ?? ""} list={opts.list} required={opts.required} placeholder={opts.placeholder} className={inputCls} aria-invalid={e?.[name] ? true : undefined} />
    </Field>
  );
  const area = (name: keyof Job, label: string, help?: string, rows = 5) => (
    <Field name={name} label={label} errors={e} help={help}>
      <textarea id={`job-${name}`} name={name} rows={rows} defaultValue={Array.isArray(job?.[name]) ? (job![name] as string[]).join("\n") : ((job?.[name] as string) ?? "")} className={inputCls} />
    </Field>
  );

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      {job && <input type="hidden" name="id" value={job.id} />}
      <div className="space-y-6">
        <Card title="Informações principais">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">{text("title", "Cargo *", { required: true })}</div>
            {text("department", "Área / departamento *", { list: "departments", required: true })}
            <datalist id="departments">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <Field name="contractType" label="Tipo de contratação *" errors={e}>
              <input id="job-contractType" name="contractType" list="contracts" defaultValue={job?.contractType ?? "CLT"} className={inputCls} required />
              <datalist id="contracts">
                {CONTRACT_TYPES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            {text("city", "Cidade *", { required: true })}
            <div className="grid grid-cols-2 gap-4">
              <Field name="state" label="UF *" errors={e}>
                <select id="job-state" name="state" defaultValue={job?.state ?? "MG"} className={inputCls}>
                  {UFS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </Field>
              <Field name="workModel" label="Modelo *" errors={e}>
                <select id="job-workModel" name="workModel" defaultValue={job?.workModel ?? "presencial"} className={inputCls}>
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="remoto">Remoto</option>
                </select>
              </Field>
            </div>
            <div className="md:col-span-2">{area("summary", "Resumo (aparece no card)", "Até 400 caracteres.", 2)}</div>
            <div className="md:col-span-2">{area("description", "Descrição", "Aceita formatação simples: **negrito**, *itálico*, listas com “- ” e links [texto](https://…).", 7)}</div>
          </div>
        </Card>
        <Card title="Detalhes">
          <div className="grid gap-4 md:grid-cols-2">
            {area("responsibilities", "Responsabilidades (uma por linha)")}
            {area("requirements", "Requisitos obrigatórios (um por linha)")}
            {area("niceToHave", "Requisitos desejáveis (um por linha)")}
            {area("benefits", "Benefícios (um por linha)", "Informe apenas benefícios confirmados pelo RH.")}
            <div className="md:col-span-2">{area("selectionSteps", "Etapas do processo seletivo (uma por linha)", undefined, 3)}</div>
          </div>
        </Card>
        <Card title="Perguntas adicionais do formulário">
          <QuestionsBuilder initial={job?.questions ?? []} />
        </Card>
        <Card title="SEO (opcional)">
          <div className="grid gap-4">
            {text("seoTitle", "Título para buscadores")}
            {area("seoDescription", "Descrição para buscadores", undefined, 2)}
            {text("slug", "Endereço (slug)", { help: "Gerado a partir do cargo se ficar vazio." })}
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card title="Publicação">
          <div className="space-y-4">
            <Field name="applicationMode" label="Recebimento de candidaturas" errors={e}>
              <select id="job-applicationMode" name="applicationMode" value={mode} onChange={(ev) => setMode(ev.target.value as "internal" | "external")} className={inputCls}>
                <option value="internal">Formulário deste site</option>
                <option value="external">Portal externo (ex.: Sólides)</option>
              </select>
            </Field>
            {mode === "external" && text("externalUrl", "Link da vaga no portal externo *", { placeholder: "https://petrolub.vagas.solides.com.br/…" })}
            <Field name="deadline" label="Prazo de inscrição" errors={e} help="Opcional. Após a data, as inscrições se encerram automaticamente.">
              <input id="job-deadline" type="date" name="deadline" defaultValue={job?.deadline ?? ""} className={inputCls} />
            </Field>
            <Field name="maxApplications" label="Limite de inscrições" errors={e} help="Opcional.">
              <input id="job-maxApplications" type="number" min={1} name="maxApplications" defaultValue={job?.maxApplications ?? ""} className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={job?.featured} /> Destacar na Home e em Carreiras
            </label>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <AdminButton name="intent" value="publish" variant="accent" pending={pending}>
              {job?.status === "published" ? "Salvar alterações" : "Salvar e publicar"}
            </AdminButton>
            {job?.status !== "published" && (
              <AdminButton name="intent" value={job ? "save" : "draft"} variant="secondary" pending={pending}>
                {job ? "Salvar sem publicar" : "Salvar como rascunho"}
              </AdminButton>
            )}
          </div>
          <ResultMessage result={result} />
        </Card>
      </div>
    </form>
  );
}
