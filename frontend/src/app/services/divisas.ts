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

// 🆕 NUEVA INTERFAZ: Análisis técnico
export interface TechnicalAnalysis {
  success: boolean;
  pair: string;
  period: string;
  dataPoints: number;
  currentRate: number;
  analysis: {
    trend: number;
    volatility: number;
    rsi: number;
    sma: number;
    support: number;
    resistance: number;
    avgDailyChange: number;
  };
  recommendation: {
    action: string;
    color: string;
    message: string;
    confidence: number;
    signals: string[];
    score: number;
  };
  rawData: {
    rates: number[];
    dates: string[];
    dailyChanges: number[];
  };
  timestamp: Date;
}

// 🆕 NUEVA INTERFAZ: Tendencias
export interface TrendingRates {
  success: boolean;
  base: string;
  period: string;
  date: string;
  rates: Array<{
    currency: string;
    currentRate: number;
    historicalRate: number;
    trend: number;
    trendStatus: 'up' | 'down' | 'stable';
    change: string;
  }>;
  summary: {
    total: number;
    trending_up: number;
    trending_down: number;
    stable: number;
  };
  timestamp: Date;
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

  // 🔄 MÉTODOS EXISTENTES MEJORADOS
  convertCurrency(request: ConversionRequest): Observable<ConversionResponse> {
    console.log('🔄 Enviando conversión al backend:', request);
    return this.http.post<ConversionResponse>(
      `${this.apiUrl}/convert`,
      request
    );
  }

  getExchangeRates(baseCurrency: string = 'USD'): Observable<any> {
    return this.http.get(`${this.apiUrl}/exchange/rates?base=${baseCurrency}`);
  }

  // 🌍 Obtener todas las divisas disponibles desde Frankfurter (DIRECTO)
  getAvailableCurrencies(): Observable<{
    success: boolean;
    currencies: string[];
    total: number;
    date: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/exchange/currencies`);
  }

  // 🆕 NUEVO: Cargar divisas dinámicamente desde Frankfurter API
  loadCurrenciesFromFrankfurter(): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(
      'https://api.frankfurter.app/currencies'
    );
  }

  getCurrencies(): Observable<{
    success: boolean;
    currencies: Currency[];
    total: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/currencies`);
  }

  getConversionHistory(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/historial`, { headers });
  }

  getUserStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/dashboard/stats`, { headers });
  }

  getFavoriteTrends(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/dashboard/trends`, { headers });
  }

  // 🔄 FALLBACKS A FRANKFURTER
  getLatestRatesFromFrankfurter(base: string = 'USD'): Observable<any> {
    const url = `${this.frankfurterUrl}/latest?from=${base}`;
    console.log('🔗 URL Frankfurter:', url);
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

  // 🆕 NUEVOS MÉTODOS CON DATOS REALES

  /**
   * Obtener análisis técnico completo con datos reales
   */
  getTechnicalAnalysis(
    from: string,
    to: string,
    days: number = 30
  ): Observable<TechnicalAnalysis> {
    const headers = this.getAuthHeaders();
    console.log(
      `📊 Solicitando análisis técnico: ${from}→${to} (${days} días)`
    );

    return this.http.post<TechnicalAnalysis>(
      `${this.apiUrl}/calculator/technical-analysis`,
      { from, to, days },
      { headers }
    );
  }

  /**
   * Obtener tendencias rápidas para el dashboard
   */
  getTrendingRates(
    base: string = 'USD',
    currencies?: string[],
    days: number = 7
  ): Observable<TrendingRates> {
    const params: any = { base, days };

    if (currencies && currencies.length > 0) {
      params.currencies = currencies.join(',');
    }

    console.log(`📈 Solicitando tendencias: base=${base}, días=${days}`);

    return this.http.get<TrendingRates>(
      `${this.apiUrl}/calculator/trending-rates`,
      { params }
    );
  }

  /**
   * Obtener datos históricos específicos (usando método existente mejorado)
   */
  getHistoricalRate(from: string, to: string, date: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post(
      `${this.apiUrl}/calculator/historical`,
      { from, to, date },
      { headers }
    );
  }

  /**
   * Conversión múltiple con datos reales
   */
  getMultipleConversions(
    from: string,
    amount: number,
    currencies: string[]
  ): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post(
      `${this.apiUrl}/calculator/multiple`,
      { from, amount, currencies },
      { headers }
    );
  }

  /**
   * Comparar pares de monedas
   */
  compareCurrencyPairs(
    pairs: Array<{ from: string; to: string }>
  ): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.post(
      `${this.apiUrl}/calculator/compare`,
      { pairs },
      { headers }
    );
  }

  // 🔧 MÉTODOS AUXILIARES PARA EL DASHBOARD

  /**
   * Obtener tipos de cambio con tendencias calculadas
   */
  getRatesWithTrends(base: string = 'USD', days: number = 7): Observable<any> {
    console.log(`💱 Obteniendo tasas con tendencias: ${base} (${days} días)`);

    // Usar el nuevo método de tendencias que es más eficiente
    return this.getTrendingRates(base, undefined, days);
  }

  /**
   * Validar si una moneda está disponible
   */
  async validateCurrency(code: string): Promise<boolean> {
    try {
      const response = await this.getLatestRatesFromFrankfurter(
        'USD'
      ).toPromise();
      return Object.keys(response.rates).includes(code) || code === 'EUR';
    } catch {
      return false;
    }
  }

  /**
   * Obtener lista de monedas soportadas por Frankfurter
   */
  getSupportedCurrencies(): Observable<any> {
    return this.http.get(`${this.frankfurterUrl}/currencies`);
  }

  /**
   * Registrar uso del filtro de divisas (activity logging)
   */
  logCurrencyFilter(
    filterValue: string,
    resultsCount: number
  ): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    return this.http.post(
      `${this.apiUrl}/dashboard/log-filter`,
      {
        filterValue,
        resultsCount,
      },
      { headers }
    );
  }
}
