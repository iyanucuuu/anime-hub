import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { JikanApi } from './jikan-api';
import { Anime, JikanListResponse, JikanSingleResponse } from '../models/anime.models';

const BASE_URL = 'https://api.jikan.moe/v4';

function makeAnime(id: number, title: string): Anime {
  return {
    mal_id: id,
    title,
    score: 8.0,
    status: 'Finished Airing',
    images: { jpg: { image_url: '' } },
  };
}

describe('JikanApi', () => {
  let service: JikanApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JikanApi,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(JikanApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // asegura que no queden peticiones pendientes
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('searchAnime() construye la URL correcta con type=tv', () => {
    service.searchAnime('naruto').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/anime'));
    expect(req.request.urlWithParams).toContain('q=naruto');
    expect(req.request.urlWithParams).toContain('type=tv');
    expect(req.request.urlWithParams).toContain('sfw=true');
    req.flush({ data: [] } satisfies JikanListResponse<Anime>);
  });

  it('searchAnimeAll() no incluye el filtro type=tv', () => {
    service.searchAnimeAll('naruto').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/anime'));
    expect(req.request.urlWithParams).not.toContain('type=tv');
    req.flush({ data: [] } satisfies JikanListResponse<Anime>);
  });

  it('getAnimeById() llama al endpoint /anime/:id/full', () => {
    const mockAnime = makeAnime(1, 'Naruto');
    let result: Anime | undefined;

    service.getAnimeById(1).subscribe(res => (result = res.data));

    const req = httpMock.expectOne(`${BASE_URL}/anime/1/full`);
    req.flush({ data: mockAnime } satisfies JikanSingleResponse<Anime>);

    expect(result?.mal_id).toBe(1);
    expect(result?.title).toBe('Naruto');
  });

  it('getSeasonNow() incluye el filtro filter=tv', () => {
    service.getSeasonNow().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/seasons/now'));
    expect(req.request.urlWithParams).toContain('filter=tv');
    req.flush({ data: [] } satisfies JikanListResponse<Anime>);
  });

  it('getTopAnime() llama al endpoint /top/anime con type=tv', () => {
    service.getTopAnime().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/top/anime'));
    expect(req.request.urlWithParams).toContain('type=tv');
    req.flush({ data: [] } satisfies JikanListResponse<Anime>);
  });

  it('getTopMovies() llama al endpoint /top/anime con type=movie', () => {
    service.getTopMovies().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/top/anime'));
    expect(req.request.urlWithParams).toContain('type=movie');
    req.flush({ data: [] } satisfies JikanListResponse<Anime>);
  });
});
