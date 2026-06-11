import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JikanApi } from '../../services/jikan-api';
import { dedupByFranchise } from '../../services/dedup';
import { AnimeCardComponent } from '../anime-card/anime-card';
import { SkeletonCard } from '../skeleton-card/skeleton-card';
import { SeoService } from '../../services/seo';
import { RecommendationsService } from '../../services/recommendations';
import { AuthService } from '../../services/auth';
import { FavoritesService } from '../../services/favorites';
import { WatchedService } from '../../services/watched';
import { WatchLaterService } from '../../services/watchlater';
import { WatchingService } from '../../services/watching';
import { Anime } from '../../models/anime.models';

@Component({
  selector: 'app-home',
  imports: [FormsModule, AnimeCardComponent, SkeletonCard, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private api = inject(JikanApi);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private seo = inject(SeoService);
  recommendations = inject(RecommendationsService);
  auth = inject(AuthService);
  favorites = inject(FavoritesService);
  watched = inject(WatchedService);
  watchlater = inject(WatchLaterService);
  watching = inject(WatchingService);

  query = '';
  seasonal = signal<Anime[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly currentSeason = (() => {
    const m = new Date().getMonth();
    const y = new Date().getFullYear();
    const name = m < 3 ? 'Invierno' : m < 6 ? 'Primavera' : m < 9 ? 'Verano' : 'Otoño';
    return `${name} ${y}`;
  })();

  ngOnInit() {
    this.seo.set({ title: 'Inicio', description: 'Anime de la temporada actual — descubre novedades y busca tus series favoritas.' });
    // Cargar recomendaciones si hay sesión activa
    if (this.auth.user()) this.recommendations.load();
    this.api.getSeasonNow()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.seasonal.set(dedupByFranchise(res.data));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la temporada actual. Inténtalo de nuevo.');
          this.loading.set(false);
        }
      });
  }

  retry() {
    this.error.set(null);
    this.loading.set(true);
    this.ngOnInit();
  }

  search() {
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query.trim() } });
    }
  }

  goToAnime(id: number) {
    this.router.navigate(['/anime', id]);
  }
}
