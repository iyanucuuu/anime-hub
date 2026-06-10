import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

const BASE_TITLE = 'AnimeHub';
const BASE_DESC  = 'Descubre, organiza y comparte tu anime favorito. Listas, reseñas y amigos en un solo lugar.';
const BASE_IMG   = 'https://animehub.app/preview.png'; // cambia por tu URL real

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta  = inject(Meta);

  set(opts: { title?: string; description?: string; image?: string; url?: string }) {
    const t   = opts.title       ? `${opts.title} — ${BASE_TITLE}` : BASE_TITLE;
    const d   = opts.description ?? BASE_DESC;
    const img = opts.image       ?? BASE_IMG;
    const url = opts.url         ?? (typeof window !== 'undefined' ? window.location.href : '');

    this.title.setTitle(t);

    const tags: { name?: string; property?: string; content: string }[] = [
      { name: 'description',        content: d },
      // Open Graph
      { property: 'og:title',       content: t },
      { property: 'og:description', content: d },
      { property: 'og:image',       content: img },
      { property: 'og:url',         content: url },
      { property: 'og:type',        content: 'website' },
      // Twitter Card
      { name: 'twitter:card',        content: 'summary_large_image' },
      { name: 'twitter:title',       content: t },
      { name: 'twitter:description', content: d },
      { name: 'twitter:image',       content: img },
    ];

    for (const tag of tags) {
      if (tag.property) {
        this.meta.updateTag({ property: tag.property, content: tag.content });
      } else if (tag.name) {
        this.meta.updateTag({ name: tag.name, content: tag.content });
      }
    }
  }
}
