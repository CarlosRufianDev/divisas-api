import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router); // ✅ AÑADIR

  console.log('🛡️ AuthGuard: Verificando autenticación...');

  const isAuthenticated = authService.isAuthenticated();
  const hasValidToken = authService.isTokenValid();

  console.log('🔍 isAuthenticated:', isAuthenticated);
  console.log('🔍 hasValidToken:', hasValidToken);

  if (!isAuthenticated || !hasValidToken) {
    console.log('❌ Acceso denegado, redirigiendo al login');

    // ✅ AÑADIR: Limpiar token inválido y redirigir
    authService.logout(); // ✅ Fuerza logout completo
    router.navigate(['/login']); // ✅ Fuerza redirección

    return false;
  }

  console.log('✅ Acceso permitido');
  return true;
};
