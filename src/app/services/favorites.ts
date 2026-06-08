import { Injectable } from '@angular/core';
import { AnimeUserPayload } from '../models/anime.models';
import { UserListBase } from './user-list.base';

export type FavoriteAnime = AnimeUserPayload;

@Injectable({ providedIn: 'root' })
export class FavoritesService extends UserListBase<FavoriteAnime> {
  protected override readonly collectionName = 'favorites';

  // API pública: alias semánticos sobre la clase base
  readonly favorites = this.items;
  isFavorite(id: number) { return this.has(id); }

  protected override buildPayload(anime: AnimeUserPayload): FavoriteAnime {
    return { ...anime };
  }
}
