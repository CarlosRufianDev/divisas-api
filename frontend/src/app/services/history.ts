import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface ConversionHistory {
  _id: string;
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  date: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryResponse {
  page: number;
  limit: number;
  total: number;
  count: number;
  results: ConversionHistory[];
}

export interface HistoryFilters {
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // Obtener historial con filtros
  getHistory(filters?: HistoryFilters): Observable<HistoryResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.from) params = params.set('from', filters.from);
      if (filters.to) params = params.set('to', filters.to);
      if (filters.minAmount)
        params = params.set('minAmount', filters.minAmount.toString());
      if (filters.maxAmount)
        params = params.set('maxAmount', filters.maxAmount.toString());
      if (filters.startDate)
        params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<HistoryResponse>(`${this.apiUrl}/historial`, {
      headers: this.getAuthHeaders(),
      params,
    });
  }

  // Eliminar conversión específica
  deleteConversion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/historial/entry/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Eliminar todo el historial
  deleteAllHistory(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/historial`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Método helper para obtener las últimas conversiones (para dashboard)
  getRecentConversions(limit = 5): Observable<HistoryResponse> {
    return this.getHistory({ limit, page: 1 });
  }
}
