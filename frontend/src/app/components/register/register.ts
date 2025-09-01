import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { AuthService, RegisterRequest } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header class="register-header">
          <div class="logo">💱</div>
          <mat-card-title>DivisasPro</mat-card-title>
          <mat-card-subtitle>Crea tu cuenta gratuita</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Progress indicator -->
          <div class="progress-container" *ngIf="loading">
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="getFormProgress()"
              ></div>
            </div>
            <div class="progress-text">
              Completado: {{ getFormProgress() }}%
            </div>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <!-- Nombre completo -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre completo</mat-label>
              <input
                matInput
                formControlName="name"
                placeholder="Carlos Rufián"
              />
              <mat-icon matSuffix [class]="getFieldClass('name')"
                >person</mat-icon
              >
              <mat-error *ngIf="registerForm.get('name')?.hasError('required')">
                El nombre es requerido
              </mat-error>
              <mat-error
                *ngIf="registerForm.get('name')?.hasError('minlength')"
              >
                Mínimo 2 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Nombre de usuario -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre de usuario</mat-label>
              <input
                matInput
                formControlName="username"
                placeholder="usuario123"
              />
              <mat-icon matSuffix [class]="getFieldClass('username')"
                >account_circle</mat-icon
              >
              <mat-error
                *ngIf="registerForm.get('username')?.hasError('required')"
              >
                El nombre de usuario es requerido
              </mat-error>
              <mat-error
                *ngIf="registerForm.get('username')?.hasError('minlength')"
              >
                Mínimo 3 caracteres
              </mat-error>
              <mat-error
                *ngIf="registerForm.get('username')?.hasError('maxlength')"
              >
                Máximo 20 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="tu@email.com"
              />
              <mat-icon matSuffix [class]="getFieldClass('email')"
                >email</mat-icon
              >
              <mat-error
                *ngIf="registerForm.get('email')?.hasError('required')"
              >
                El email es requerido
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Formato de email inválido
              </mat-error>
            </mat-form-field>

            <!-- Contraseña -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                mat-icon-button
                matSuffix
                (click)="hidePassword = !hidePassword"
                type="button"
              >
                <mat-icon>{{
                  hidePassword ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
              <mat-error
                *ngIf="registerForm.get('password')?.hasError('required')"
              >
                La contraseña es requerida
              </mat-error>
              <mat-error
                *ngIf="registerForm.get('password')?.hasError('minlength')"
              >
                Mínimo 6 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Confirmar contraseña -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar contraseña</mat-label>
              <input
                matInput
                [type]="hideConfirmPassword ? 'password' : 'text'"
                formControlName="confirmPassword"
                placeholder="Repite tu contraseña"
              />
              <button
                mat-icon-button
                matSuffix
                (click)="hideConfirmPassword = !hideConfirmPassword"
                type="button"
              >
                <mat-icon>{{
                  hideConfirmPassword ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
              <mat-error
                *ngIf="
                  registerForm.get('confirmPassword')?.hasError('required')
                "
              >
                Confirma tu contraseña
              </mat-error>
              <mat-error
                *ngIf="
                  registerForm.get('confirmPassword')?.hasError('mismatch')
                "
              >
                Las contraseñas no coinciden
              </mat-error>
            </mat-form-field>

            <!-- Botón de registro -->
            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width register-button"
              [disabled]="registerForm.invalid || loading"
            >
              <span *ngIf="!loading">Crear Cuenta</span>
              <span *ngIf="loading" class="loading-content">
                <mat-progress-spinner
                  diameter="20"
                  mode="indeterminate"
                ></mat-progress-spinner>
                Creando cuenta...
              </span>
            </button>

            <!-- Botón para ir al login -->
            <button
              mat-stroked-button
              type="button"
              class="full-width secondary-button"
              (click)="goToLogin()"
            >
              <mat-icon>arrow_back</mat-icon>
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './register.scss', // ✅ USAR ARCHIVO SCSS EXTERNO
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar // ✅ AÑADIR SNACKBAR
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(20),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // ✅ VALIDADOR PERSONALIZADO: Contraseñas deben coincidir
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    if (confirmPassword?.errors?.['mismatch']) {
      delete confirmPassword.errors['mismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  // ✅ NUEVO: Calcular progreso del formulario
  getFormProgress(): number {
    const fields = ['name', 'username', 'email', 'password', 'confirmPassword'];
    const validFields = fields.filter(
      (field) => this.registerForm.get(field)?.valid
    ).length;
    return Math.round((validFields / fields.length) * 100);
  }

  // ✅ NUEVO: Clase para iconos según validación
  getFieldClass(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.touched) return '';
    return field.valid ? 'field-valid' : 'field-invalid';
  }

  onRegister(): void {
    if (this.registerForm.valid && !this.loading) {
      this.loading = true;
      this.errorMessage = '';

      const { name, username, email, password } = this.registerForm.value;
      const registerData: RegisterRequest = { name, username, email, password };

      console.log('📝 Registrando usuario:', { name, username, email });

      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          console.log('✅ Registro exitoso:', response);
          this.loading = false;

          const userName = response.user?.name || response.name || name;
          console.log(`🎉 Registro exitoso para: ${userName}`);

          // ✅ USAR SNACKBAR EN LUGAR DE ALERT
          this.snackBar.open(
            `¡Bienvenido ${userName}! Cuenta creada exitosamente.`,
            'Cerrar',
            {
              duration: 4000,
              panelClass: ['success-snackbar'],
            }
          );

          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('❌ Error en registro:', error);
          this.loading = false;
          this.errorMessage =
            error.error?.message ||
            'Error al crear la cuenta. Inténtalo de nuevo.';

          // ✅ USAR SNACKBAR PARA ERRORES
          this.snackBar.open(this.errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
