import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface Alerta {
  id: number;
  user: number;
  from_currency: string;
  to_currency: string;
  condition: 'greater_than' | 'less_than' | 'equal_to';
  target_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  triggered_at?: string;
  current_rate?: number;
}

export interface CreateAlertaRequest {
  from_currency: string;
  to_currency: string;
  condition: 'greater_than' | 'less_than' | 'equal_to';
  target_rate: number;
}

export interface AlertaTriggered {
  id: number;
  alerta: Alerta;
  triggered_rate: number;
  triggered_at: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertasService {
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

  // Obtener todas las alertas del usuario
  getAlertas(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/alerts`, { headers });  // ✅ TU RUTA
  }

  // Obtener alertas activas únicamente
  getAlertasActivas(): Observable<Alerta[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Alerta[]>(`${this.apiUrl}/alertas/?active=true`, { headers });
  }

  // Crear nueva alerta
  createAlerta(alerta: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/alerts/scheduled`, 
      alerta, 
      { headers }
    );
  }

  // Obtener alerta específica
  getAlerta(id: number): Observable<Alerta> {
    const headers = this.getAuthHeaders();
    return this.http.get<Alerta>(`${this.apiUrl}/alertas/${id}/`, { headers });
  }

  // Actualizar alerta
  updateAlerta(id: number, alerta: Partial<CreateAlertaRequest>): Observable<Alerta> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Alerta>(
      `${this.apiUrl}/alertas/${id}/`, 
      alerta, 
      { headers }
    );
  }

  // Eliminar alerta
  deleteAlerta(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/alertas/${id}/`, { headers });
  }

  // Activar/Desactivar alerta
  toggleAlerta(id: number): Observable<Alerta> {
    const headers = this.getAuthHeaders();
    return this.http.post<Alerta>(
      `${this.apiUrl}/alertas/${id}/toggle/`,
      {},
      { headers }
    );
  }

  // Obtener historial de alertas disparadas
  getAlertasTriggered(): Observable<AlertaTriggered[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<AlertaTriggered[]>(
      `${this.apiUrl}/alertas/triggered/`,
      { headers }
    );
  }

  // Marcar alerta disparada como leída
  markTriggeredAsRead(triggeredId: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.post<void>(
      `${this.apiUrl}/alertas/triggered/${triggeredId}/read/`,
      {},
      { headers }
    );
  }

  // Obtener estadísticas de alertas
  getAlertasStats(): Observable<{
    total_alertas: number;
    alertas_activas: number;
    alertas_disparadas_hoy: number;
    alertas_por_moneda: Array<{currency_pair: string, count: number}>;
  }> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/alertas/stats/`, { headers });
  }

  // Verificar alertas pendientes (para notificaciones)
  checkPendingAlerts(): Observable<{
    pending_count: number;
    recent_alerts: AlertaTriggered[];
  }> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/alertas/pending/`, { headers });
  }

  // Duplicar alerta existente
  duplicateAlerta(id: number): Observable<Alerta> {
    const headers = this.getAuthHeaders();
    return this.http.post<Alerta>(
      `${this.apiUrl}/alertas/${id}/duplicate/`,
      {},
      { headers }
    );
  }
}
