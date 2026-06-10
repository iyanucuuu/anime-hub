import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JikanApi } from '../../services/jikan-api';
import { AnimeCardComponent } from '../anime-card/anime-card';
import { SkeletonCard } from '../skeleton-card/skeleton-card';
import { dedupByFranchise } from '../../services/dedup';
import { Anime } from '../../models/anime.models';

const GENRES = [
  { id: 1,  name: 'Action' },
  { id: 2,  name: 'Adventure' },
  { id: 4,  name: 'Comedy' },
  { id: 8,  name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 7,  name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 42, name: 'Seinen' },
  { id: 27, name: 'Shounen' },
] as const;

@Component({
  selector: 'app-rankings',
  imports: [AnimeCardComponent, SkeletonCard],
  templateUrl: './rankings.html',
  styleUrl: './rankings.css',
})
export class Rankings implements OnInit {
  private api = inject(JikanApi);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  topAnime = signal<Anime[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  activeGenre = signal<number | null>(null);
  activeType = signal<'tv' | 'movie'>('tv');
  genres = GENRES;

  ngOnInit() {
    this.loadTop();
  }

  loadTop() {
    this.loading.set(true);
    this.error.set(null);
    this.topAnime.set([]);
    const type = this.activeType();
    const genreId = this.activeGenre();

    const request$ = genreId
      ? this.api.getTopByGenre(genreId, 1, type)
      : type === 'movie'
        ? this.api.getTopMovies()
        : this.api.getTopAnime();

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.topAnime.set(dedupByFranchise(res.data));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el ranking. Inténtalo de nuevo.');
          this.loading.set(false);
        }
      });
  }

  selectGenre(id: number | null) {
    this.activeGenre.set(id);
    this.loadTop();
  }

  selectType(type: 'tv' | 'movie') {
    this.activeType.set(type);
    this.loadTop();
  }

  get pageTitle(): string {
    const id = this.activeGenre();
    const type = this.activeType() === 'tv' ? 'Series' : 'Películas';
    if (!id) return `Top ${type}`;
    return (this.genres.find(g => g.id === id)?.name ?? '') + ` — Top ${type}`;
  }

  goToAnime(id: number) {
    this.router.navigate(['/anime', id]);
  }
}
