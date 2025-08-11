import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { MaterialModule } from '../../shared/material.module';

interface Currency {
  code: string;
  name: string;
  flag: string;
}

interface DialogData {
  availableCurrencies: string[];
}

@Component({
  selector: 'app-add-favorite-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon class="dialog-icon">star</mat-icon>
        Añadir Par Favorito
      </h2>

      <mat-dialog-content class="dialog-content">
        <p class="dialog-description">
          Selecciona un par de divisas para monitorear en tiempo real
        </p>

        <form [formGroup]="favoriteForm" class="favorite-form">
          <!-- Moneda Base (FROM) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Moneda Base</mat-label>
            <mat-select
              formControlName="from"
              (selectionChange)="onFromCurrencyChange()"
            >
              <mat-option
                *ngFor="let currency of currencies"
                [value]="currency.code"
              >
                <span class="currency-option">
                  <span class="flag">{{ currency.flag }}</span>
                  <span class="code">{{ currency.code }}</span>
                  <span class="name">{{ currency.name }}</span>
                </span>
              </mat-option>
            </mat-select>
            <mat-hint>Moneda que quieres convertir</mat-hint>
          </mat-form-field>

          <!-- Swap Button -->
          <div class="swap-container">
            <button
              mat-icon-button
              type="button"
              class="swap-btn"
              color="primary"
              (click)="swapCurrencies()"
              matTooltip="Intercambiar monedas"
            >
              <mat-icon>swap_vert</mat-icon>
            </button>
          </div>

          <!-- Moneda Destino (TO) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Moneda Destino</mat-label>
            <mat-select formControlName="to">
              <mat-option
                *ngFor="let currency of getFilteredToCurrencies()"
                [value]="currency.code"
              >
                <span class="currency-option">
                  <span class="flag">{{ currency.flag }}</span>
                  <span class="code">{{ currency.code }}</span>
                  <span class="name">{{ currency.name }}</span>
                </span>
              </mat-option>
            </mat-select>
            <mat-hint>Moneda a la que quieres convertir</mat-hint>
          </mat-form-field>

          <!-- Preview del Par -->
          <div
            class="pair-preview"
            *ngIf="
              favoriteForm.get('from')?.value && favoriteForm.get('to')?.value
            "
          >
            <mat-icon class="preview-icon">trending_up</mat-icon>
            <span class="preview-text">
              {{ favoriteForm.get('from')?.value }}/{{
                favoriteForm.get('to')?.value
              }}
            </span>
            <span class="preview-description">
              Monitorearás
              {{ getCurrencyName(favoriteForm.get('from')?.value) }} a
              {{ getCurrencyName(favoriteForm.get('to')?.value) }}
            </span>
          </div>

          <!-- Nickname (Opcional) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nickname (Opcional)</mat-label>
            <input
              matInput
              formControlName="nickname"
              placeholder="Ej: Mi inversión EUR, Gastos en UK..."
              maxlength="50"
            />
            <mat-hint>Dale un nombre personalizado a este par</mat-hint>
            <span matTextSuffix
              >{{ favoriteForm.get('nickname')?.value?.length || 0 }}/50</span
            >
          </mat-form-field>

          <!-- Tasa Actual (Preview) -->
          <div class="current-rate" *ngIf="currentRate">
            <mat-icon class="rate-icon">attach_money</mat-icon>
            <div class="rate-info">
              <span class="rate-label">Tasa Actual:</span>
              <span class="rate-value"
                >1 {{ favoriteForm.get('from')?.value }} =
                {{ currentRate | number : '1.4-4' }}
                {{ favoriteForm.get('to')?.value }}</span
              >
            </div>
          </div>

          <!-- Loading Rate -->
          <div class="loading-rate" *ngIf="loadingRate">
            <mat-spinner diameter="20"></mat-spinner>
            <span>Obteniendo tasa actual...</span>
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
          [disabled]="favoriteForm.invalid || saving"
        >
          <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!saving">star</mat-icon>
          {{ saving ? 'Guardando...' : 'Añadir a Favoritos' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        min-width: 500px;
        max-width: 600px;
      }

      .dialog-icon {
        color: #ff9800;
        margin-right: 8px;
      }

      .dialog-content {
        padding: 20px 0;
      }

      .dialog-description {
        color: #666;
        margin-bottom: 20px;
        text-align: center;
      }

      .favorite-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      .swap-container {
        display: flex;
        justify-content: center;
        margin: -8px 0;
      }

      .swap-btn {
        background: #f5f5f5;
        border: 2px dashed #ddd;
      }

      .currency-option {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .flag {
        font-size: 1.2rem;
        min-width: 24px;
      }

      .code {
        font-weight: 600;
        min-width: 40px;
      }

      .name {
        color: #666;
        font-size: 0.9rem;
      }

      .pair-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
        border-radius: 8px;
        border: 1px solid #ddd;
      }

      .preview-icon {
        color: #2196f3;
      }

      .preview-text {
        font-weight: 600;
        font-size: 1.1rem;
        color: #2196f3;
      }

      .preview-description {
        color: #666;
        font-size: 0.9rem;
        flex: 1;
        text-align: right;
      }

      .current-rate {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: #f9f9f9;
        border-radius: 6px;
        border-left: 4px solid #4caf50;
      }

      .rate-icon {
        color: #4caf50;
      }

      .rate-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .rate-label {
        font-size: 0.8rem;
        color: #666;
      }

      .rate-value {
        font-weight: 600;
        color: #4caf50;
      }

      .loading-rate {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        color: #666;
        justify-content: center;
      }

      .dialog-actions {
        padding: 16px 0 0 0;
        justify-content: space-between;
      }

      .dialog-actions button {
        min-width: 120px;
      }

      @media (max-width: 600px) {
        .dialog-container {
          min-width: 300px;
          max-width: 400px;
        }
      }
    `,
  ],
})
export class AddFavoriteDialogComponent implements OnInit {
  favoriteForm: FormGroup;
  currencies: Currency[] = [];
  currentRate: number | null = null;
  loadingRate = false;
  saving = false;
  private apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddFavoriteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.favoriteForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      nickname: ['', [Validators.maxLength(50)]],
    });
  }

  ngOnInit(): void {
    this.initializeCurrencies();
    this.setupFormSubscriptions();
  }

  initializeCurrencies(): void {
    // Lista completa de divisas con banderas
    this.currencies = [
      { code: 'USD', name: 'Dólar Estadounidense', flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
      { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
      { code: 'JPY', name: 'Yen Japonés', flag: '🇯🇵' },
      { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭' },
      { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦' },
      { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
      { code: 'CNY', name: 'Yuan Chino', flag: '🇨🇳' },
      { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽' },
      { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷' },
      { code: 'KRW', name: 'Won Surcoreano', flag: '🇰🇷' },
      { code: 'INR', name: 'Rupia India', flag: '🇮🇳' },
      { code: 'SEK', name: 'Corona Sueca', flag: '🇸🇪' },
      { code: 'NOK', name: 'Corona Noruega', flag: '🇳🇴' },
      { code: 'HKD', name: 'Dólar de Hong Kong', flag: '🇭🇰' },
      { code: 'SGD', name: 'Dólar de Singapur', flag: '🇸🇬' },
      { code: 'NZD', name: 'Dólar Neozelandés', flag: '🇳🇿' },
      { code: 'ZAR', name: 'Rand Sudafricano', flag: '🇿🇦' },
      { code: 'TRY', name: 'Lira Turca', flag: '🇹🇷' },
      { code: 'PLN', name: 'Zloty Polaco', flag: '🇵🇱' },
    ];

    // Establecer USD como moneda base por defecto
    this.favoriteForm.patchValue({ from: 'USD' });
  }

  setupFormSubscriptions(): void {
    // Obtener tasa cuando cambian las monedas
    this.favoriteForm.valueChanges.subscribe(() => {
      this.getCurrentRate();
    });
  }

  onFromCurrencyChange(): void {
    const fromCurrency = this.favoriteForm.get('from')?.value;
    const toCurrency = this.favoriteForm.get('to')?.value;

    // Si las monedas son iguales, limpiar 'to'
    if (fromCurrency === toCurrency) {
      this.favoriteForm.patchValue({ to: '' });
    }
  }

  getFilteredToCurrencies(): Currency[] {
    const fromCurrency = this.favoriteForm.get('from')?.value;
    return this.currencies.filter((currency) => currency.code !== fromCurrency);
  }

  swapCurrencies(): void {
    const fromValue = this.favoriteForm.get('from')?.value;
    const toValue = this.favoriteForm.get('to')?.value;

    if (fromValue && toValue) {
      this.favoriteForm.patchValue({
        from: toValue,
        to: fromValue,
      });
    }
  }

  getCurrencyName(code: string): string {
    const currency = this.currencies.find((c) => c.code === code);
    return currency ? currency.name : code;
  }

  getCurrentRate(): void {
    const form = this.favoriteForm;
    const from = form.get('from')?.value;
    const to = form.get('to')?.value;

    if (!from || !to || from === to) {
      this.currentRate = null;
      return;
    }

    this.loadingRate = true;
    this.currentRate = null;

    const payload = { from, to, amount: 1 };

    this.http.post<any>(`${this.apiUrl}/convert`, payload).subscribe({
      next: (response) => {
        this.currentRate = response.rate;
        this.loadingRate = false;
      },
      error: (error) => {
        console.error('Error obteniendo tasa:', error);
        this.loadingRate = false;
        this.currentRate = null;
      },
    });
  }

  onSave(): void {
    if (this.favoriteForm.invalid) return;

    this.saving = true;
    const formValue = this.favoriteForm.value;

    const payload = {
      from: formValue.from,
      to: formValue.to,
      nickname: formValue.nickname || `${formValue.from}/${formValue.to}`,
    };

    this.http.post<any>(`${this.apiUrl}/favorites`, payload).subscribe({
      next: (response) => {
        this.saving = false;
        this.snackBar.open(
          `✅ ${payload.from}/${payload.to} añadido a favoritos`,
          'Cerrar',
          { duration: 3000 }
        );
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error añadiendo favorito:', error);
        this.saving = false;

        let errorMessage = '❌ Error al añadir favorito';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.snackBar.open(errorMessage, 'Cerrar', { duration: 4000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
