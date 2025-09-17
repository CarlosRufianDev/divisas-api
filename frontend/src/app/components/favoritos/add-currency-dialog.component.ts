import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { MaterialModule } from '../../shared/material.module';

interface Currency {
  code: string;
  name: string;
  flag: string;
}

interface ExchangeRateResponse {
  rates: Record<string, number>;
  date: string;
}

interface AddCurrencyResponse {
  message: string;
  favoriteCurrency: {
    id: string;
    currency: string;
    nickname: string;
    priority: number;
    isDefault: boolean;
  };
}

@Component({
  selector: 'app-add-currency-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon class="dialog-icon">monetization_on</mat-icon>
        Añadir Divisa Favorita
      </h2>

      <mat-dialog-content class="dialog-content">
        <p class="dialog-description">
          Selecciona una divisa para monitorear su tipo de cambio vs EUR
        </p>

        <form [formGroup]="currencyForm" class="currency-form">
          <!-- Selector de Divisa -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Divisa</mat-label>
            <mat-select
              formControlName="currency"
              (selectionChange)="onCurrencyChange()"
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
            <mat-hint>Elige la divisa que quieres monitorear</mat-hint>
          </mat-form-field>

          <!-- Preview de la Divisa -->
          <div
            class="currency-preview"
            *ngIf="currencyForm.get('currency')?.value"
          >
            <mat-icon class="preview-icon">trending_up</mat-icon>
            <span class="preview-text">
              {{ currencyForm.get('currency')?.value }}
            </span>
            <span class="preview-description">
              Monitorearás
              {{ getCurrencyName(currencyForm.get('currency')?.value) }}
            </span>
          </div>

          <!-- Nickname (Opcional) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nickname (Opcional)</mat-label>
            <input
              matInput
              formControlName="nickname"
              placeholder="Ej: Mi divisa principal, Para viajes..."
              maxlength="50"
            />
            <mat-hint>Dale un nombre personalizado a esta divisa</mat-hint>
            <span matTextSuffix
              >{{ currencyForm.get('nickname')?.value?.length || 0 }}/50</span
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
          <mat-slide-toggle formControlName="isDefault" class="default-toggle">
            <span class="toggle-label">
              <mat-icon>star</mat-icon>
              Marcar como divisa predeterminada
            </span>
          </mat-slide-toggle>

          <!-- Tasa Actual (Preview) -->
          <div class="current-rate" *ngIf="currentRate">
            <mat-icon class="rate-icon">attach_money</mat-icon>
            <div class="rate-info">
              <span class="rate-label">Tasa Actual:</span>
              <span class="rate-value"
                >1 EUR = {{ currentRate | number : '1.4-4' }}
                {{ currencyForm.get('currency')?.value }}</span
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
          [disabled]="currencyForm.invalid || saving"
        >
          <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!saving">monetization_on</mat-icon>
          {{ saving ? 'Guardando...' : 'Añadir a Favoritas' }}
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

      .currency-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
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

      .currency-preview {
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

      .default-toggle {
        margin: 16px 0;
      }

      .toggle-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #333;
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
export class AddCurrencyDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<AddCurrencyDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private apiUrl = environment.apiUrl;

  currencyForm: FormGroup;
  saving = false;
  loadingRate = false;
  currentRate: number | null = null;

  currencies: Currency[] = [
    { code: 'USD', name: 'Dólar Estadounidense', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
    { code: 'JPY', name: 'Yen Japonés', flag: '🇯🇵' },
    { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭' },
    { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
    { code: 'CNY', name: 'Yuan Chino', flag: '🇨🇳' },
    { code: 'KRW', name: 'Won Surcoreano', flag: '🇰🇷' },
    { code: 'INR', name: 'Rupia India', flag: '🇮🇳' },
    { code: 'BRL', name: 'Real Brasileño', flag: '🇧🇷' },
    { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽' },
    { code: 'SEK', name: 'Corona Sueca', flag: '🇸🇪' },
    { code: 'NOK', name: 'Corona Noruega', flag: '🇳🇴' },
    { code: 'DKK', name: 'Corona Danesa', flag: '🇩🇰' },
    { code: 'PLN', name: 'Złoty Polaco', flag: '🇵🇱' },
    { code: 'CZK', name: 'Corona Checa', flag: '🇨🇿' },
    { code: 'HUF', name: 'Forint Húngaro', flag: '🇭🇺' },
    { code: 'TRY', name: 'Lira Turca', flag: '🇹🇷' },
    { code: 'ZAR', name: 'Rand Sudafricano', flag: '🇿🇦' },
    { code: 'SGD', name: 'Dólar Singapurense', flag: '🇸🇬' },
    { code: 'HKD', name: 'Dólar Hong Kong', flag: '🇭🇰' },
    { code: 'NZD', name: 'Dólar Neozelandés', flag: '🇳🇿' },
    { code: 'THB', name: 'Baht Tailandés', flag: '🇹🇭' },
    { code: 'MYR', name: 'Ringgit Malayo', flag: '🇲🇾' },
    { code: 'PHP', name: 'Peso Filipino', flag: '🇵🇭' },
    { code: 'IDR', name: 'Rupia Indonesia', flag: '🇮🇩' },
    { code: 'ILS', name: 'Nuevo Shekel', flag: '🇮🇱' },
    { code: 'RON', name: 'Leu Rumano', flag: '🇷🇴' },
    { code: 'BGN', name: 'Lev Búlgaro', flag: '🇧🇬' },
    { code: 'ISK', name: 'Corona Islandesa', flag: '🇮🇸' },
  ];

  constructor() {
    this.currencyForm = this.fb.group({
      currency: ['', Validators.required],
      nickname: [''],
      priority: [1, Validators.required],
      isDefault: [false],
    });
  }

  ngOnInit(): void {
    console.log('🎯 Dialog de añadir divisa inicializado');
  }

  onCurrencyChange(): void {
    const currency = this.currencyForm.get('currency')?.value;
    if (currency) {
      this.loadCurrentRate(currency);
    }
  }

  async loadCurrentRate(currency: string): Promise<void> {
    this.loadingRate = true;
    this.currentRate = null;

    try {
      const response = await this.http
        .get<ExchangeRateResponse>(
          `${this.apiUrl}/monedas/ultimo?from=EUR&to=${currency}`
        )
        .toPromise();

      if (response) {
        this.currentRate = response.rates[currency];
      }
      this.loadingRate = false;
    } catch (error) {
      console.error('❌ Error obteniendo tasa:', error);
      this.loadingRate = false;
    }
  }

  getCurrencyName(code: string): string {
    const currency = this.currencies.find((c) => c.code === code);
    return currency ? currency.name : code;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.currencyForm.invalid) return;

    this.saving = true;
    const formData = this.currencyForm.value;

    this.http
      .post<AddCurrencyResponse>(`${this.apiUrl}/favorite-currencies`, formData)
      .subscribe({
        next: (response) => {
          this.snackBar.open(
            `✅ ${formData.currency} añadida a favoritas`,
            'Cerrar',
            { duration: 2000, panelClass: ['success-snackbar'] }
          );
          this.dialogRef.close(response.favoriteCurrency);
        },
        error: (error) => {
          console.error('❌ Error añadiendo divisa:', error);
          const message =
            error.status === 409
              ? 'Esta divisa ya está en tus favoritas'
              : 'Error al añadir la divisa';
          this.snackBar.open(`❌ ${message}`, 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
          this.saving = false;
        },
      });
  }
}
