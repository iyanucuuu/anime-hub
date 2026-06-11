import { Anime } from '../models/anime.models';

// ─── Patrones que indican que un título es una continuación o spin-off ────────

const STRIP_PATTERNS: RegExp[] = [
  // Season / Cour / Part + número
  /\s*:?\s*(season|cour|part|arc|hen)\s*\d+/gi,
  // "2nd Season", "3rd Cour"...
  /\s*\d+(st|nd|rd|th)\s*(season|cour)/gi,
  // "The Final Season (Part X)"
  /\s*the\s+final\s+(season|arc|chapter|cour)(\s+part\s+\d+)?/gi,
  // "- Part 2", "- Cour 2"
  /\s*-\s*(part|cour|chapter)\s*\d+/gi,
  // Sufijos de arco japonés: ": Mugen Ressha-hen", ": Katanakaji no Sato-hen"
  /\s*:\s+[^:]+(-hen|[\s-]arc|[\s-]chapter)\s*$/gi,
  // Arcos conocidos de Demon Slayer, AoT, etc.
  /\s*:\s+(mugen|yuukaku|katanakaji|hashira|infinity|entertainment district|swordsmith|village|pillar|training|corps).*/gi,
  // Año entre paréntesis
  /\s*\(\d{4}\)/gi,
  // Números romanos al final (II, III, IV…)
  /\s+(ii|iii|iv|v|vi)\s*$/gi,
  // Número suelto al final: "Overlord 4", "SAO 3"
  /\s+\d+\s*$/gi,
  // Películas y especiales
  /\s*:?\s*(the movie|movie edition|compilation film)/gi,
  /\s*:?\s*movie\s*\d*/gi,
  /\s*:?\s*chronicle[s]?/gi,
  /\s*:?\s*(recap|special|ova|ona)\s*\d*/gi,
  /\s*:?\s*in the dome.*/gi,
  /\s*the last\b.*/gi,
  /\s*lost girls\b.*/gi,
  /\s*requiem\b.*/gi,
];

// Clave de agrupación (minúsculas, sin sufijos de continuación)
function baseTitle(title: string): string {
  let t = title.toLowerCase().trim();
  for (const p of STRIP_PATTERNS) t = t.replace(p, '');
  return t.replace(/[\s:–\-,]+$/, '').trim().replace(/\s+/g, ' ');
}

// Limpia el título conservando la capitalización original
function cleanTitle(title: string): string {
  let t = title.trim();
  for (const p of STRIP_PATTERNS) t = t.replace(p, '');
  t = t.replace(/[\s:–\-,]+$/, '').trim();
  return t || title; // si queda vacío, devuelve el original
}

// ¿El título tiene indicadores de "segunda entrega"?
function hasSequelSuffix(title: string): boolean {
  return baseTitle(title) !== title.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function dedupByFranchise(animes: Anime[]): Anime[] {
  // Agrupa todos los animes por título base
  const groups = new Map<string, Anime[]>();
  for (const a of animes) {
    const key = baseTitle(a.title);
    if (!key) continue; // por si el título queda vacío tras limpiar
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  return Array.from(groups.values()).map(entries => {
    if (entries.length === 1) {
      // Solo hay uno — si tiene sufijo de temporada, limpia el título
      const a = entries[0];
      if (!hasSequelSuffix(a.title)) return a;
      return { ...a, title: cleanTitle(a.title) };
    }

    // Hay varios en el grupo: preferir el que ya tiene un título limpio
    const clean = entries.find(e => !hasSequelSuffix(e.title));
    if (clean) return clean;

    // Todos tienen sufijo → quedarnos con el de mayor score y limpiar el título
    const best = entries.reduce((a, b) =>
      (b.score ?? 0) > (a.score ?? 0) ? b : a
    );
    return { ...best, title: cleanTitle(best.title) };
  });
}
