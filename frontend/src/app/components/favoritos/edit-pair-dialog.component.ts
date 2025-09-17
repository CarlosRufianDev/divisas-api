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

interface EditPairData {
  pair: {
    id: string;
    from: string;
    to: string;
    nickname: string;
    pair: string;
  };
}

@Component({
  selector: 'app-edit-pair-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon class="dialog-icon">edit</mat-icon>
        Editar {{ data.pair.pair }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="editForm" class="edit-form">
          <!-- Par (Solo lectura) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Par de Divisas</mat-label>
            <input matInput [value]="data.pair.pair" readonly />
            <mat-hint>No se puede cambiar el par de divisas</mat-hint>
          </mat-form-field>

          <!-- Divisas individuales (Solo lectura) -->
          <div class="currencies-display">
            <mat-form-field appearance="outline" class="currency-field">
              <mat-label>De</mat-label>
              <input matInput [value]="data.pair.from" readonly />
            </mat-form-field>

            <mat-icon class="arrow-icon">arrow_forward</mat-icon>

            <mat-form-field appearance="outline" class="currency-field">
              <mat-label>A</mat-label>
              <input matInput [value]="data.pair.to" readonly />
            </mat-form-field>
          </div>

          <!-- Nickname -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nickname</mat-label>
            <input
              matInput
              formControlName="nickname"
              placeholder="Ej: Mi par principal, Para inversiones..."
              maxlength="50"
            />
            <mat-hint>Nombre personalizado para este par</mat-hint>
            <span matTextSuffix
              >{{ editForm.get('nickname')?.value?.length || 0 }}/50</span
            >
          </mat-form-field>
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
        min-width: 450px;
        max-width: 550px;
      }

      .dialog-icon {
        color: #ff9800;
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

      .currencies-display {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 16px 0;
      }

      .currency-field {
        flex: 1;
      }

      .arrow-icon {
        color: #666;
        font-size: 1.5rem;
        margin-top: 8px;
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
export class EditPairDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditPairDialogComponent>);
  private snackBar = inject(MatSnackBar);
  public data = inject<EditPairData>(MAT_DIALOG_DATA);

  editForm: FormGroup;
  saving = false;

  constructor() {
    this.editForm = this.fb.group({
      nickname: [this.data.pair.nickname || '', [Validators.maxLength(50)]],
    });
  }

  hasChanges(): boolean {
    const formValue = this.editForm.value;
    return formValue.nickname !== this.data.pair.nickname;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.editForm.invalid || !this.hasChanges()) return;

    this.saving = true;
    const formValue = this.editForm.value;

    // El componente padre manejará la actualización real
    const updates = {
      nickname: formValue.nickname,
    };

    // Simular un delay para mostrar el loading
    setTimeout(() => {
      this.saving = false;
      this.snackBar.open(`✅ ${this.data.pair.pair} actualizado`, 'Cerrar', {
        duration: 2000,
        panelClass: ['success-snackbar'],
      });
      this.dialogRef.close(updates);
    }, 500);
  }
}
