import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface Favorito {
  id: number;
  user: number;
  from_currency: string;
  to_currency: string;
  created_at: string;
  updated_at: string;
  current_rate?: number;
  variation?: number;
  variation_percentage?: string;
}

export interface CreateFavoritoRequest {
  from_currency: string;
  to_currency: string;
}

export interface FavoritoWithRates {
  id: number;
  from_currency: string;
  to_currency: string;
  current_rate: number;
  previous_rate: number;
  variation: number;
  variation_percentage: string;
  trend: 'up' | 'down' | 'stable';
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todos los favoritos del usuario
  getFavoritos(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/favorites`, { headers });  // ✅ TU RUTA
  }

  // Obtener favoritos con información de rates actuales
  getFavoritosWithRates(): Observable<FavoritoWithRates[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<FavoritoWithRates[]>(
      `${this.apiUrl}/favoritos/with-rates/`, 
      { headers }
    );
  }

  // Crear nuevo favorito
  createFavorito(favorito: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/favorites`, favorito, { headers });
  }

  // Obtener favorito específico
  getFavorito(id: number): Observable<Favorito> {
    const headers = this.getAuthHeaders();
    return this.http.get<Favorito>(`${this.apiUrl}/favoritos/${id}/`, { headers });
  }

  // Actualizar favorito
  updateFavorito(id: number, favorito: CreateFavoritoRequest): Observable<Favorito> {
    const headers = this.getAuthHeaders();
    return this.http.put<Favorito>(
      `${this.apiUrl}/favoritos/${id}/`, 
      favorito, 
      { headers }
    );
  }

  // Eliminar favorito
  deleteFavorito(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/favoritos/${id}/`, { headers });
  }

  // Verificar si un par de divisas está en favoritos
  isFavorite(fromCurrency: string, toCurrency: string): Observable<{ is_favorite: boolean }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ is_favorite: boolean }>(
      `${this.apiUrl}/favoritos/check/?from=${fromCurrency}&to=${toCurrency}`,
      { headers }
    );
  }

  // Toggle favorito (agregar/quitar)
  toggleFavorito(fromCurrency: string, toCurrency: string): Observable<{ added: boolean, favorito?: Favorito }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ added: boolean, favorito?: Favorito }>(
      `${this.apiUrl}/favoritos/toggle/`,
      { from_currency: fromCurrency, to_currency: toCurrency },
      { headers }
    );
  }

  // Obtener resumen estadístico de favoritos
  getFavoritosStats(): Observable<{
    total_favoritos: number;
    mejor_performer: FavoritoWithRates | null;
    peor_performer: FavoritoWithRates | null;
    promedio_variacion: number;
  }> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/favoritos/stats/`, { headers });
  }

  // Conversión rápida entre favoritos
  convertBetweenFavorites(fromCurrency: string, toCurrency: string, amount: number): Observable<{
    from_currency: string;
    to_currency: string;
    amount: number;
    converted_amount: number;
    rate: number;
  }> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(
      `${this.apiUrl}/favoritos/quick-convert/`,
      { from_currency: fromCurrency, to_currency: toCurrency, amount },
      { headers }
    );
  }

  // Obtener monedas favoritas
  getFavoriteCurrencies(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/favorite-currencies`, { headers });
  }
}
