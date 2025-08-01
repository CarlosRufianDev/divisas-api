import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { AuthService, LoginRequest } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header class="login-header">
          <div class="logo">💱</div>
          <mat-card-title>DivisasPro</mat-card-title>
          <mat-card-subtitle>Inicia sesión en tu cuenta</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="█REDACTED_EMAIL█">
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    class="full-width login-button"
                    [disabled]="loginForm.invalid || loading">
              <span *ngIf="!loading">Iniciar Sesión</span>
              <span *ngIf="loading">Iniciando...</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }

    .login-button {
      height: 48px;
      font-size: 16px;
      margin: 20px 0;
    }
  `]
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['█REDACTED_EMAIL█', [Validators.required, Validators.email]],
      password: ['TuPasswordSegura123', [Validators.required]]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      this.errorMessage = '';
      
      const credentials: LoginRequest = this.loginForm.value;
      console.log('🔐 Intentando login con:', credentials.email);

      this.authService.login(credentials).subscribe({
        next: (response: any) => {  // ✅ CAMBIAR: Añadir 'any'
          console.log('✅ Respuesta completa del backend:', response);
          this.loading = false;
          
          // ✅ MÉTODO ROBUSTO: Extraer nombre de múltiples fuentes
          let userName = 'Usuario';
          
          if (response.user?.name) {
            userName = response.user.name;
          } else if (response.name) {  // ✅ YA NO DA ERROR
            userName = response.name;
          } else {
            // Extraer del token si no viene en la respuesta
            const userData = this.authService.getCurrentUser();
            userName = userData?.name || 'Usuario';
          }
          
          console.log(`🎉 Login exitoso para: ${userName}`);
          
          // Mostrar mensaje de éxito
          this.snackBar.open(`¡Bienvenido ${userName}!`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Redirigir al dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('❌ Error en login:', error);
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error al iniciar sesión';
          
          this.snackBar.open(this.errorMessage, 'Cerrar', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}