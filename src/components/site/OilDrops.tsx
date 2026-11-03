/* Black glossy oil with subtle green reflections and a lime rim light. */
const drop = "absolute rounded-full bg-[radial-gradient(circle_at_32%_28%,#56645c_0%,#0e1511_32%,#000_70%)] shadow-[inset_-8px_-12px_24px_rgba(0,0,0,.85),inset_7px_9px_20px_rgba(166,226,46,.2),0_30px_50px_-20px_rgba(6,43,23,.5)]";
const glint = "absolute left-[22%] top-[16%] h-[18%] w-[34%] rotate-[-25deg] rounded-full bg-white/70 blur-[1px]";

/** Static glossy oil droplets (pure CSS) used as a light-weight echo of the hero scene. */
export function OilDrops() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div className={`${drop} right-[-5.5rem] top-20 h-40 w-40 opacity-90 md:right-[6%] md:top-24 md:h-72 md:w-72 md:opacity-100 motion-safe:animate-[ptl-float_9s_ease-in-out_infinite]`}>
        <span className={glint} />
      </div>
      <div className={`${drop} right-[30%] top-40 hidden h-10 w-10 md:block motion-safe:animate-[ptl-float_7s_ease-in-out_infinite_-2s]`}>
        <span className={glint} />
      </div>
      <div className={`${drop} bottom-10 right-[18%] hidden h-16 w-16 md:block motion-safe:animate-[ptl-float_11s_ease-in-out_infinite_-4s]`}>
        <span className={glint} />
      </div>
    </div>
  );
}
