import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';

import { AuthService, RegisterRequest } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="logo">💱</div>
          <h1>DivisasPro</h1>
          <p>Crea tu cuenta gratuita</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
          <div class="form-field">
            <label>Nombre completo</label>
            <input
              type="text"
              formControlName="name"
              placeholder="Carlos Rufián"
              [class.error]="
                registerForm.get('name')?.invalid &&
                registerForm.get('name')?.touched
              "
            />
            <div
              class="error-text"
              *ngIf="
                registerForm.get('name')?.invalid &&
                registerForm.get('name')?.touched
              "
            >
              El nombre es requerido (mínimo 2 caracteres)
            </div>
          </div>

          <div class="form-field">
            <label>Nombre de usuario</label>
            <input
              type="text"
              formControlName="username"
              placeholder="usuario123"
              [class.error]="
                registerForm.get('username')?.invalid &&
                registerForm.get('username')?.touched
              "
            />
            <div
              class="error-text"
              *ngIf="
                registerForm.get('username')?.invalid &&
                registerForm.get('username')?.touched
              "
            >
              <span *ngIf="registerForm.get('username')?.hasError('required')"
                >El nombre de usuario es requerido</span
              >
              <span *ngIf="registerForm.get('username')?.hasError('minlength')"
                >Mínimo 3 caracteres</span
              >
              <span *ngIf="registerForm.get('username')?.hasError('maxlength')"
                >Máximo 20 caracteres</span
              >
            </div>
          </div>

          <div class="form-field">
            <label>Email</label>
            <input
              type="email"
              formControlName="email"
              placeholder="tu@email.com"
              [class.error]="
                registerForm.get('email')?.invalid &&
                registerForm.get('email')?.touched
              "
            />
            <div
              class="error-text"
              *ngIf="
                registerForm.get('email')?.invalid &&
                registerForm.get('email')?.touched
              "
            >
              <span *ngIf="registerForm.get('email')?.hasError('required')"
                >El email es requerido</span
              >
              <span *ngIf="registerForm.get('email')?.hasError('email')"
                >Formato de email inválido</span
              >
            </div>
          </div>

          <div class="form-field">
            <label>Contraseña</label>
            <input
              [type]="hidePassword ? 'password' : 'text'"
              formControlName="password"
              placeholder="Mínimo 6 caracteres"
              [class.error]="
                registerForm.get('password')?.invalid &&
                registerForm.get('password')?.touched
              "
            />
            <button
              type="button"
              class="toggle-password"
              (click)="hidePassword = !hidePassword"
            >
              {{ hidePassword ? '👁️' : '🙈' }}
            </button>
            <div
              class="error-text"
              *ngIf="
                registerForm.get('password')?.invalid &&
                registerForm.get('password')?.touched
              "
            >
              La contraseña debe tener al menos 6 caracteres
            </div>
          </div>

          <div class="form-field">
            <label>Confirmar contraseña</label>
            <input
              [type]="hideConfirmPassword ? 'password' : 'text'"
              formControlName="confirmPassword"
              placeholder="Repite tu contraseña"
              [class.error]="
                registerForm.get('confirmPassword')?.invalid &&
                registerForm.get('confirmPassword')?.touched
              "
            />
            <button
              type="button"
              class="toggle-password"
              (click)="hideConfirmPassword = !hideConfirmPassword"
            >
              {{ hideConfirmPassword ? '👁️' : '🙈' }}
            </button>
            <div
              class="error-text"
              *ngIf="
                registerForm.get('confirmPassword')?.invalid &&
                registerForm.get('confirmPassword')?.touched
              "
            >
              Las contraseñas no coinciden
            </div>
          </div>

          <button
            type="submit"
            class="register-button"
            [disabled]="registerForm.invalid || loading"
          >
            {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
          </button>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="login-link">
            ¿Ya tienes cuenta?
            <button type="button" class="link-button" (click)="goToLogin()">
              Inicia sesión aquí
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .register-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }

      .register-card {
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        width: 100%;
        max-width: 450px;
      }

      .register-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .logo {
        font-size: 48px;
        margin-bottom: 10px;
      }

      h1 {
        color: #333;
        margin: 10px 0;
        font-size: 24px;
      }

      p {
        color: #666;
        margin: 0 0 20px 0;
      }

      .form-field {
        margin-bottom: 20px;
        position: relative;
      }

      label {
        display: block;
        margin-bottom: 5px;
        color: #333;
        font-weight: 500;
        font-size: 14px;
      }

      input {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-size: 16px;
        transition: border-color 0.3s;
        box-sizing: border-box;
      }

      input:focus {
        outline: none;
        border-color: #667eea;
      }

      input.error {
        border-color: #f44336;
      }

      .error-text {
        color: #f44336;
        font-size: 12px;
        margin-top: 4px;
      }

      .toggle-password {
        position: absolute;
        right: 12px;
        top: 35px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
      }

      .register-button {
        width: 100%;
        padding: 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.3s;
        margin-bottom: 15px;
      }

      .register-button:hover:not(:disabled) {
        background: #5a6fd8;
      }

      .register-button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .error-message {
        color: #f44336;
        text-align: center;
        margin-bottom: 15px;
        padding: 10px;
        background: #ffebee;
        border-radius: 4px;
        font-size: 14px;
      }

      .login-link {
        text-align: center;
        color: #666;
        font-size: 14px;
      }

      .link-button {
        background: none;
        border: none;
        color: #667eea;
        cursor: pointer;
        text-decoration: underline;
        font-size: 14px;
      }

      .link-button:hover {
        color: #5a6fd8;
      }
    `,
  ],
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
    private router: Router
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
        ], // ✅ NUEVO
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

  onRegister(): void {
    if (this.registerForm.valid && !this.loading) {
      this.loading = true;
      this.errorMessage = '';

      const { name, username, email, password } = this.registerForm.value; // ✅ AÑADIR username
      const registerData: RegisterRequest = { name, username, email, password }; // ✅ INCLUIR username

      console.log('📝 Registrando usuario:', { name, username, email }); // ✅ MOSTRAR username

      this.authService.register(registerData).subscribe({
        next: (response: any) => {
          console.log('✅ Registro exitoso:', response);
          this.loading = false;

          const userName = response.user?.name || response.name || name;
          console.log(`🎉 Registro exitoso para: ${userName}`);

          alert(
            `¡Bienvenido ${userName}! Tu cuenta ha sido creada exitosamente.`
          );
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('❌ Error en registro:', error);
          this.loading = false;
          this.errorMessage =
            error.error?.message ||
            'Error al crear la cuenta. Inténtalo de nuevo.';
        },
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
