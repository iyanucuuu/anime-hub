import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FriendsService } from '../../services/friends';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  auth = inject(AuthService);
  friends = inject(FriendsService);
  theme = inject(ThemeService);

  get pendingRequests(): number {
    return this.friends.incomingRequests().length;
  }

  /** Avatar de respaldo con las iniciales del usuario. */
  avatarFallback(name?: string | null): string {
    const initials = encodeURIComponent(name?.trim() || 'U');
    return `https://ui-avatars.com/api/?name=${initials}&background=7c4dff&color=fff&bold=true`;
  }

  /** Las fotos de perfil de Google a veces fallan al cargar (bloqueo por referrer); si pasa, usamos el respaldo. */
  onAvatarError(event: Event, name?: string | null) {
    (event.target as HTMLImageElement).src = this.avatarFallback(name);
  }
}
