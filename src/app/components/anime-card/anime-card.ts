import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Anime } from '../../models/anime.models';

@Component({
  selector: 'app-anime-card',
  imports: [],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.css',
})
export class AnimeCardComponent {
  @Input() anime!: Anime;
  @Output() clicked = new EventEmitter<number>();
}
