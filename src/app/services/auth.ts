import { Injectable, signal } from '@angular/core';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * undefined → Firebase aún no ha resuelto el estado inicial
   * null      → resuelto, usuario no autenticado
   * User      → resuelto, usuario autenticado
   */
  readonly user = signal<User | null | undefined>(undefined);

  constructor() {
    onAuthStateChanged(auth, u => this.user.set(u));
  }

  async loginWithGoogle() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async logout() {
    await signOut(auth);
  }
}
