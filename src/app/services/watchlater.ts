import { Injectable } from '@angular/core';
import { AnimeUserPayload } from '../models/anime.models';
import { UserListBase } from './user-list.base';

export interface WatchLaterAnime extends AnimeUserPayload {
  addedAt: number;
}

@Injectable({ providedIn: 'root' })
export class WatchLaterService extends UserListBase<WatchLaterAnime> {
  protected override readonly collectionName = 'watchlater';

  readonly list = this.items;
  isInList(id: number) { return this.has(id); }

  protected override sort(items: WatchLaterAnime[]): WatchLaterAnime[] {
    return [...items].sort((a, b) => b.addedAt - a.addedAt);
  }

  protected override buildPayload(anime: AnimeUserPayload): WatchLaterAnime {
    return { ...anime, addedAt: Date.now() };
  }
}
