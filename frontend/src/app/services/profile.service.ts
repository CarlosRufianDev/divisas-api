import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface ProfileData {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}

export interface ChangeUsernameRequest {
  newUsername: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface ApiResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Obtener datos del perfil
  getProfile(): Observable<ProfileData> {
    const headers = this.getAuthHeaders();
    return this.http.get<ProfileData>(`${this.apiUrl}/profile`, { headers });
  }

  // Cambiar contraseña
  changePassword(data: ChangePasswordRequest): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse>(
      `${this.apiUrl}/profile/change-password`,
      data,
      { headers }
    );
  }

  // Cambiar email
  changeEmail(data: ChangeEmailRequest): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse>(
      `${this.apiUrl}/profile/change-email`,
      data,
      { headers }
    );
  }

  // Cambiar nombre de usuario
  changeUsername(data: ChangeUsernameRequest): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse>(
      `${this.apiUrl}/profile/change-username`,
      data,
      { headers }
    );
  }

  // Eliminar cuenta
  deleteAccount(data: DeleteAccountRequest): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse>(
      `${this.apiUrl}/profile/delete-account`,
      {
        headers,
        body: data,
      }
    );
  }
}
