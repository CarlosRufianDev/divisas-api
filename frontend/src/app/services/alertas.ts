import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

// ✅ INTERFACES ACTUALIZADAS para tu backend
export interface Alert {
  _id?: string;
  user?: string;
  from: string;
  to: string;
  alertType: 'scheduled' | 'percentage' | 'target';

  // Para alertas programadas
  intervalDays?: number;
  hour?: number;

  // Para alertas por porcentaje
  percentageThreshold?: number;
  percentageDirection?: 'up' | 'down' | 'both';
  baselineRate?: number;

  // Para alertas por precio objetivo
  targetRate?: number;
  targetDirection?: 'above' | 'below' | 'exact';

  // Campos comunes
  email: string;
  isActive: boolean;
  lastSent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledAlert {
  from: string;
  to: string;
  email: string;
  intervalDays: number;
  hour: number;
}

export interface CreatePercentageAlert {
  from: string;
  to: string;
  email: string;
  percentageThreshold: number;
  percentageDirection: 'up' | 'down' | 'both';
}

export interface CreateTargetAlert {
  from: string;
  to: string;
  email: string;
  targetRate: number;
  targetDirection: 'above' | 'below' | 'exact';
}

@Injectable({
  providedIn: 'root',
})
export class AlertasService {
  private apiUrl = environment.apiUrl; // ← Usa la variable de entorno

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // ✅ MÉTODOS ACTUALIZADOS PARA TU BACKEND:

  // Obtener todas las alertas del usuario
  getAlertas(): Observable<Alert[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts`, { headers });
  }

  // Crear alerta programada (cada X días)
  createScheduledAlert(data: CreateScheduledAlert): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/alerts/scheduled`, data, { headers });
  }

  // Crear alerta por porcentaje
  createPercentageAlert(data: CreatePercentageAlert): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/alerts/percentage`, data, {
      headers,
    });
  }

  // Crear alerta por precio objetivo
  createTargetAlert(data: CreateTargetAlert): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/alerts/target`, data, { headers });
  }

  // Actualizar alerta
  updateAlert(id: string, data: Partial<Alert>): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/alerts/${id}`, data, { headers });
  }

  // Eliminar alerta
  deleteAlert(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/alerts/${id}`, { headers });
  }

  // Activar/desactivar alerta
  toggleAlert(id: string, isActive: boolean): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(
      `${this.apiUrl}/alerts/${id}`,
      { isActive },
      { headers }
    );
  }

  // ✅ MÉTODOS ADICIONALES QUE PODRÍAN SER ÚTILES:

  // Obtener alertas activas únicamente
  getAlertasActivas(): Observable<Alert[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts?active=true`, {
      headers,
    });
  }

  // Obtener estadísticas de alertas (si implementas en backend)
  getAlertasStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/alerts/stats`, { headers });
  }

  // Test de alerta (disparar manualmente)
  testAlert(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/alerts/${id}/test`, {}, { headers });
  }
}
