import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenKey = 'auth_token';

  public currentUser$ = this.currentUserSubject.asObservable();

  // ✅ CAMBIAR: Usar tipo compatible con Angular
  private logoutTimer?: ReturnType<typeof setTimeout>;

  constructor(private http: HttpClient, private router: Router) {
    this.checkStoredToken();
  }

  private checkStoredToken(): void {
    const token = this.getAuthToken();
    if (token) {
      const userData = this.getUserFromToken(token);
      if (userData) {
        this.currentUserSubject.next(userData);
      } else {
        this.logout();
      }
    }
  }

  private getUserFromToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || 'Usuario',
        username: payload.username || payload.email.split('@')[0],
        role: payload.role || 'user',
      };
    } catch {
      return null;
    }
  }

  // ✅ Iniciar timer de auto-logout
  startLogoutTimer(): void {
    this.clearLogoutTimer();

    const timeRemaining = this.getTokenTimeRemaining();

    if (timeRemaining > 0) {
      // Logout automático 5 minutos antes de expirar
      const logoutTime = (timeRemaining - 300) * 1000; // 5 min antes

      if (logoutTime > 0) {
        console.log(
          `⏰ Auto-logout programado en ${Math.floor(
            logoutTime / 1000 / 60
          )} minutos`
        );

        this.logoutTimer = setTimeout(() => {
          console.log('⏰ Sesión expirada automáticamente');
          this.logout();

          // TODO: Añadir notificación cuando integres MatSnackBar
          console.log(
            '📱 Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
          );
        }, logoutTime);
      }
    }
  }

  // ✅ Limpiar timer
  clearLogoutTimer(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = undefined;
    }
  }

  login(credentials: LoginRequest): Observable<any> {
    console.log('🔐 Enviando login request:', credentials);

    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        console.log('📨 Respuesta completa del backend:', response);

        localStorage.setItem(this.tokenKey, response.token);

        let userData: User;

        if (response.user) {
          // Opción 1: Usuario viene en response.user
          userData = {
            id:
              (response.user as any)._id ||
              (response.user as any).id ||
              'temp_id',
            email: response.user.email,
            name: response.user.name,
            username:
              response.user.username || response.user.email.split('@')[0], // ✅ CORREGIDO
            role: response.user.role,
          };
        } else {
          // Opción 2: Extraer del token JWT
          const tokenUser = this.getUserFromToken(response.token);
          if (tokenUser) {
            userData = tokenUser;
          } else {
            // Opción 3: Datos básicos
            userData = {
              id: 'temp_id',
              email: credentials.email,
              name: 'Usuario',
              username: credentials.email.split('@')[0], // ✅ CORREGIDO
              role: 'user',
            };
          }
        }

        console.log('👤 Usuario final:', userData);
        this.currentUserSubject.next(userData);

        // ✅ AÑADIR: Iniciar timer de auto-logout
        this.startLogoutTimer();
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    // ✅ CORREGIDO
    console.log('📝 Enviando registro:', userData);

    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData).pipe(
      tap((response) => {
        console.log('📨 Respuesta de registro:', response);

        localStorage.setItem(this.tokenKey, response.token);

        let userToSave: User;

        if (response.user) {
          userToSave = {
            id:
              (response.user as any)._id ||
              (response.user as any).id ||
              'temp_id',
            email: response.user.email,
            name: response.user.name,
            username: response.user.username || userData.username, // ✅ CORREGIDO
            role: response.user.role || 'user',
          };
        } else {
          userToSave = {
            id: 'temp_id',
            email: userData.email,
            name: userData.name,
            username: userData.username, // ✅ CORREGIDO
            role: 'user',
          };
        }

        console.log('👤 Usuario registrado:', userToSave);
        this.currentUserSubject.next(userToSave);
      })
    );
  }

  logout(): void {
    console.log('🚪 Cerrando sesión...');

    this.clearLogoutTimer(); // ✅ AÑADIR

    // Limpiar token
    localStorage.removeItem('auth_token');

    // Actualizar estado
    this.currentUserSubject.next(null);

    // ✅ AÑADIR: Redirigir al login
    this.router.navigate(['/login']);

    console.log('✅ Sesión cerrada, redirigido al login');
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token && this.isTokenValid();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token'); // ✅ CAMBIAR 'token' por 'auth_token'
  }

  // AÑADIR método mejorado para verificar token:
  isTokenValid(): boolean {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.log('🔍 No hay token');
      return false;
    }

    try {
      // ✅ Decodificar JWT para verificar expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        console.log('⏰ Token expirado:', new Date(payload.exp * 1000));
        return false;
      }

      console.log('✅ Token válido hasta:', new Date(payload.exp * 1000));
      return true;
    } catch (error) {
      console.error('❌ Token malformado:', error);
      return false;
    }
  }

  // ✅ AÑADIR: Obtener tiempo restante del token
  getTokenTimeRemaining(): number {
    const token = localStorage.getItem('auth_token');

    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - currentTime);
    } catch {
      return 0;
    }
  }
}
