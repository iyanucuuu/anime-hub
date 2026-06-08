import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth';

/**
 * Protege rutas que requieren autenticación.
 * Espera a que Firebase resuelva el estado inicial (undefined → User | null)
 * antes de tomar la decisión, evitando falsos negativos en el primer render.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.user).pipe(
    filter(user => user !== undefined),   // espera a que Firebase resuelva
    take(1),
    map(user => user ? true : router.createUrlTree(['/home']))
  );
};
