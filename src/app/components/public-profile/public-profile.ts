import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getDoc, getDocs, collection, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AuthService } from '../../services/auth';
import { FriendsService } from '../../services/friends';
import { SeoService } from '../../services/seo';
import { AnimeUserPayload } from '../../models/anime.models';

interface PublicUser {
  uid: string;
  displayName: string;
  photoURL: string;
  joinedAt: number;
  bio?: string;
  country?: string;
  favoriteAnime?: string;
  favoriteGenre?: string;
}

type ProfileTab = 'favoritos' | 'vistos' | 'viendo' | 'pendientes';

@Component({
  selector: 'app-public-profile',
  imports: [RouterLink],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.css',
})
export class PublicProfile implements OnInit {
  private route   = inject(ActivatedRoute);
  auth            = inject(AuthService);
  friendsService  = inject(FriendsService);
  private seo     = inject(SeoService);

  user     = signal<PublicUser | null>(null);
  loading  = signal(true);
  notFound = signal(false);

  activeTab = signal<ProfileTab>('favoritos');
  favs      = signal<AnimeUserPayload[]>([]);
  watched   = signal<AnimeUserPayload[]>([]);
  watching  = signal<AnimeUserPayload[]>([]);
  pending   = signal<AnimeUserPayload[]>([]);

  ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid') ?? '';
    this.loadProfile(uid);
  }

  private async loadProfile(uid: string) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) { this.notFound.set(true); this.loading.set(false); return; }

      const u = snap.data() as PublicUser;
      this.user.set(u);
      this.seo.set({
        title: u.displayName,
        description: u.bio ? `${u.bio} — Perfil en AnimeHub` : `Perfil de ${u.displayName} en AnimeHub`,
      });

      const [favSnap, watchedSnap, watchingSnap, pendingSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'favorites')),
        getDocs(collection(db, 'users', uid, 'watched')),
        getDocs(collection(db, 'users', uid, 'watching')),
        getDocs(collection(db, 'users', uid, 'watchlater')),
      ]);

      this.favs.set(favSnap.docs.map(d => d.data() as AnimeUserPayload));
      this.watched.set(watchedSnap.docs.map(d => d.data() as AnimeUserPayload));
      this.watching.set(watchingSnap.docs.map(d => d.data() as AnimeUserPayload));
      this.pending.set(pendingSnap.docs.map(d => d.data() as AnimeUserPayload));
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  get isOwnProfile(): boolean {
    return this.auth.user()?.uid === this.user()?.uid;
  }

  get friendStatus() {
    const uid = this.user()?.uid;
    return uid ? this.friendsService.friendshipStatus(uid) : 'none';
  }

  async addFriend() {
    const uid = this.user()?.uid;
    if (uid) await this.friendsService.sendRequest(uid);
  }

  get totalAnime(): number {
    return new Set([
      ...this.favs().map(a => a.mal_id),
      ...this.watched().map(a => a.mal_id),
      ...this.watching().map(a => a.mal_id),
      ...this.pending().map(a => a.mal_id),
    ]).size;
  }

  joinDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  avatarFallback(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=FF2D55&color=fff&bold=true&size=128`;
  }

  onAvatarError(ev: Event, name: string) {
    (ev.target as HTMLImageElement).src = this.avatarFallback(name);
  }

  get shareUrl(): string {
    return typeof window !== 'undefined' ? window.location.href : '';
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareUrl).catch(() => {});
  }
}
