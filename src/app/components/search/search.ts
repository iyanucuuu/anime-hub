import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JikanApi } from '../../services/jikan-api';
import { AnimeCardComponent } from '../anime-card/anime-card';
import { SkeletonCard } from '../skeleton-card/skeleton-card';
import { dedupByFranchise } from '../../services/dedup';
import { Anime } from '../../models/anime.models';

@Component({
  selector: 'app-search',
  imports: [FormsModule, AnimeCardComponent, SkeletonCard],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search implements OnInit {
  private api = inject(JikanApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private search$ = new Subject<{ query: string; type: 'tv' | 'movie' | 'all' }>();

  query = '';
  activeType = signal<'tv' | 'movie' | 'all'>('tv');
  results = signal<Anime[]>([]);
  loading = signal(false);
  searched = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // Escucha cambios en queryParams (navegación desde otras páginas)
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['q']) {
          this.query = params['q'];
          this.emitSearch();
        }
      });

    // Pipeline con debounce: evita peticiones en cada pulsación
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged((a, b) => a.query === b.query && a.type === b.type),
        switchMap(({ query, type }) => {
          this.loading.set(true);
          this.error.set(null);
          return type === 'tv'
            ? this.api.searchAnime(query)
            : this.api.searchAnimeAll(query);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.results.set(dedupByFranchise(res.data));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Error al buscar. Comprueba tu conexión e inténtalo de nuevo.');
          this.loading.set(false);
        }
      });
  }

  search() {
    if (this.query.trim()) {
      this.router.navigate([], {
        queryParams: { q: this.query.trim() },
        queryParamsHandling: 'merge',
      });
      this.emitSearch();
    }
  }

  selectType(type: 'tv' | 'movie' | 'all') {
    this.activeType.set(type);
    if (this.searched()) this.emitSearch();
  }

  private emitSearch() {
    this.searched.set(true);
    this.search$.next({ query: this.query.trim(), type: this.activeType() });
  }

  goToAnime(id: number) {
    this.router.navigate(['/anime', id]);
  }
}
