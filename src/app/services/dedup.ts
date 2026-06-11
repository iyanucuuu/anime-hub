import { Anime } from '../models/anime.models';

const STRIP_PATTERNS = [
  // Temporadas y partes numeradas
  /\s*:?\s*(season|cour|part|arc|hen)\s*\d+/gi,
  /\s*\d+(st|nd|rd|th)\s*(season|cour)/gi,
  /\s*the\s+final\s+(season|arc|chapter|cour)(\s+part\s+\d+)?/gi,
  /\s*-\s*(part|cour|chapter)\s*\d+/gi,
  // Sufijos de arco japoneses: ": Mugen Ressha-hen", ": Katanakaji no Sato-hen"
  /\s*:\s+[^:]+(-hen|[\s-]arc|[\s-]chapter)\s*$/gi,
  // Subtítulos de arco/temporada después de ":"
  /\s*:\s+(mugen|yuukaku|katanakaji|hashira|infinity|entertainment district|swordsmith|village|pillar|training|corps).*/gi,
  // Año entre paréntesis
  /\s*\(\d{4}\)/gi,
  // Números romanos al final
  /\s*(ii|iii|iv|v|vi)\s*$/gi,
  // "2nd Season", "3rd Season"...
  /\s*\d+(nd|rd|th|st)\b.*/gi,
  // Películas y specials
  /\s*:?\s*movie\s*\d*/gi,
  /\s*:?\s*(the movie|movie edition|compilation film)/gi,
  /\s*:?\s*chronicle[s]?/gi,
  /\s*:?\s*in the dome.*/gi,
  /\s*:?\s*(recap|special|ova|ona)\s*\d*/gi,
  /\s*the last.*/gi,
  /\s*lost girls.*/gi,
  /\s*requiem.*/gi,
  // Sufijo de número al final ("2", "3"...)
  /\s+\d+\s*$/gi,
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
