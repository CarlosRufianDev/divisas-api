import { Routes } from '@angular/router';
import { Alertas } from './components/alertas/alertas'; // ← NUEVO
import { Dashboard } from './components/dashboard/dashboard';
import { Favoritos } from './components/favoritos/favoritos';
import { Historial } from './components/historial/historial';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard },
  { path: 'historial', component: Historial },
  { path: 'favoritos', component: Favoritos },
  { path: 'alertas', component: Alertas },
  { path: '**', redirectTo: '/dashboard' }
];