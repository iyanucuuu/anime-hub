import { Component, signal, computed, effect, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AuthService } from '../../services/auth';
import { FavoritesService } from '../../services/favorites';
import { WatchedService } from '../../services/watched';
import { WatchLaterService } from '../../services/watchlater';
import { WatchingService, WatchingAnime } from '../../services/watching';
import { ReviewsService } from '../../services/reviews';
import { FriendsService } from '../../services/friends';
import { getAirStatus, airStatusLabel, AirStatus, BroadcastInfo } from '../../services/broadcast';
import { AnimeUserPayload, AnimeImages } from '../../models/anime.models';

export interface ExtendedProfile {
  bio: string;
  country: string;
  favoriteAnime: string;
  favoriteGenre: string;
}

type Tab = 'semana' | 'favoritos' | 'vistos' | 'pendientes' | 'viendo' | 'actividad';

interface AiringAnime extends AnimeUserPayload {
  status: AirStatus;
  label: { emoji: string; text: string; color: string };
  broadcast?: BroadcastInfo;
  source: 'favorito' | 'visto' | 'pendiente';
}

type ActivityKind = 'favorito' | 'visto' | 'pendiente' | 'viendo';

interface ActivityEntry {
  mal_id: number;
  title: string;
  images: AnimeImages;
  kind: ActivityKind;
  timestamp: number;
  detail?: string;
}

