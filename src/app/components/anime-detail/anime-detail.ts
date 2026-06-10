import { Component, DestroyRef, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JikanApi } from '../../services/jikan-api';
import { SeoService } from '../../services/seo';
import { FavoritesService } from '../../services/favorites';
import { WatchedService } from '../../services/watched';
import { WatchLaterService } from '../../services/watchlater';
import { WatchingService } from '../../services/watching';
import { ReviewsService } from '../../services/reviews';
import { FriendsService } from '../../services/friends';
import { AuthService } from '../../services/auth';
import { getAirStatus, airStatusLabel } from '../../services/broadcast';
import { Anime, AnimeCharacter, AnimeUserPayload } from '../../models/anime.models';
import { SkeletonDetail } from '../skeleton-card/skeleton-detail';
import { computed } from '@angular/core';

@Component({
  selector: 'app-anime-detail',
  imports: [SkeletonDetail, FormsModule, DatePipe],
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.css',
})
export class AnimeDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private api = inject(JikanApi);
  private seo = inject(SeoService);
  private destroyRef = inject(DestroyRef);
  favoritesService = inject(FavoritesService);
  watchedService = inject(WatchedService);
  watchLaterService = inject(WatchLaterService);
  watchingService = inject(WatchingService);
  reviewsService = inject(ReviewsService);
  friendsService = inject(FriendsService);
  auth = inject(AuthService);

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  activeTab = signal<'info' | 'personajes' | 'resenas' | 'amigos'>('info');

  /** Reseñas de amigos para este anime. */
  friendReviews = computed(() => {
    const ids = this.friendsService.friendIds();
    return this.reviewsService.animeReviews().filter(r => ids.has(r.userId));
  });

  anime = signal<Anime | null>(null);
  characters = signal<AnimeCharacter[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // ─── Reseñas ──────────────────────────────────────────────────────────────
  reviewRating = signal(8);
  reviewText = signal('');
  reviewSubmitting = signal(false);
  reviewError = signal<string | null>(null);
  showReviewForm = signal(false);

  private unsubReviews?: () => void;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getAnimeById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.anime.set(res.data);
          this.loading.set(false);
          const a = res.data;
          this.seo.set({
            title: a.title_english ?? a.title,
            description: a.synopsis?.slice(0, 155) ?? undefined,
            image: a.images?.jpg?.large_image_url,
          });
          // Arrancar suscripción a reseñas una vez que conocemos el anime
          this.unsubReviews = this.reviewsService.watchAnimeReviews(id);
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

  ngOnDestroy() {
    this.unsubReviews?.();
  }

  private animePayload(): AnimeUserPayload {
    const a = this.anime()!;
    const genres = [
      ...(a.genres ?? []),
      ...(a.themes ?? []),
    ].map(g => g.name).filter(Boolean);
    return {
      mal_id: a.mal_id,
      title: a.title_english ?? a.title,
      images: a.images,
      score: a.score,
      status: a.status,
      broadcast: a.broadcast ?? undefined,
      episodes: a.episodes ?? null,
      genreNames: genres.length ? genres : undefined,
    };
  }

  /** Progreso actual guardado para este anime (0 si no está en "Viendo"). */
  get watchingProgress(): number {
    const a = this.anime();
    return a ? this.watchingService.progressOf(a.mal_id) : 0;
  }

  get totalEpisodes(): number | null {
    return this.anime()?.episodes ?? null;
  }

  get airLabel() {
    const a = this.anime();
    if (!a) return null;
    const status = getAirStatus(a.status, a.broadcast);
    if (status === 'not-airing' || status === 'unknown') return null;
    return airStatusLabel(status);
  }

  toggleFavorite() { if (this.anime()) this.favoritesService.toggle(this.animePayload()); }
  toggleWatched()  { if (this.anime()) this.watchedService.toggle(this.animePayload()); }
  toggleWatchLater() { if (this.anime()) this.watchLaterService.toggle(this.animePayload()); }
  toggleWatching() { if (this.anime()) this.watchingService.toggle(this.animePayload()); }

  adjustProgress(delta: number) {
    const a = this.anime();
    if (!a) return;
    this.watchingService.setProgress(this.animePayload(), this.watchingProgress + delta);
  }

  // ─── Reseñas ──────────────────────────────────────────────────────────────

  openReviewForm() {
    const existing = this.reviewsService.myReview();
    if (existing) {
      this.reviewRating.set(existing.rating);
      this.reviewText.set(existing.text);
    } else {
      this.reviewRating.set(8);
      this.reviewText.set('');
    }
    this.showReviewForm.set(true);
  }

  async submitReview() {
    const a = this.anime();
    if (!a || this.reviewSubmitting()) return;
    if (!this.reviewText().trim()) {
      this.reviewError.set('Escribe algo en tu reseña antes de publicar.');
      return;
    }
    this.reviewSubmitting.set(true);
    this.reviewError.set(null);
    try {
      await this.reviewsService.saveReview({
        mal_id: a.mal_id,
        animeTitle: a.title_english ?? a.title,
        animeImages: a.images,
        rating: this.reviewRating(),
        text: this.reviewText(),
      });
      this.showReviewForm.set(false);
    } catch {
      this.reviewError.set('Error al guardar la reseña. Inténtalo de nuevo.');
    } finally {
      this.reviewSubmitting.set(false);
    }
  }

  async deleteReview() {
    const a = this.anime();
    if (!a) return;
    await this.reviewsService.deleteReview(a.mal_id);
    this.showReviewForm.set(false);
  }

  /** Devuelve un array de 10 posiciones para las estrellas del selector de nota. */
  readonly ratingStars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  ratingLabel(r: number): string {
    if (r <= 2) return 'Malo';
    if (r <= 4) return 'Regular';
    if (r <= 6) return 'Bien';
    if (r <= 8) return 'Muy bien';
    return 'Obra maestra';
  }

  avatarFallback(name?: string | null): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name?.trim() || 'U')}&background=7c4dff&color=fff&bold=true`;
  }

 