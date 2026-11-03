import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { img, s, bool, type PublicItem } from "@/lib/content/queries";
import { ImageSlot } from "./ImageSlot";
import { Provisional } from "./Provisional";

export const CATEGORY_LABELS: Record<string, string> = { servico: "Serviço", produto: "Produto", documentacao: "Documentação ambiental" };

export function SolutionCard({ item, index, showMarkers }: { item: PublicItem; index: number; showMarkers: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)]">
      <div className="relative">
        <ImageSlot image={img(item.data, "image")} className="aspect-[4/3] transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]" label="Imagem pendente" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 font-mono text-xs tabular-nums text-ink backdrop-blur">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">{CATEGORY_LABELS[s(item.data, "category")] ?? "Solução"}</span>
          <Provisional show={showMarkers && bool(item.data, "provisional")} />
        </div>
        <h3 className="mt-4 text-h3 font-semibold">
          <Link href={`/solucoes/${item.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {item.title}
          </Link>
        </h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-steel">{s(item.data, "summary")}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-ink">
          Saiba mais <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
