import { Reveal } from "@/components/site/Reveal";
import { ImageSlot } from "@/components/site/ImageSlot";
import { cn } from "@/lib/cn";
import { img, s, type Bag } from "@/lib/content/queries";

/** Grid of photos (portrait team photos, or landscape facility photos) with optional captions (repeater items `{ image, caption }`). Renders nothing when empty. */
export function TeamGallery({ items, className, landscape = false }: { items: Bag[]; className?: string; landscape?: boolean }) {
  const photos = items.filter((g) => img(g, "image").src);
  if (!photos.length) return null;
  return (
    <ul className={cn("grid gap-4 md:gap-5", landscape ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4", className)}>
      {photos.map((g, i) => (
        <Reveal as="li" key={i} delay={i * 0.06}>
          <figure>
            <ImageSlot
              image={img(g, "image")}
              className={cn(landscape ? "aspect-[4/3]" : "aspect-[4/5]", "rounded-[var(--radius-card)]")}
              sizes={landscape ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
            />
            {s(g, "caption") && <figcaption className="mt-3 text-sm font-medium text-steel">{s(g, "caption")}</figcaption>}
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}
