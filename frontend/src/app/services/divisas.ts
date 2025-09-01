import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface Currency {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

export interface ConversionRequest {
  from: string;
  to: string;
  amount: number;
}

export interface ConversionResponse {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: string;
  date: string;
  user?: string;
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class DivisasService {
  private apiUrl = environment.apiUrl;
  private frankfurterUrl = environment.frankfurterApiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  // CORREGIR: usar endpoint real sin /convert/
  convertCurrency(request: ConversionRequest): Observable<ConversionResponse> {
    console.log('🔄 Enviando conversión al backend:', request);
    return this.http.post<ConversionResponse>(
      `${this.apiUrl}/convert`,
      request
    );
  }

  // CORREGIR: usar endpoint real sin /convert/
  getExchangeRates(baseCurrency: string = 'USD'): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/rates/${baseCurrency}` // ✅ CORRECTO: /api/rates/USD
    );
  }

  // CORREGIR: usar endpoint real sin /convert/
  getCurrencies(): Observable<{
    success: boolean;
    currencies: Currency[];
    total: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/currencies`); // ✅ CORRECTO: /api/currencies
  }

  // CORREGIR: usar endpoint real sin /convert/
  getConversionHistory(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/historial`, { headers }); // ✅ CORRECTO: /api/historial
  }

  // Mantener fallbacks a Frankfurter
  getLatestRatesFromFrankfurter(base: string = 'USD'): Observable<any> {
    const url = `${this.frankfurterUrl}/latest?from=${base}`;
    console.log('🔗 URL Frankfurter:', url); // ✅ AÑADIR este log
    return this.http.get(url);
  }

  convertWithFrankfurter(
    from: string,
    to: string,
    amount: number
  ): Observable<any> {
    return this.http.get(
      `${this.frankfurterUrl}/latest?amount=${amount}&from=${from}&to=${to}`
    );
  }

  // Nuevos métodos añadidos
  getUserStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`);
  }

  getFavoriteTrends(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/trends`);
  }
}
