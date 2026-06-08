import { BroadcastInfo } from '../services/broadcast';

// ─── Imágenes ────────────────────────────────────────────────────────────────

export interface AnimeImageFormat {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface AnimeImages {
  jpg: AnimeImageFormat;
  webp?: AnimeImageFormat;
}

// ─── Datos auxiliares ────────────────────────────────────────────────────────

export interface AnimeTitle {
  type: string;
  title: string;
}

export interface AnimeGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface StreamingLink {
  name: string;
  url: string;
}

export interface AnimeTrailer {
  url?: string;
  embed_url?: string;
  youtube_id?: string;
}

// ─── Personajes ──────────────────────────────────────────────────────────────

export interface VoiceActor {
  person: {
    mal_id: number;
    url: string;
    images: { jpg: { image_url: string } };
    name: string;
  };
  language: string;
}

export interface AnimeCharacter {
  character: {
    mal_id: number;
    images: AnimeImages;
    name: string;
    url: string;
  };
  role: string;
  voice_actors: VoiceActor[];
}

// ─── Anime principal ─────────────────────────────────────────────────────────

export interface Anime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  titles?: AnimeTitle[];
  images: AnimeImages;
  score: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;
  status: string;
  type?: string | null;
  episodes?: number | null;
  duration?: string | null;
  synopsis?: string | null;
  year?: number | null;
  season?: string | null;
  genres?: AnimeGenre[];
  themes?: AnimeGenre[];
  broadcast?: BroadcastInfo;
  streaming?: StreamingLink[];
  trailer?: AnimeTrailer;
  url?: string;
  source?: string;
  rating?: string;
  airing?: boolean;
}

// ─── Respuestas de la API ────────────────────────────────────────────────────

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanListResponse<T> {
  data: T[];
  pagination?: JikanPagination;
}

export interface JikanSingleResponse<T> {
  data: T;
}

// ─── Payload para guardar en Firestore ──────────────────────────────────────
// Subconjunto mínimo de Anime que se persiste en la cuenta del usuario.

export interface AnimeUserPayload {
  mal_id: number;
  title: string;
  images: AnimeImages;
  score: number | null;
  status?: string;
  broadcast?: BroadcastInfo;
}
