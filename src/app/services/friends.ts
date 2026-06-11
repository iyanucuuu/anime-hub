import { Injectable, signal, effect, inject, computed } from '@angular/core';
import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  onSnapshot, query, where, orderBy,
  getDoc, getDocs, Query, DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './auth';

// ─── Modelos ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  joinedAt: number;
}

export type FriendStatus = 'pending' | 'accepted';

export interface FriendRequest {
  id: string;            // `${fromUid}_${toUid}`
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  toUid: string;
  toName: string;
  toPhoto: string;
  status: FriendStatus;
  createdAt: number;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private auth = inject(AuthService);

  /** Solicitudes pendientes que me han enviado a mí. */
  readonly incomingRequests = signal<FriendRequest[]>([]);
  /** Solicitudes que yo he enviado y aún no han sido aceptadas. */
  readonly outgoingRequests = signal<FriendRequest[]>([]);

  // Amigos separados por dirección para evitar race conditions
  private _sentFriends     = signal<UserProfile[]>([]);
  private _receivedFriends = signal<UserProfile[]>([]);

  /** Amigos aceptados (combinación deduplicada de enviados + recibidos). */
  readonly friends = computed<UserProfile[]>(() => {
    const all = [...this._sentFriends(), ...this._receivedFriends()];
    const seen = new Set<string>();
    return all.filter(f => seen.has(f.uid) ? false : (seen.add(f.uid), true));
  });

  /** Set de UIDs de amigos aceptados — útil para lookups rápidos. */
  readonly friendIds = computed(() => new Set(this.friends().map(f => f.uid)));

  private unsubs: (() => void)[] = [];

  constructor() {
    effect(() => {
      this.unsubs.forEach(u => u());
      this.unsubs = [];

      const u = this.auth.user();
      if (!u) {
        this.incomingRequests.set([]);
        this.outgoingRequests.set([]);
        this._sentFriends.set([]);
        this._receivedFriends.set([]);
        return;
      }

      const onErr = (e: Error) => console.warn('[FriendsService]', e.message);

      // Solicitudes entrantes pendientes
      this.unsubs.push(onSnapshot(
        query(
          collection(db, 'friendRequests'),
          where('toUid', '==', u.uid),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc'),
        ),
        snap => this.incomingRequests.set(snap.docs.map(d => d.data() as FriendRequest)),
        onErr,
      ));

      // Solicitudes salientes pendientes
      this.unsubs.push(onSnapshot(
        query(
          collection(db, 'friendRequests'),
          where('fromUid', '==', u.uid),
          where('status', '==', 'pending'),
        ),
        snap => this.outgoingRequests.set(snap.docs.map(d => d.data() as FriendRequest)),
        onErr,
      ));

      // Amigos aceptados (los que yo envié y fueron aceptados)
      this.unsubs.push(onSnapshot(
        query(
          collection(db, 'friendRequests'),
          where('fromUid', '==', u.uid),
          where('status', '==', 'accepted'),
        ),
        async snap => {
          const uids = snap.docs.map(d => (d.data() as FriendRequest).toUid);
          const profiles = await this.fetchProfiles(uids);
          this._sentFriends.set(profiles);
        },
        onErr,
      ));

      // Amigos aceptados (los que me enviaron a mí y yo acepté)
      this.unsubs.push(onSnapshot(
        query(
          collection(db, 'friendRequests'),
          where('toUid', '==', u.uid),
          where('status', '==', 'accepted'),
        ),
        async snap => {
          const uids = snap.docs.map(d => (d.data() as FriendRequest).fromUid);
          const profiles = await this.fetchProfiles(uids);
          this._receivedFriends.set(profiles);
        },
        onErr,
      ));
    });
  }

  // ─── Operaciones ──────────────────────────────────────────────────────────

  async sendRequest(toUid: string): Promise<void> {
    const u = this.auth.user();
    if (!u || toUid === u.uid) return;

    // Evitar duplicados: comprobar si ya existe
    const existing = await getDoc(doc(db, 'friendRequests', `${u.uid}_${toUid}`));
    if (existing.exists()) return;
    const reverse = await getDoc(doc(db, 'friendRequests', `${toUid}_${u.uid}`));
    if (reverse.exists()) return;

    const toProfile = await this.getProfile(toUid);
    const request: FriendRequest = {
      id: `${u.uid}_${toUid}`,
      fromUid: u.uid,
      fromName: u.displayName ?? 'Anónimo',
      fromPhoto: u.photoURL ?? '',
      toUid,
      toName: toProfile?.displayName ?? 'Usuario',
      toPhoto: toProfile?.photoURL ?? '',
      status: 'pending',
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'friendRequests', request.id), request);
  }

  async acceptRequest(requestId: string): Promise<void> {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
  }

  async rejectRequest(requestId: string): Promise<void> {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  }

  async removeFriend(friendUid: string): Promise<void> {
    const myUid = this.auth.user()?.uid;
    if (!myUid) return;
    await deleteDoc(doc(db, 'friendRequests', `${myUid}_${friendUid}`)).catch(() => {});
    await deleteDoc(doc(db, 'friendRequests', `${friendUid}_${myUid}`)).catch(() => {});
  }

  /** Busca usuarios por nombre (hasta 10 resultados). */
  async searchUsers(searchQuery: string): Promise<UserProfile[]> {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const snap = await getDocs(
      collection(db, 'users') as unknown as Query<DocumentData>,
    );
    return snap.docs
      .map(d => d.data() as UserProfile)
      .filter(u =>
        u.displayName.toLowerCase().includes(q) &&
        u.uid !== this.auth.user()?.uid
      )
      .slice(0, 10);
  }

  /** Indica si ya soy amigo de `uid` o tengo solicitud pendiente con él. */
  friendshipStatus(uid: string): 'none' | 'pending-sent' | 'pending-received' | 'friends' {
    if (this.friendIds().has(uid)) return 'friends';
    if (this.outgoingRequests().some(r => r.toUid === uid)) return 'pending-sent';
    if (this.incomingRequests().some(r => r.fromUid === uid)) return 'pending-received';
    return 'none';
  }

  // ─── Perfil público ───────────────────────────────────────────────────────

  async upsertMyProfile(): Promise<void> {
    const u = this.auth.user();
    if (!u) return;
    await setDoc(doc(db, 'users', u.uid), {
      uid: u.uid,
      displayName: u.displayName ?? 'Anónimo',
      photoURL: u.photoURL ?? '',
      joinedAt: Date.now(),
    } satisfies UserProfile, { merge: true });
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  private async fetchProfiles(uids: string[]): Promise<UserProfile[]> {
    const results = await Promise.all(uids.map(uid => this.getProfile(uid)));
    return results.filter((p): p is UserProfile => p !== null);
  }
}
