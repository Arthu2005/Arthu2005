/* Black glossy oil with subtle green reflections and a lime rim light. */
const drop = "absolute rounded-full bg-[radial-gradient(circle_at_32%_28%,#56645c_0%,#0e1511_32%,#000_70%)] shadow-[inset_-8px_-12px_24px_rgba(0,0,0,.85),inset_7px_9px_20px_rgba(166,226,46,.2),0_30px_50px_-20px_rgba(6,43,23,.5)]";
const glint = "absolute left-[22%] top-[16%] h-[18%] w-[34%] rotate-[-25deg] rounded-full bg-white/70 blur-[1px]";

/**
 * Static glossy oil droplets (pure CSS) used as a light-weight echo of the hero scene.
 * They are black, like the headings, so they must never sit behind text: the large drop only appears where the
 * layout leaves an empty column (from `lg`, or from `xl` with `compact` for pages whose heading spans wider), and
 * small screens get a single small drop tucked into the top-right corner.
 */
export function OilDrops({ compact = false }: { compact?: boolean }) {
  const big = compact ? "hidden xl:block xl:right-[3%] xl:top-28 xl:h-52 xl:w-52" : "hidden lg:block lg:right-[5%] lg:top-28 lg:h-64 lg:w-64";
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div className={`${drop} right-[-1.5rem] top-24 h-16 w-16 opacity-90 ${compact ? "xl:hidden" : "lg:hidden"} motion-safe:animate-[ptl-float_9s_ease-in-out_infinite]`}>
        <span className={glint} />
      </div>
      <div className={`${drop} ${big} motion-safe:animate-[ptl-float_9s_ease-in-out_infinite]`}>
        <span className={glint} />
      </div>
      <div className={`${drop} right-[30%] top-40 hidden h-10 w-10 xl:block motion-safe:animate-[ptl-float_7s_ease-in-out_infinite_-2s]`}>
        <span className={glint} />
      </div>
      <div className={`${drop} bottom-10 right-[18%] hidden h-16 w-16 xl:block motion-safe:animate-[ptl-float_11s_ease-in-out_infinite_-4s]`}>
        <span className={glint} />
      </div>
    </div>
  );
}
