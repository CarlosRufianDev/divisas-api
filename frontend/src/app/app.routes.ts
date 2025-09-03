import { Routes } from '@angular/router';
import { Alertas } from './components/alertas/alertas';
import { Dashboard } from './components/dashboard/dashboard';
import { Favoritos } from './components/favoritos/favoritos';
import { Historial } from './components/historial/historial';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard },
  { path: 'historial', component: Historial, canActivate: [authGuard] },
  { path: 'favoritos', component: Favoritos, canActivate: [authGuard] },
  { path: 'alertas', component: Alertas, canActivate: [authGuard] },
  {
    path: 'calculator',
    loadComponent: () =>
      import('./components/calculator/calculator').then((m) => m.Calculator),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/profile/profile.component').then((m) => m.Profile),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/dashboard' },
];
