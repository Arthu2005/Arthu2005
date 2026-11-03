"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveApplication } from "@/lib/actions/admin/applications";
import { formatDate } from "@/lib/labels";
import { cn } from "@/lib/cn";

type Card = { id: string; fullName: string; jobTitle: string; createdAt: string; stageId: number; isDemo: boolean };
type Stage = { id: number; label: string; color: string };

/**
 * Kanban board. Drag & drop between columns, or use the per-card select (keyboard / screen reader friendly).
 * Changes are optimistic and persisted through a server action that re-checks permissions.
 */
export function ApplicationPipeline({ stages, cards, canEdit }: { stages: Stage[]; cards: Card[]; canEdit: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [optimistic, apply] = useOptimistic(cards, (state, m: { id: string; stageId: number }) => state.map((c) => (c.id === m.id ? { ...c, stageId: m.stageId } : c)));

  const move = (id: string, stageId: number) => {
    start(async () => {
      apply({ id, stageId });
      const r = await moveApplication(id, stageId);
      setMessage(r?.message ?? "");
      router.refresh();
    });
  };

  return (
    <div>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex gap-4" style={{ minWidth: `${stages.length * 17}rem` }}>
          {stages.map((st) => {
            const list = optimistic.filter((c) => c.stageId === st.id);
            return (
              <section
                key={st.id}
                aria-label={`${st.label}: ${list.length}`}
                onDragOver={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  setOver(st.id);
                }}
                onDragLeave={() => setOver((o) => (o === st.id ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  if (dragId) move(dragId, st.id);
                  setDragId(null);
                }}
                className={cn("flex w-64 shrink-0 flex-col rounded-2xl bg-paper-2 p-3 transition-colors", over === st.id && "bg-accent/10 ring-2 ring-accent/40")}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: st.color }} aria-hidden="true" />
                    {st.label}
                  </h2>
                  <span className="rounded-full bg-white px-2 text-xs tabular-nums text-steel">{list.length}</span>
                </header>
                <ul className="flex min-h-24 flex-col gap-2">
                  {list.map((c) => (
                    <li
                      key={c.id}
                      draggable={canEdit}
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn("rounded-xl border border-line bg-white p-3 shadow-sm", canEdit && "cursor-grab active:cursor-grabbing", dragId === c.id && "opacity-50")}
                    >
                      <Link href={`/admin/candidaturas/${c.id}`} className="text-sm font-medium hover:underline">
                        {c.fullName}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-steel">{c.jobTitle}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[0.7rem] text-steel">
                          {formatDate(c.createdAt)}
                          {c.isDemo && " · demo"}
                        </span>
                        {canEdit && (
                          <select
                            aria-label={`Mover ${c.fullName} para outra etapa`}
                            value={c.stageId}
                            onChange={(e) => move(c.id, Number(e.target.value))}
                            className="max-w-[7.5rem] rounded-md border border-line bg-white px-1.5 py-1 text-[0.7rem]"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
