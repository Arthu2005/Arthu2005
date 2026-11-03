import { Reveal } from "@/components/site/Reveal";
import { ImageSlot } from "@/components/site/ImageSlot";
import { cn } from "@/lib/cn";
import { img, s, type Bag } from "@/lib/content/queries";

/** Grid of team photos with optional captions (repeater items `{ image, caption }`). Renders nothing when empty. */
export function TeamGallery({ items, className }: { items: Bag[]; className?: string }) {
  const photos = items.filter((g) => img(g, "image").src);
  if (!photos.length) return null;
  return (
    <ul className={cn("grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4", className)}>
      {photos.map((g, i) => (
        <Reveal as="li" key={i} delay={i * 0.06}>
          <figure>
            <ImageSlot image={img(g, "image")} className="aspect-[4/5] rounded-[var(--radius-card)]" />
            {s(g, "caption") && <figcaption className="mt-3 text-sm font-medium text-steel">{s(g, "caption")}</figcaption>}
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}
