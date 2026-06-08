import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, GuardResult } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth';
import { User } from 'firebase/auth';

/** Ejecuta el guard en el contexto de TestBed */
function runGuard(): Promise<GuardResult> {
  return TestBed.runInInjectionContext(() => {
    const result = authGuard({} as never, {} as never);
    if (result instanceof Observable) {
      return new Promise(resolve => result.subscribe(v => resolve(v)));
    }
    if (result instanceof Promise) return result;
    return Promise.resolve(result);
  });
}

describe('authGuard', () => {
  let authServiceMock: { user: ReturnType<typeof signal<User | null | undefined>> };

  beforeEach(() => {
    authServiceMock = { user: signal<User | null | undefined>(undefined) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
  });

  it('permite el acceso cuando el usuario está autenticado', async () => {
    authServiceMock.user.set({ uid: 'user-123' } as User);

    const result = await runGuard();
    expect(result).toBe(true);
  });

  it('redirige a /home cuando el usuario no está autenticado', async () => {
    authServiceMock.user.set(null);
    const router = TestBed.inject(Router);

    const result = await runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('devuelve un Observable (espera el estado async de Firebase)', () => {
    authServiceMock.user.set(undefined);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never)
    );

    // El guard debe devolver un Observable, no un valor síncrono,
    // para poder esperar a que Firebase resuelva el estado de auth
    expect(result).toBeInstanceOf(Observable);
  });
});
