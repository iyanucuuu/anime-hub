import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Home } from './components/home/home';
import { Search } from './components/search/search';
import { AnimeDetail } from './components/anime-detail/anime-detail';
import { Rankings } from './components/rankings/rankings';
import { Favorites } from './components/favorites/favorites';
import { Account } from './components/account/account';
import { FriendsPage } from './components/friends-page/friends-page';
import { FeedPage } from './components/feed/feed';
import { PublicProfile } from './components/public-profile/public-profile';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',           component: Landing },
  { path: 'home',       component: Home },
  { path: 'search',     component: Search },
  { path: 'anime/:id',  component: AnimeDetail },
  { path: 'rankings',   component: Rankings },
  { path: 'favorites',  component: Favorites,   canActivate: [authGuard] },
  { path: 'account',    component: Account,     canActivate: [authGuard] },
  { path: 'amigos',     component: FriendsPage, canActivate: [authGuard] },
  { path: 'feed',       component: FeedPage,    canActivate: [authGuard] },
  { path: 'u/:uid',     component: PublicProfile },
  { path: '**', redirectTo: '' }
];
