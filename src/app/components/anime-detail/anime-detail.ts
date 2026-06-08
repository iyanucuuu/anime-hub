import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JikanApi } from '../../services/jikan-api';
import { FavoritesService } from '../../services/favorites';
import { WatchedService } from '../../services/watched';
import { WatchLaterService } from '../../services/watchlater';
import { getAirStatus, airStatusLabel } from '../../services/broadcast';
import { Anime, AnimeCharacter, AnimeUserPayload } from '../../models/anime.models';
import { SkeletonDetail } from '../skeleton-card/skeleton-detail';

@Component({
  selector: 'app-anime-detail',
  imports: [SkeletonDetail],
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.css',
})
export class AnimeDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private api = inject(JikanApi);
  private destroyRef = inject(DestroyRef);
  favoritesService = inject(FavoritesService);
  watchedService = inject(WatchedService);
  watchLaterService = inject(WatchLaterService);

  anime = signal<Anime | null>(null);
  characters = signal<AnimeCharacter[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getAnimeById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.anime.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la información de este anime.');
          this.loading.set(false);
        }
      });

    this.api.getAnimeCharacters(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.characters.set(res.data.slice(0, 12))
      });
  }

  private animePayload(): AnimeUserPayload {
    const a = this.anime()!;
    return {
      mal_id: a.mal_id,
      title: a.title_english ?? a.title,
      images: a.images,
      score: a.score,
      status: a.status ?? undefined,
      broadcast: a.broadcast ?? undefined,
    };
  }

  get airLabel() {
    const a = this.anime();
    if (!a) return null;
    const status = getAirStatus(a.status, a.broadcast);
    if (status === 'not-airing' || status === 'unknown') return null;
    return airStatusLabel(status);
  }

  toggleFavorite() {
    if (this.anime()) this.favoritesService.toggle(this.animePayload());
  }

  toggleWatched() {
    if (this.anime()) this.watchedService.toggle(this.animePayload());
  }

  toggleWatchLater() {
    if (this.anime()) this.watchLaterService.toggle(this.animePayload());
  }

  goBack() {
    this.location.back();
  }
}
