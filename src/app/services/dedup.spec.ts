import { describe, it, expect } from 'vitest';
import { dedupByFranchise } from './dedup';
import { Anime } from '../models/anime.models';

/** Crea un objeto Anime mínimo para los tests */
function makeAnime(id: number, title: string, score: number | null = 7): Anime {
  return {
    mal_id: id,
    title,
    score,
    status: 'Finished Airing',
    images: { jpg: { image_url: 'https://example.com/img.jpg' } },
  };
}

describe('dedupByFranchise', () => {
  it('devuelve el array original si no hay duplicados de franquicia', () => {
    const input = [
      makeAnime(1, 'Naruto'),
      makeAnime(2, 'Bleach'),
      makeAnime(3, 'One Piece'),
    ];
    expect(dedupByFranchise(input)).toHaveLength(3);
  });

  it('elimina temporadas duplicadas de la misma franquicia', () => {
    const input = [
      makeAnime(1, 'Attack on Titan', 9.0),
      makeAnime(2, 'Attack on Titan Season 2', 8.5),
      makeAnime(3, 'Attack on Titan Season 3', 8.8),
    ];
    const result = dedupByFranchise(input);
    expect(result).toHaveLength(1);
  });

  it('conserva el anime con mayor puntuación cuando hay duplicados', () => {
    // "The Final Season" sí es eliminado por STRIP_PATTERNS → mismo base title
    const input = [
      makeAnime(1, 'Attack on Titan', 9.0),
      makeAnime(2, 'Attack on Titan The Final Season', 9.1),
    ];
    const result = dedupByFranchise(input);
    expect(result).toHaveLength(1);
    expect(result[0].mal_id).toBe(2);
    expect(result[0].score).toBe(9.1);
  });

  it('mantiene el primero si ambos tienen el mismo score', () => {
    const input = [
      makeAnime(1, 'Sword Art Online', 7.2),
      makeAnime(2, 'Sword Art Online II', 7.2),
    ];
    const result = dedupByFranchise(input);
    expect(result).toHaveLength(1);
    expect(result[0].mal_id).toBe(1);
  });

  it('trata score null como 0 al comparar', () => {
    const input = [
      makeAnime(1, 'My Hero Academia', null),
      makeAnime(2, 'My Hero Academia Season 2', 8.0),
    ];
    const result = dedupByFranchise(input);
    expect(result[0].mal_id).toBe(2);
  });

  it('devuelve un array vacío si recibe uno vacío', () => {
    expect(dedupByFranchise([])).toEqual([]);
  });

  it('elimina partes con sufijos "Part" y números romanos', () => {
    const input = [
      makeAnime(1, 'Demon Slayer', 8.5),
      makeAnime(2, 'Demon Slayer - Part 2', 8.2),
    ];
    expect(dedupByFranchise(input)).toHaveLength(1);
  });
});
