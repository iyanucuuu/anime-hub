import { Injectable } from '@angular/core';
import { AnimeUserPayload } from '../models/anime.models';
import { UserListBase } from './user-list.base';

export interface FavoriteAnime extends AnimeUserPayload {
  addedAt: number;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService extends UserListBase<FavoriteAnime> {
  protected override readonly collectionName = 'favorites';

  // API pública: alias semánticos sobre la clase base
  readonly favorites = this.items;
  isFavorite(id: number) { return this.has(id); }

  protected override sort(items: FavoriteAnime[]): FavoriteAnime[] {
    return [...items].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
  }

  protected override buildPayload(anime: AnimeUserPayload): FavoriteAnime {
    return { ...anime, addedAt: Date.now() };
  }
}
