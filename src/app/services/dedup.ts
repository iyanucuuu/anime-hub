import { Anime } from '../models/anime.models';

const STRIP_PATTERNS = [
  /\s*:?\s*(season|cour|part|arc|hen)\s*\d+/gi,
  /\s*\d+(st|nd|rd|th)\s*(season|cour)/gi,
  /\s*the\s+final\s+(season|arc|chapter|cour)(\s+part\s+\d+)?/gi,
  /\s*-\s*(part|cour|chapter)\s*\d+/gi,
  /\s*\(\d{4}\)/gi,
  /\s*(ii|iii|iv|v|vi)\s*$/gi,
  // Películas
  /\s*:?\s*movie\s*\d*/gi,
  /\s*:?\s*(the movie|movie edition|compilation film)/gi,
  /\s*:?\s*chronicle[s]?/gi,
  /\s*:?\s*in the dome.*/gi,
  /\s*:?\s*(recap|special|ova|ona)\s*\d*/gi,
  /\s*the last.*/gi,
  /\s*lost girls.*/gi,
  /\s*requiem.*/gi,
];

function baseTitle(title: string): string {
  let t = title.toLowerCase().trim();
  for (const p of STRIP_PATTERNS) t = t.replace(p, '');
  // Quita puntuación sobrante al final (dos puntos, guiones, espacios)
  t = t.replace(/[\s:–\-,]+$/, '');
  return t.trim().replace(/\s+/g, ' ');
}

export function dedupByFranchise(animes: Anime[]): Anime[] {
  const seen = new Map<string, Anime>();
  for (const a of animes) {
    const key = baseTitle(a.title);
    if (!seen.has(key)) {
      seen.set(key, a);
    } else {
      const existing = seen.get(key)!;
      if ((a.score ?? 0) > (existing.score ?? 0)) seen.set(key, a);
    }
  }
  return Array.from(seen.values());
}
