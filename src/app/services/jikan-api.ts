import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import {
  Anime,
  AnimeCharacter,
  JikanListResponse,
  JikanSingleResponse,
} from '../models/anime.models';

const BASE_URL = 'https://api.jikan.moe/v4';

// Jikan es la API pública de MyAnimeList y aplica un rate-limit estricto
// (~3 peticiones/segundo, ~60/minuto). Cacheamos las respuestas en memoria
// con un TTL para evitar repetir la misma petición (p. ej. al volver a una
// página ya visitada) y reducir el riesgo de recibir un 429.
interface CacheEntry<T> {
  expiresAt: number;
  observable$: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class JikanApi {
  private http = inject(HttpClient);
  private cache = new Map<string, CacheEntry<unknown>>();

  // Listados (top, temporada, búsquedas): cambian poco a lo largo del día.
  private static readonly LIST_TTL_MS = 5 * 60 * 1000; // 5 minutos
  // Detalle de un anime / personajes: prácticamente estático.
  private static readonly DETAIL_TTL_MS = 30 * 60 * 1000; // 30 minutos

  searchAnime(query: string, page = 1): Observable<JikanListResponse<Anime>> {
    return this.getCached<JikanListResponse<Anime>>(
      `${BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20&type=tv&sfw=true`,
      JikanApi.LIST_TTL_MS
    );
  }

  searchAnimeAll(query: string, page = 1): Observable<JikanListResponse<Anime>> {
    return this.getCached<JikanListResponse<Anime>>(
      `${BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20&sfw=true`,
      JikanApi.LIST_TTL_MS
    );
  }

  /** Búsqueda con filtro de tipo explícito: 'tv' | 'movie' | 'all'. */
  searchByType(query: string, type: 'tv' | 'movie' | 'all', page = 1): Observable<JikanListResponse<Anime>> {
    const typeParam = type !== 'all' ? `&type=${type}` : '';
    return this.getCached<JikanListResponse<Anime>>(
      `${BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20${typeParam}&sfw=true`,
      JikanApi.LIST_TTL_MS
    );
  }

  getAnimeById(id: number): Observable<JikanSingleResponse<Anime>> {
    return this.getCached<JikanSingleResponse<Anime>>(
      `${BASE_URL}/anime/${id}/full`,
      JikanApi.DETAIL_TTL_MS
    );
  }

  getAnimeCharacters(id: number): Observable<JikanListResponse<AnimeCharacter>> {
    return this.getCached<JikanListResponse<AnimeCharacter>>(
      `${BASE_URL}/anime/${id}/characters`,
      JikanApi.DETAIL_TTL_MS
    );
  }

  getTopAnime(page = 1): Observable<JikanListResponse<Anime>> {
    return this.getCached<JikanListResponse<Anime>>(
      `${BASE_URL}/top/anime?page=${page}&limit=24&type=tv`,
      JikanApi.LIST_TTL_MS
    );
  }

  getTopMovies(page = 1): Observable<JikanListResponse<Anime>> {
    return this.getCached<JikanListResponse<Anime>>(
      `${BASE_URL}/top/anime?page=${page}&limit=24&type=movie`,
      JikanApi.LIST_TTL_MS
    );
  }

  getTopByGenre(genreId: number, page = 1, type: 'tv' | 'movie' = 'tv'): Observable<JikanListResponse<Anime>> {
    return this.getCached<JikanListResponse<Anime>>(
      `${BASE_URL}/anime?genres=${genreId}&order_by=score&sort=desc&page=${page}&limit=25&type=${type}&sfw=true`,
      JikanApi.LIST_TTL_MS
    );
  }

  getSeasonNow(page = 1): Observable<JikanListResponse<Anime>> {
    return this.getCached<JikanListResponse<Anime>>(
      `${BASE_URL}/seasons/now?page=${page}&limit=24&filter=tv`,
      JikanApi.LIST_TTL_MS
    );
  }

  /**
   * Devuelve una petición HTTP cacheada en memoria. Si ya existe una entrada
   * vigente para la misma URL, reutiliza el observable (compartido vía
   * shareReplay) en lugar de lanzar una nueva petición de red.
   */
  private getCached<T>(url: string, ttlMs: number): Observable<T> {
    const now = Date.now();
    const cached = this.cache.get(url) as CacheEntry<T> | undefined;

    if (cached && cached.expiresAt > now) {
      return cached.observable$;
    }

    const observable$ = this.http.get<T>(url).pipe(
      tap(() => {
        const entry = this.cache.get(url) as CacheEntry<T> | undefined;
        if (entry) {
          entry.expiresAt = Date.now() + ttlMs;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cache.set(url, { expiresAt: now + ttlMs, observable$ 