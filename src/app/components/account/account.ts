import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { FavoritesService } from '../../services/favorites';
import { WatchedService } from '../../services/watched';
import { WatchLaterService } from '../../services/watchlater';
import { getAirStatus, airStatusLabel, AirStatus, BroadcastInfo } from '../../services/broadcast';
import { AnimeUserPayload } from '../../models/anime.models';

type Tab = 'semana' | 'favoritos' | 'vistos' | 'pendientes' | 'actividad';

interface AiringAnime extends AnimeUserPayload {
  status: AirStatus;
  label: { emoji: string; text: string; color: string };
  broadcast?: BroadcastInfo;
  source: 'favorito' | 'visto' | 'pendiente';
}

@Component({
  selector: 'app-account',
  imports: [RouterLink, FormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  activeTab = signal<Tab>('semana');
  searchQuery = signal('');

  airingThisWeek = computed<AiringAnime[]>(() => {
    const results: AiringAnime[] = [];
    const seen = new Set<number>();
    const order: AirStatus[] = ['today', 'tomorrow', 'this-week'];

    const process = (animes: AnimeUserPayload[], source: AiringAnime['source']) => {
      for (const a of animes) {
        if (seen.has(a.mal_id)) continue;
        const status = getAirStatus(a.status, a.broadcast);
        if (status === 'not-airing' || status === 'unknown') continue;
        seen.add(a.mal_id);
        results.push({ ...a, status, label: airStatusLabel(status), source });
      }
    };

    process(this.favs.favorites(), 'favorito');
    process(this.watched.watched(), 'visto');
    process(this.watchLater.list(), 'pendiente');

    return results.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  });

  filteredWatched = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.watched.watched();
    return this.watched.watched().filter(a => a.title.toLowerCase().includes(q));
  });

  filteredPending = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.watchLater.list();
    return this.watchLater.list().filter(a => a.title.toLowerCase().includes(q));
  });

  constructor(
    public auth: AuthService,
    public favs: FavoritesService,
    public watched: WatchedService,
    public watchLater: WatchLaterService
  ) {}

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  get bestScore(): string {
    const favs = this.favs.favorites();
    if (!favs.length) return '—';
    return Math.max(...favs.map(f => f.score)).toFixed(1);
  }

  get joinDate(): string {
    const u = this.auth.user();
    if (!u?.metadata?.creationTime) return '—';
    return new Date(u.metadata.creationTime).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  sourceLabel(source: AiringAnime['source']): string {
    return source === 'favorito' ? '❤️' : source === 'visto' ? '✅' : '🕐';
  }
}
