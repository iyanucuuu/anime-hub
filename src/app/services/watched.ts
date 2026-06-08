import { Injectable } from '@angular/core';
import { AnimeUserPayload } from '../models/anime.models';
import { UserListBase } from './user-list.base';

export interface WatchedAnime extends AnimeUserPayload {
  watchedAt: number;
}

@Injectable({ providedIn: 'root' })
export class WatchedService extends UserListBase<WatchedAnime> {
  protected override readonly collectionName = 'watched';

  readonly watched = this.items;
  isWatched(id: number) { return this.has(id); }

  protected override sort(items: WatchedAnime[]): WatchedAnime[] {
    return [...items].sort((a, b) => b.watchedAt - a.watchedAt);
  }

  protected override buildPayload(anime: AnimeUserPayload): WatchedAnime {
    return { ...anime, watchedAt: Date.now() };
  }
}
