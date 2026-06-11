import { Component, signal, inject, OnDestroy, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivityService, ActivityEvent, ACTIVITY_LABELS } from '../../services/activity';
import { FriendsService } from '../../services/friends';
import { AuthService } from '../../services/auth';
import { SeoService } from '../../services/seo';

@Component({
  selector: 'app-feed',
  imports: [RouterLink],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class FeedPage implements OnDestroy {
  private activityService = inject(ActivityService);
  private friendsService  = inject(FriendsService);
  auth = inject(AuthService);
  private seo = inject(SeoService);

  events  = signal<ActivityEvent[]>([]);
  loading = signal(true);

  private unsub?: () => void;

  constructor() {
    this.seo.set({ title: 'Feed de amigos', description: 'Qué están viendo y reseñando tus amigos.' });

    // Re-arranca el feed cada vez que cambia el usuario o sus amigos
    effect(() => {
      const uid = this.auth.user()?.uid;
      const friendIds = [...this.friendsService.friendIds()];
      const ids = uid ? [uid, ...friendIds] : friendIds;

      this.unsub?.();
      this.loading.set(true);

      if (ids.length === 0) {
        this.events.set([]);
        this.loading.set(false);
        return;
      }

      this.unsub = this.activityService.watchFriendsFeed(ids, evs => {
        this.events.set(evs);
        this.loading.set(false);
      });
    });
  }

  ngOnDestroy() {
    this.unsub?.();
  }

  label(type: ActivityEvent['type']) { return ACTIVITY_LABELS[type]; }

  relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'ahora mismo';
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `hace ${d} d`;
    return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  avatarFallback(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=FF2D55&color=fff&bold=true`;
  }

  onAvatarError(ev: Event, name: string) {
    (ev.target as HTMLImageElement).src = this.avatarFallback(name);
  }
}
