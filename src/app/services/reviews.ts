import { Injectable, signal, effect, inject } from '@angular/core';
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, orderBy, limit,
  where, Query, DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth';
import { AnimeImages } from '../models/anime.models';

// ─── Modelo ──────────────────────────────────────────────────────────────────

export interface Review {
  /** ID compuesto: `${mal_id}_${uid}` — garantiza una reseña por usuario y anime. */
  id: string;
  mal_id: number;
  animeTitle: string;
  animeImage: string;        // jpg.image_url
  userId: string;
  displayName: string;
  photoURL: string;
  /** Nota del 1 al 10. */
  rating: number;
  /** Texto libre. */
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReviewPayload {
  mal_id: number;
  animeTitle: string;
  animeImages: AnimeImages;
  rating: number;
  text: string;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private auth = inject(AuthService);

  /** Reseñas del anime que se está consultando actualmente (se rellena al llamar a watchAnimeReviews). */
  readonly animeReviews = signal<Review[]>([]);
  /** Reseña del usuario autenticado para el anime actual. */
  readonly myReview = signal<Review | null>(null);
  /** Feed global: últimas reseñas de toda la comunidad. */
  readonly communityFeed = signal<Review[]>([]);

  private unsubAnime: (() => void) | null = null;
  private unsubFeed: (() => void) | null = null;

  constructor() {
    // Escuchar el feed global en cuanto haya sesión activa.
    effect(() => {
      const u = this.auth.user();
      if (this.unsubFeed) { this.unsubFeed(); this.unsubFeed = null; }
      if (u) {
        this.unsubFeed = this.subscribeQuery(
          query(collection(db, 'reviews'), orderBy('updatedAt', 'desc'), limit(30)),
          reviews => this.communityFeed.set(reviews),
        );
      } else {
        this.communityFeed.set([]);
      }
    });
  }

  /**
   * Suscribe en tiempo real a las reseñas de un anime concreto.
   * Devuelve una función de cleanup para llamarla al destruir el componente.
   */
  watchAnimeReviews(mal_id: number): () => void {
    const uid = this.auth.user()?.uid;
    if (this.unsubAnime) this.unsubAnime();

    this.unsubAnime = this.subscribeQuery(
      query(
        collection(db, 'reviews'),
        where('mal_id', '==', mal_id),
        orderBy('updatedAt', 'desc'),
        limit(20),
      ),
      reviews => {
        this.animeReviews.set(reviews);
        this.myReview.set(uid ? (reviews.find(r => r.userId === uid) ?? null) : null);
      },
    );

    return () => { if (this.unsubAnime) { this.unsubAnime(); this.unsubAnime = null; } };
  }

  async saveReview(payload: ReviewPayload): Promise<void> {
    const u = this.auth.user();
    if (!u) return;

    const id = `${payload.mal_id}_${u.uid}`;
    const now = Date.now();
    const existing = this.myReview();

    const review: Review = {
      id,
      mal_id: payload.mal_id,
      animeTitle: payload.animeTitle,
      animeImage: payload.animeImages.jpg.image_url,
      userId: u.uid,
      displayName: u.displayName ?? 'Anónimo',
      photoURL: u.photoURL ?? '',
      rating: payload.rating,
      text: payload.text.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'reviews', id), review);
  }

  async deleteReview(mal_id: number): Promise<void> {
    const u = this.auth.user();
    if (!u) return;
    await deleteDoc(doc(db, 'reviews', `${mal_id}_${u.uid}`));
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private subscribeQuery(
    q: Query<DocumentData>,
    callback: (reviews: Review[]) => void,
  ): () => void {
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => d.data() as Review));
    });
  }
}
