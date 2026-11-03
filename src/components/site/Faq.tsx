import { Plus } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { s, type PublicItem } from "@/lib/content/queries";

export function Faq({ items, title = "Perguntas frequentes" }: { items: PublicItem[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="container-x py-24 md:py-32" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="mt-6 text-h2 font-semibold">
            {title}
          </h2>
        </div>
        <div className="divide-y divide-line border-y border-line lg:col-span-7 lg:col-start-6">
          {items.map((f) => (
            <details key={f.id} className="group py-2 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-4 text-lg font-medium">
                {f.title}
                <Plus className="h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
              </summary>
              <div className="pb-5 pr-10">
                <Markdown source={s(f.data, "answer")} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
