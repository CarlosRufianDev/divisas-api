import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../shared/material.module';

interface EditCurrencyData {
  currency: {
    id: string;
    currency: string;
    nickname: string;
    priority: number;
    isDefault: boolean;
  };
}

interface CurrencyUpdatePayload {
  nickname?: string;
  priority?: number;
  isDefault?: boolean;
}

@Component({
  selector: 'app-edit-currency-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon class="dialog-icon">edit</mat-icon>
        Editar {{ data.currency.currency }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="editForm" class="edit-form">
          <!-- Divisa (Solo lectura) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Divisa</mat-label>
            <input matInput [value]="data.currency.currency" readonly />
            <mat-hint>No se puede cambiar la divisa</mat-hint>
          </mat-form-field>

          <!-- Nickname -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nickname</mat-label>
            <input
              matInput
              formControlName="nickname"
              placeholder="Ej: Mi divisa principal, Para viajes..."
              maxlength="50"
            />
            <mat-hint>Nombre personalizado para esta divisa</mat-hint>
            <span matTextSuffix
              >{{ editForm.get('nickname')?.value?.length || 0 }}/50</span
            >
          </mat-form-field>

          <!-- Prioridad -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="priority">
              <mat-option [value]="1">🌟 Alta (1)</mat-option>
              <mat-option [value]="2">⭐ Media-Alta (2)</mat-option>
              <mat-option [value]="3">🔸 Media (3)</mat-option>
              <mat-option [value]="4">🔹 Media-Baja (4)</mat-option>
              <mat-option [value]="5">⚪ Baja (5)</mat-option>
            </mat-select>
            <mat-hint>Orden de importancia para dropdowns</mat-hint>
          </mat-form-field>

          <!-- Marcar como predeterminada -->
          <div class="toggle-section">
            <mat-slide-toggle
              formControlName="isDefault"
              class="default-toggle"
            >
              <span class="toggle-label">
                <mat-icon>star</mat-icon>
                Marcar como divisa predeterminada
              </span>
            </mat-slide-toggle>
            <p class="toggle-hint">
              Solo una divisa puede ser predeterminada por usuario
            </p>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" color="warn">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>

        <button
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="editForm.invalid || saving || !hasChanges()"
        >
          <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!saving">save</mat-icon>
          {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        min-width: 400px;
        max-width: 500px;
      }

      .dialog-icon {
        color: #2196f3;
        margin-right: 8px;
      }

      .dialog-content {
        padding: 20px 0;
      }

      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      .toggle-section {
        margin: 16px 0;
      }

      .default-toggle {
        width: 100%;
      }

      .toggle-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #333;
      }

      .toggle-hint {
        margin: 8px 0 0 0;
        color: #666;
        font-size: 0.8rem;
      }

      .dialog-actions {
        display: flex;
        justify-content: space-between;
        padding: 16px 0;
        gap: 12px;
      }

      .dialog-actions button {
        flex: 1;
      }
    `,
  ],
})
export class EditCurrencyDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditCurrencyDialogComponent>);
  private snackBar = inject(MatSnackBar);
  public data = inject<EditCurrencyData>(MAT_DIALOG_DATA);

  editForm: FormGroup;
  saving = false;

  constructor() {
    this.editForm = this.fb.group({
      nickname: [this.data.currency.nickname || '', [Validators.maxLength(50)]],
      priority: [
        this.data.currency.priority,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
      isDefault: [this.data.currency.isDefault],
    });
  }

  hasChanges(): boolean {
    const formValue = this.editForm.value;
    return (
      formValue.nickname !== this.data.currency.nickname ||
      formValue.priority !== this.data.currency.priority ||
      formValue.isDefault !== this.data.currency.isDefault
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.editForm.invalid || !this.hasChanges()) return;

    this.saving = true;
    const formValue = this.editForm.value;

    // Preparar solo los campos que cambiaron
    const updates: CurrencyUpdatePayload = {};
    if (formValue.nickname !== this.data.currency.nickname) {
      updates.nickname = formValue.nickname;
    }
    if (formValue.priority !== this.data.currency.priority) {
      updates.priority = formValue.priority;
    }
    if (formValue.isDefault !== this.data.currency.isDefault) {
      updates.isDefault = formValue.isDefault;
    }

    // Simular respuesta exitosa (se conectará con el método updateFavoriteCurrency del componente padre)
    setTimeout(() => {
      this.saving = false;
      this.snackBar.open(
        `✅ ${this.data.currency.currency} actualizada`,
        'Cerrar',
        { duration: 2000, panelClass: ['success-snackbar'] }
      );
      this.dialogRef.close(updates);
    }, 500);
  }
}
