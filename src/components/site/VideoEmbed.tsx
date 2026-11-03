"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Play } from "lucide-react";

export function youtubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

/**
 * Click-to-load YouTube player (privacy-enhanced domain). Nothing from YouTube loads until the visitor
 * presses play, except the static thumbnail image.
 */
export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const id = youtubeId(url);
  const [play, setPlay] = useState(false);
  if (!id) return null;
  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-forest">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label={`Assistir: ${title}`}>
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-[opacity,transform] duration-700 group-hover:scale-[1.03] group-hover:opacity-100" />
          <span className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/20 to-transparent" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 inline-flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-[0_20px_50px_-15px_rgb(166_226_46/0.7)] ring-4 ring-white/20 transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
            <Play className="ml-1 h-8 w-8" fill="currentColor" />
          </span>
          <span className="absolute bottom-5 left-6 text-sm font-medium text-white/90">Vídeo · YouTube</span>
        </button>
      )}
    </div>
  );
}
