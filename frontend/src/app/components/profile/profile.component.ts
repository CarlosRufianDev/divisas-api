import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ProfileData, ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class Profile implements OnInit {
  profileData: ProfileData | null = null;
  passwordForm: FormGroup;
  emailForm: FormGroup;
  usernameForm: FormGroup;
  deleteForm: FormGroup;

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  hideEmailPassword = true;
  hideDeletePassword = true;

  loading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });

    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.usernameForm = this.fb.group({
      newUsername: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.deleteForm = this.fb.group({
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profileData = data;
        this.usernameForm.patchValue({ newUsername: data.name || '' });
        this.emailForm.patchValue({ newEmail: data.email });
      },
      error: (error) => {
        this.showError('Error al cargar el perfil');
        console.error('Error:', error);
      },
    });
  }

  onChangePassword() {
    if (this.passwordForm.valid) {
      const { currentPassword, newPassword, confirmPassword } =
        this.passwordForm.value;

      if (newPassword !== confirmPassword) {
        this.showError('Las contraseñas no coinciden');
        return;
      }

      this.loading = true;
      this.profileService
        .changePassword({ currentPassword, newPassword })
        .subscribe({
          next: (response) => {
            this.showSuccess(response.message);
            this.passwordForm.reset();
            this.loading = false;
          },
          error: (error) => {
            this.showError(
              error.error?.message || 'Error al cambiar contraseña'
            );
            this.loading = false;
          },
        });
    }
  }

  onChangeEmail() {
    if (this.emailForm.valid) {
      this.loading = true;
      this.profileService.changeEmail(this.emailForm.value).subscribe({
        next: (response) => {
          this.showSuccess(response.message);
          this.loadProfile();
          this.emailForm.patchValue({ password: '' });
          this.loading = false;
        },
        error: (error) => {
          this.showError(error.error?.message || 'Error al cambiar email');
          this.loading = false;
        },
      });
    }
  }

  onChangeUsername() {
    if (this.usernameForm.valid) {
      this.loading = true;
      this.profileService.changeUsername(this.usernameForm.value).subscribe({
        next: (response) => {
          this.showSuccess(response.message);
          this.loadProfile();
          this.loading = false;
        },
        error: (error) => {
          this.showError(
            error.error?.message || 'Error al cambiar nombre de usuario'
          );
          this.loading = false;
        },
      });
    }
  }

  onDeleteAccount() {
    if (this.deleteForm.valid) {
      const confirmDelete = confirm(
        '¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción no se puede deshacer. Se eliminarán todos tus datos permanentemente.'
      );

      if (confirmDelete) {
        this.loading = true;
        this.profileService.deleteAccount(this.deleteForm.value).subscribe({
          next: (response) => {
            this.showSuccess(response.message);
            this.authService.logout();
            this.router.navigate(['/login']);
          },
          error: (error) => {
            this.showError(error.error?.message || 'Error al eliminar cuenta');
            this.loading = false;
          },
        });
      }
    }
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
