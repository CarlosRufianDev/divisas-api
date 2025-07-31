import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DivisasService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Método para convertir divisas
  convertir(amount: number, from: string, to: string): Observable<any> {
    const body = { amount, from, to };
    return this.http.post(`${this.apiUrl}/convert`, body);
  }

  //  Obtener tipos de cambio múltiples
  obtenerTiposCambio(baseCurrency: string = 'USD'): Observable<any> {
    return this.http.get(`${this.apiUrl}/rates/${baseCurrency}`);
  }

  //  Obtener lista de divisas disponibles
  obtenerDivisasDisponibles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/currencies`);
  }
}