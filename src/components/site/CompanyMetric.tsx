import { Reveal } from "./Reveal";

export function CompanyMetric({ value, label, index, dark = false }: { value: string; label: string; index: number; dark?: boolean }) {
  return (
    <Reveal delay={index * 0.08} className={`border-t pt-6 ${dark ? "border-white/15" : "border-ink/15"}`}>
      <p className={`font-display text-[clamp(3rem,2rem+3vw,5.5rem)] font-semibold leading-none tracking-[-0.05em] tabular-nums ${dark ? "text-white" : "text-ink"}`}>{value}</p>
      <p className={`mt-4 max-w-[16rem] text-[0.95rem] leading-snug ${dark ? "text-white/60" : "text-steel"}`}>{label}</p>
    </Reveal>
  );
}
