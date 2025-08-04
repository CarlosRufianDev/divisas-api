import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 Interceptor FUNCIONAL: Procesando request a', req.url);

  // ✅ AÑADIR token automáticamente a todas las requests del API
  let authReq = req;

  if (req.url.includes('/api/')) {
    const token = authService.getToken();
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('🔑 Token añadido a la request:', req.url);
      console.log(
        '🔑 Token (primeros 20 chars):',
        token.substring(0, 20) + '...'
      );
    } else {
      console.log('⚠️ No hay token disponible para', req.url);
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('❌ Error interceptado:', error.status, error.message);
      console.log('❌ URL que falló:', error.url);

      if (error.status === 401) {
        console.log('🔒 Token expirado/inválido. Logout automático...');
        authService.logout();
        router.navigate(['/login']);
      }

      if (error.status === 403) {
        console.log('🚫 Acceso denegado');
      }

      return throwError(() => error);
    })
  );
};
