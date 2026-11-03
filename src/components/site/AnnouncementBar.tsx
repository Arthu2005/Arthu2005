import Link from "next/link";
import { s, type PublicItem } from "@/lib/content/queries";

export function AnnouncementBar({ banner }: { banner?: PublicItem }) {
  if (!banner) return null;
  const href = s(banner.data, "linkHref");
  return (
    <div className="relative z-[51] bg-accent-deep text-center text-sm text-white">
      <p className="container-x py-2.5">
        {s(banner.data, "text")}{" "}
        {href && (
          <Link href={href} className="font-medium text-lime underline-offset-4 hover:underline">
            {s(banner.data, "linkLabel") || "Saiba mais"} →
          </Link>
        )}
      </p>
    </div>
  );
}
