import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites';
import { AnimeCardComponent } from '../anime-card/anime-card';

@Component({
  selector: 'app-favorites',
  imports: [AnimeCardComponent],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites {
  favoritesService = inject(FavoritesService);
  private router = inject(Router);

  goToAnime(id: number) {
    this.router.navigate(['/anime', id]);
  }
}
