import type { Silhouette as SilhouetteId } from "@/types/catalog";

/** Ilustrações em traço fino usadas na direção de arte dos placeholders. viewBox 200×260. */
const PATHS: Record<SilhouetteId, string[]> = {
  dress: [
    "M84 28 L90 66 Q100 73 110 66 L116 28",
    "M90 66 Q85 96 92 118 L56 232 Q100 246 144 232 L108 118 Q115 96 110 66",
    "M92 118 Q100 123 108 118",
  ],
  gown: [
    "M86 24 L92 62 Q100 68 108 62 L114 24",
    "M92 62 Q87 90 93 110 Q70 170 36 244 Q100 254 164 244 Q130 170 107 110 Q113 90 108 62",
    "M93 110 Q100 114 107 110",
    "M100 116 L96 246 M86 140 L62 244 M114 140 L138 244",
  ],
  blazer: [
    "M70 40 L100 54 L130 40 L160 62 L170 214 L148 218 L142 124 L140 226 L60 226 L58 124 L52 218 L30 214 L40 62 Z",
    "M70 40 L86 108 L100 150 L114 108 L130 40",
    "M100 150 L100 226",
  ],
  top: [
    "M74 44 Q100 58 126 44 L160 70 L148 100 L134 92 L136 200 L64 200 L66 92 L52 100 L40 70 Z",
    "M100 54 L100 200",
  ],
  trousers: ["M66 30 L134 30 L146 238 L110 238 L100 98 L90 238 L54 238 Z", "M66 46 L134 46", "M82 46 L80 90 M118 46 L120 90"],
  skirt: ["M70 50 L130 50 L160 226 Q100 240 40 226 Z", "M70 64 L130 64", "M88 64 L76 232 M112 64 L124 232 M100 64 L100 236"],
  bag: ["M50 112 L150 112 L162 222 L38 222 Z", "M72 112 Q72 58 100 58 Q128 58 128 112", "M90 140 L110 140 L110 154 L90 154 Z"],
  jewel: ["M48 48 Q100 176 152 48", "M100 134 L100 156"],
  knit: [
    "M70 44 Q100 58 130 44 L166 64 L178 196 L156 198 L144 96 L140 206 L60 206 L56 96 L44 198 L22 196 L34 64 Z",
    "M60 192 L140 192 M88 200 L88 192 M100 200 L100 192 M112 200 L112 192",
    "M100 56 L100 206",
  ],
  shoe: [
    "M34 196 L118 204 Q150 208 160 178 L166 150 L152 148 Q140 176 118 178 Q78 174 58 150 Q42 166 34 196 Z",
    "M158 182 L164 230 L154 230 L148 196",
    "M86 172 L104 150 M66 160 L84 140",
  ],
  vest: ["M70 36 L100 120 L130 36 L150 50 L152 236 L48 236 L50 50 Z", "M100 120 L100 236", "M60 170 L84 170 M116 170 L140 170"],
};

const CIRCLES: Partial<Record<SilhouetteId, { cx: number; cy: number; r: number }[]>> = {
  jewel: [
    { cx: 100, cy: 124, r: 10 },
    { cx: 100, cy: 170, r: 13 },
  ],
  blazer: [
    { cx: 100, cy: 168, r: 2.5 },
    { cx: 100, cy: 190, r: 2.5 },
  ],
};

export function Silhouette({ id, className }: { id: SilhouetteId; className?: string }) {
  return (
    <svg viewBox="0 0 200 260" className={className} fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      {PATHS[id].map((d) => (
        <path key={d} d={d} vectorEffect="non-scaling-stroke" />
      ))}
      {CIRCLES[id]?.map((c) => (
        <circle key={`${c.cx}-${c.cy}`} {...c} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
