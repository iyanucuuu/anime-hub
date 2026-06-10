import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { Anime } from '../../models/anime.models';
import { WatchingService } from '../../services/watching';

@Component({
  selector: 'app-anime-card',
  imports: [],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.css',
})
export class AnimeCardComponent {
  @Input() anime!: Anime;
  @Output() clicked = new EventEmitter<number>();

  private watching = inject(WatchingService);

  get progress(): number { return this.watching.progressOf(this.anime?.mal_id); }
  get isWatching(): boolean { return this.watching.isWatching(this.anime?.mal_id); }
  get totalEps(): number | null { return this.anime?.episodes ?? null; }
  get progressPct(): number {
    if (!this.totalEps || !this.progress) return 0;
    return Math.min(100, Math.round((this.progress / this.totalEps) * 100));
  }
}
