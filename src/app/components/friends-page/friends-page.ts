import { Component, signal, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FriendsService, UserProfile } from '../../services/friends';
import { AuthService } from '../../services/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

type ProfileTab = 'favoritos' | 'vistos' | 'viendo' | 'pendientes';

export interface ExtendedUserProfile extends UserProfile {
  bio?: string;
  country?: string;
  favoriteAnime?: string;
  favoriteGenre?: string;
}

type FriendsTab = 'amigos' | 'recibidas' | 'enviadas';

// Paleta de gradientes para las cabeceras de las tarjetas
const CARD_GRADIENTS = [
  ['#FF2D55', '#FFB627'],
  ['#00b4d8', '#0077b6'],
  ['#ff6b6b', '#ee0979'],
  ['#11998e', '#38ef7d'],
  ['#f7971e', '#ffd200'],
  ['#c471ed', '#12c2e9'],
  ['#f64f59', '#c471ed'],
  ['#4facfe', '#00f2fe'],
];

@Component({
  selector: 'app-friends-page',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './friends-page.html',
  styleUrl: './friends-page.css',
})
export class FriendsPage {
  friendsService = inject(FriendsService);
  auth = inject(AuthService);

  activeTab = signal<FriendsTab>('amigos');

  searchQuery = signal('');
  searchResults = signal<ExtendedUserProfile[]>([]);
  searchLoading = signal(false);
  searchDone = signal(false);

  friendProfiles = signal<ExtendedUserProfile[]>([]);
  profilesLoading = signal(true);

  incomingCount = computed(() => this.friendsService.incomingRequests().length);
  outgoingCount = computed(() => this.friendsService.outgoingRequests().length);

  selectedFriend = signal<ExtendedUserProfile | null>(null);
  profileTab = signal<ProfileTab>('favoritos');
  friendDataLoading = signal(false);
  friendFavs    = signal<any[]>([]);
  friendWatched = signal<any[]>([]);
  friendWatching = signal<any[]>([]);
  friendPending = signal<any[]>([]);

  async openProfile(f: ExtendedUserProfile) {
    this.selectedFriend.set(f);
    this.profileTab.set('favoritos');
    this.friendDataLoading.set(true);
    this.friendFavs.set([]);
    this.friendWatched.set([]);
    this.friendWatching.set([]);
    this.friendPending.set([]);
    try {
      const [favs, watched, watching, pending] = await Promise.all([
        getDocs(collection(db, 'users', f.uid, 'favorites')),
        getDocs(collection(db, 'users', f.uid, 'watched')),
        getDocs(collection(db, 'users', f.uid, 'watching')),
        getDocs(collection(db, 'users', f.uid, 'watchlater')),
      ]);
      this.friendFavs.set(favs.docs.map(d => d.data()));
      this.friendWatched.set(watched.docs.map(d => d.data()));
      this.friendWatching.set(watching.docs.map(d => d.data()));
      this.friendPending.set(pending.docs.map(d => d.data()));
    } catch (e) {
      console.warn('[FriendsPage] No se pudo cargar el perfil del amigo:', e);
    }
    this.friendDataLoading.set(false);
  }

  closeProfile() { this.selectedFriend.set(null); }

  cancellingUids = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const friends = this.friendsService.friends();
      this.loadFriendProfiles(friends);
    });
  }

  async loadFriendProfiles(friends?: UserProfile[]) {
    this.profilesLoading.set(true);
    const list = friends ?? this.friendsService.friends();
    const extended = await Promise.all(list.map(f => this.fetchExtended(f)));
    this.friendProfiles.set(extended);
    this.profilesLoading.set(false);
  }

  private async fetchExtended(base: UserProfile): Promise<ExtendedUserProfile> {
    try {
      const snap = await getDoc(doc(db, 'users', base.uid));
      const data = snap.data() as any;
      return { ...base, bio: data?.bio, country: data?.country, favoriteAnime: data?.favoriteAnime, favoriteGenre: data?.favoriteGenre };
    } catch { return base; }
  }

  /** Devuelve los dos colores del degradado asignado a este usuario */
  cardColors(name: string): [string, string] {
    const idx = (name?.charCodeAt(0) ?? 0) % CARD_GRADIENTS.length;
    return CARD_GRADIENTS[idx] as [string, string];
  }

  /** Degradado CSS para la cabecera de la tarjeta */
  cardGradient(name: string): string {
    const [a, b] = this.cardColors(name);
    return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
  }

  /** Color principal de la tarjeta (primer color del degradado) */
  cardAccent(name: string): string {
    return this.cardColors(name)[0];
  }

  async search() {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.searchLoading.set(true);
    this.searchDone.set(false);
    const results = await this.friendsService.searchUsers(q);
    const extended = await Promise.all(results.map(r => this.fetchExtended(r)));
    this.searchResults.set(extended);
    this.searchLoading.set(false);
    this.searchDone.set(true);
  }

  async sendRequest(uid: string) { await this.friendsService.sendRequest(uid); }
  async acceptRequest(id: string) { await this.friendsService.acceptRequest(id); }
  async rejectRequest(id: string) { await this.friendsService.rejectRequest(id); }

  async cancelRequest(id: string, toUid: string) {
    this.cancellingUids.update(s => new Set([...s, toUid]));
    await this.friendsService.rejectRequest(id);
    this.cancellingUids.update(s => { s.delete(toUid); return new Set(s); });
  }

  async removeFriend(uid: string) {
    await this.friendsService.removeFriend(uid);
    this.friendProfiles.update(list => list.filter(f => f.uid !== uid));
    if (this.selectedFriend()?.uid === uid) this.closeProfile();
  }

  status(uid: string) { return this.friendsService.friendshipStatus(uid); }

  avatarFallback(name?: string | null) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name?.trim() || 'U')}&background=7c4dff&color=fff&bold=true&size=128`;
  }

  onAvatarError(event: Event, name?: string | null) {
    (event.target as HTMLImageElement).src = this.avatarFallback(name);
  }

  joinLabel(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  joinDateFull(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  isCancelling(uid: string): boolean { return this.cancellingUids().has(uid); }

  /** Iniciales para mostrar en la tarjeta */
  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
