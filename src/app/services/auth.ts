import { Injectable, signal, inject } from '@angular/core';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * undefined → Firebase aún no ha resuelto el estado inicial
   * null      → resuelto, usuario no autenticado
   * User      → resuelto, usuario autenticado
   */
  readonly user = signal<User | null | undefined>(undefined);

  constructor() {
    onAuthStateChanged(auth, u => {
      this.user.set(u);
      // Sincroniza el perfil público cada vez que el usuario inicia sesión
      if (u) this.upsertPublicProfile(u);
    });
  }

  async loginWithGoogle() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async logout() {
    await signOut(auth);
  }

  /** Escribe/actualiza el perfil público del usuario en Firestore (colección `users`). */
  private async upsertPublicProfile(u: User): Promise<void> {
    await setDoc(doc(db, 'users', u.uid), {
      uid: u.uid,
      displayName: u.displayName ?? 'Anónimo',
      photoURL: u.photoURL ?? '',
      joinedAt: Date.now(),
    }, { merge: true });
  }
}