@Component({
  selector: 'app-account',
  imports: [RouterLink, FormsModule, DatePipe],
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

  filteredWatching = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.watching.watching();
    return this.watching.watching().filter(a => a.title.toLowerCase().includes(q));
  });

  /**
   * Línea de tiempo de actividad: une los movimientos en tus listas (favoritos, vistos,
   * pendientes y progreso de lo que estás viendo) en un único feed cronológico.
   */
  activity = computed<ActivityEntry[]>(() => {
    const entries: ActivityEntry[] = [];

    for (const a of this.favs.favorites()) {
      entries.push({
        mal_id: a.mal_id, title: a.title, images: a.images,
        kind: 'favorito', timestamp: a.addedAt ?? 0,
      });
    }
    for (const a of this.watched.watched()) {
      entries.push({
        mal_id: a.mal_id, title: a.title, images: a.images,
        kind: 'visto', timestamp: a.watchedAt ?? 0,
      });
    }
    for (const a of this.watchLater.list()) {
      entries.push({
        mal_id: a.mal_id, title: a.title, images: a.images,
        kind: 'pendiente', timestamp: a.addedAt ?? 0,
      });
    }
    for (const a of this.watching.watching()) {
      entries.push({
        mal_id: a.mal_id, title: a.title, images: a.images,
        kind: 'viendo', timestamp: a.updatedAt ?? 0,
        detail: `Episodio ${a.progress}${a.episodes ? ' / ' + a.episodes : ''}`,
      });
    }

    return entries
      .filter(e => e.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 40);
  });

  // ─── Editar perfil ────────────────────────────────────────────────────────
  showEditProfile = signal(false);
  editBio = signal('');
  editCountry = signal('');
  editFavoriteAnime = signal('');
  editFavoriteGenre = signal('');
  editSaving = signal(false);
  /** Perfil extendido cargado desde Firestore */
  extendedProfile = signal<ExtendedProfile | null>(null);

  openEditProfile() {
    // Mostrar el modal inmediatamente con los datos cacheados
    const cached = this.extendedProfile();
    this.editBio.set(cached?.bio ?? '');
    this.editCountry.set(cached?.country ?? '');
    this.editFavoriteAnime.set(cached?.favoriteAnime ?? '');
    this.editFavoriteGenre.set(cached?.favoriteGenre ?? '');
    this.showEditProfile.set(true);
  }

  async saveProfile() {
    const uid = this.auth.user()?.uid;
    if (!uid || this.editSaving()) return;

    // Validación de longitud
    if (this.editBio().length > 300 ||
        this.editCountry().length > 60 ||
        this.editFavoriteAnime().length > 100 ||
        this.editFavoriteGenre().length > 60) {
      return; // El HTML ya muestra maxlength, esto es una defensa extra
    }

    this.editSaving.set(true);
    await setDoc(doc(db, 'users', uid), {
      bio: this.editBio().trim().slice(0, 300),
      country: this.editCountry().trim().slice(0, 60),
      favoriteAnime: this.editFavoriteAnime().trim().slice(0, 100),
      favoriteGenre: this.editFavoriteGenre().trim().slice(0, 60),
    }, { merge: true });
    this.extendedProfile.set({
      bio: this.editBio().trim(),
      country: this.editCountry().trim(),
      favoriteAnime: this.editFavoriteAnime().trim(),
      favoriteGenre: this.editFavoriteGenre().trim(),
    });
    this.editSaving.set(false);
    this.showEditProfile.set(false);
  }

  async loadExtendedProfile() {
    const uid = this.auth.user()?.uid;
    if (!uid) return;
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data() as any;
    if (data) {
      this.extendedProfile.set({
        bio: data.bio ?? '',
        country: data.country ?? '',
        favoriteAnime: data.favoriteAnime ?? '',
        favoriteGenre: data.favoriteGenre ?? '',
      });
    }
  }

  private route = inject(ActivatedRoute);

  constructor(
    public auth: AuthService,
    public favs: FavoritesService,
    public watched: WatchedService,
    public watchLater: WatchLaterService,
    public watching: WatchingService,
    public reviews: ReviewsService,
    public friends: FriendsService,
  ) {
    // Carga el perfil extendido cada vez que el usuario inicia sesión
    effect(() => {
      if (this.auth.user()) this.loadExtendedProfile();
    });

    // Activa la pestaña correcta si viene con ?tab=amigos desde el navbar
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['semana','amigos','favoritos','vistos','pendientes','viendo','actividad'].includes(params['tab'])) {
        this.activeTab.set(params['tab'] as Tab);
      }
    });
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  get bestScore(): string {
    const favs = this.favs.favorites();
    if (!favs.length) return '—';
    return Math.max(...favs.map(f => f.score ?? 0)).toFixed(1);
  }

  // ─── Estadísticas avanzadas ────────────────────────────────────────────────

  /** Total de animes únicos en todas las listas. */
  get totalUniqueAnime(): number {
    return new Set([
      ...this.favs.favorites().map(a => a.mal_id),
      ...this.watched.watched().map(a => a.mal_id),
      ...this.watching.watching().map(a => a.mal_id),
      ...this.watchLater.list().map(a => a.mal_id),
    ]).size;
  }

  /** Episodios totales estimados (suma de episodios en la lista "Visto"). */
  get estimatedEpisodesWatched(): number {
    return this.watched.watched().reduce((sum, a) => sum + (a.episodes ?? 0), 0);
  }

  /** Nota media de las propias reseñas. */
  get avgOwnRating(): string {
    const myReviews = this.reviews.communityFeed().filter(r => r.userId === this.auth.user()?.uid);
    if (!myReviews.length) return '—';
    const avg = myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length;
    return avg.toFixed(1);
  }

  /** Número de reseñas escritas. */
  get ownReviewCount(): number {
    return this.reviews.communityFeed().filter(r => r.userId === this.auth.user()?.uid).length;
  }

  /** URL del perfil público compartible. */
  get publicProfileUrl(): string {
    const uid = this.auth.user()?.uid;
    return uid ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${uid}` : '';
  }

  copyProfileLink() {
    if (this.publicProfileUrl) navigator.clipboard.writeText(this.publicProfileUrl).catch(() => {});
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
    return source === 'favorito' ? '♥' : source === 'visto' ? '✓' : '○';
  }

  /** Sube o baja el episodio actual de un anime en la lista "Viendo", sin salir de la cuenta. */
  adjustProgress(anime: WatchingAnime, delta: number) {
    const next = anime.progress + delta;
    this.watching.setProgress(anime, next);
  }

  activityIcon(kind: ActivityKind): string {
    switch (kind) {
      case 'favorito': return '♥';
      case 'visto': return '✓';
      case 'pendiente': return '○';
      case 'viendo': return '▶';
    }
  }

  activityText(entry: ActivityEntry): string {
    switch (entry.kind) {
      case 'favorito': return 'Añadido a favoritos';
      case 'visto': return 'Marcado como visto';
      case 'pendiente': return 'Añadido a pendientes';
      case 'viendo': return `En curso · ${entry.detail}`;
    }
  }

  /** Fecha relativa ("hace 3 horas", "hace 2 días"...) para el feed de actividad. */
  relativeTime(ts: number): string {
    const diffMs = Date.now() - ts;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'ahora mismo';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days} d`;
    return this.formatDate(ts);
  }

  progressPercent(progress: number, episodes: number | null): number {
    if (!episodes) return 0;
    return Math.min(100, Math.round((progress / episodes) * 100));
  }

  ratingLabel(r: number): string {
    if (r <= 2) return 'Malo';
    if (r <= 4) return 'Regular';
    if (r <= 6) return 'Bien';
    if (r <= 8) return 'Muy bien';
    return 'Obra maestra';
  }

  /** Avatar de respaldo con las iniciales del usuario, por si no hay foto o la de Google falla al cargar. */
  avatarFallback(name?: string | null): string {
    const initials = encodeURIComponent(name?.trim() || 'U');
    return `https://ui-avatars.com/api/?name=${initials}&background=FF2D55&color=fff&bold=true`;
  }

  /** Las fotos de perfil de Google a veces fallan al cargar (bloqueo por referrer); si pasa, usamos el respaldo. */
  onAvatarError(event: Event, name?: string | null) {
    (event.target as HTMLImageElement).src = this.avatarFallback(name);
  }
}
