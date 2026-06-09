import { Injectable } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AnimeUserPayload } from '../models/anime.models';
import { UserListBase } from './user-list.base';

export interface WatchingAnime extends AnimeUserPayload {
  /** Episodios totales conocidos en el momento de añadir (puede ser null si aún emite). */
  episodes: number | null;
  /** Episodio actual visto por el usuario. */
  progress: number;
  /** Marca de tiempo de la última actualización de progreso. */
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class WatchingService extends UserListBase<WatchingAnime> {
  protected override readonly collectionName = 'watching';

  readonly watching = this.items;
  isWatching(id: number) { return this.has(id); }

  /** Progreso guardado para un anime concreto, o 0 si no está en la lista. */
  progressOf(id: number): number {
    return this._items().find(a => a.mal_id === id)?.progress ?? 0;
  }

  protected override sort(items: WatchingAnime[]): WatchingAnime[] {
    return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  protected override buildPayload(anime: AnimeUserPayload): WatchingAnime {
    return {
      ...anime,
      episodes: anime.episodes ?? null,
      progress: 0,
      updatedAt: Date.now(),
    };
  }

  /**
   * Actualiza el episodio por el que va el usuario, sin afectar al resto del documento.
   * Usa merge para no pisar el resto de campos guardados.
   */
  async setProgress(anime: AnimeUserPayload, progress: number): Promise<void> {
    const u = this.auth.user();
    if (!u) return;

    const max = anime.episodes ?? Number.MAX_SAFE_INTEGER;
    const clamped = Math.max(0, Math.min(progress, max));

    const ref = doc(db, `users/${u.uid}/${this.collectionName}`, String(anime.mal_id));

    if (!this.has(anime.mal_id)) {
      // Si todavía no está en la lista, la añadimos con el progreso indicado.
      await setDoc(ref, { ...this.buildPayload(anime), progress: clamped, updatedAt: Date.now() });
      return;
    }

    await setDoc(ref, { progress: clamped, updatedAt: Date.now() }, { merge: true });
  }
}
