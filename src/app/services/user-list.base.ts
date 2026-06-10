import { signal, effect, inject } from '@angular/core';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { AuthService } from './auth';
import { ActivityService, ActivityType } from './activity';
import { AnimeUserPayload } from '../models/anime.models';

/**
 * Clase base para listas de anime del usuario en Firestore.
 * Gestiona la suscripción en tiempo real y el cleanup automático al cambiar de usuario.
 *
 * @template T  Tipo de item (extiende AnimeUserPayload con campos opcionales extra)
 */
export abstract class UserListBase<T extends AnimeUserPayload> {
  protected auth = inject(AuthService);
  private activity = inject(ActivityService);

  protected _items = signal<T[]>([]);
  readonly items = this._items.asReadonly();
  private unsub: (() => void) | null = null;

  /** Nombre de la subcolección en Firestore: "favorites" | "watched" | "watchlater" */
  protected abstract readonly collectionName: string;

  /** Ordena los items antes de guardarlos en el signal. Por defecto no reordena. */
  protected sort(items: T[]): T[] { return items; }

  constructor() {
    effect(() => {
      const u = this.auth.user();
      if (this.unsub) { this.unsub(); this.unsub = null; }

      if (u) {
        const col = collection(db, `users/${u.uid}/${this.collectionName}`);
        this.unsub = onSnapshot(col, snap => {
          this._items.set(this.sort(snap.docs.map(d => d.data() as T)));
        });
      } else {
        this._items.set([]);
      }
    });
  }

  has(id: number): boolean {
    return this._items().some(a => a.mal_id === id);
  }

  /** Construye el payload completo a guardar en Firestore. */
  protected abstract buildPayload(anime: AnimeUserPayload): T;

  async toggle(anime: AnimeUserPayload): Promise<void> {
    const u = this.auth.user();
    if (!u) return;
    const ref = doc(db, `users/${u.uid}/${this.collectionName}`, String(anime.mal_id));
    if (this.has(anime.mal_id)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, this.buildPayload(anime));
      // Registrar actividad (sin await para no bloquear la UI)
      this.activity.log(this.collectionName as ActivityType, {
        mal_id: anime.mal_id,
        animeTitle: anime.title,
        animeImage: anime.images?.jpg?.image_url ?? '',
      }).catch(() => {});
    }
  }
}
