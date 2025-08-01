import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log('🔍 Interceptor: Procesando request a', req.url);

    // ✅ AÑADIR token automáticamente a todas las requests
    const token = this.authService.getToken();
    let authReq = req;

    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('🔑 Token añadido a la request');
    }

    // ✅ MANEJAR respuestas y errores
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('❌ Error en request:', error.status, error.message);

        // ✅ Si token expirado (401), logout automático
        if (error.status === 401) {
          console.log(
            '🔒 Token expirado o inválido. Cerrando sesión automáticamente...'
          );
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        // ✅ Si sin autorización (403), mostrar mensaje
        if (error.status === 403) {
          console.log('🚫 Acceso denegado');
        }

        return throwError(() => error);
      })
    );
  }
}
