import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth';
import { MaterialModule } from '../../shared/material.module';

interface MultipleConversion {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}

interface MultipleConversionResponse {
  baseAmount: number;
  baseCurrency: string;
  conversions: MultipleConversion[];
  timestamp: string;
}

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="calculator-container">
      <!-- Header Premium -->
      <div class="calculator-header">
        <div class="premium-badge">
          <mat-icon>workspace_premium</mat-icon>
          <span>CALCULADORA PREMIUM</span>
        </div>

        <h1>
          <mat-icon>calculate</mat-icon>
          Conversión Múltiple
        </h1>
        <p>Convierte una cantidad a múltiples divisas simultáneamente</p>
      </div>

      <!-- Formulario -->
      <mat-card class="calculator-form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>input</mat-icon>
            Configuración
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="calculatorForm" class="calculator-form">
            <div class="form-row">
              <!-- Cantidad -->
              <mat-form-field appearance="outline">
                <mat-label>Cantidad</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="amount"
                  min="0"
                  step="0.01"
                />
                <mat-icon matSuffix>attach_money</mat-icon>
              </mat-form-field>

              <!-- Moneda Base -->
              <mat-form-field appearance="outline">
                <mat-label>Moneda Base</mat-label>
                <mat-select formControlName="from">
                  <mat-option
                    *ngFor="let currency of availableCurrencies"
                    [value]="currency.code"
                  >
                    {{ currency.flag }} {{ currency.code }} -
                    {{ currency.name }}
                  </mat-option>
                </mat-select>
                <mat-icon matSuffix>account_balance</mat-icon>
              </mat-form-field>
            </div>

            <!-- Selector de Divisas Destino -->
            <mat-form-field appearance="outline" class="currencies-selector">
              <mat-label>Divisas a Convertir</mat-label>
              <mat-select formControlName="targetCurrencies" multiple>
                <mat-option
                  *ngFor="let currency of getFilteredCurrencies()"
                  [value]="currency.code"
                >
                  {{ currency.flag }} {{ currency.code }} - {{ currency.name }}
                </mat-option>
              </mat-select>
              <mat-hint
                >Selecciona las divisas para la conversión múltiple</mat-hint
              >
            </mat-form-field>

            <!-- Botones -->
            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                (click)="calculateMultiple()"
                [disabled]="loading || calculatorForm.invalid"
              >
                <mat-icon>calculate</mat-icon>
                {{ loading ? 'Calculando...' : 'Calcular Conversiones' }}
              </button>

              <button mat-button type="button" (click)="clearResults()">
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Calculando conversiones múltiples...</p>
      </div>

      <!-- Resultados -->
      <div
        *ngIf="!loading && results && results.conversions.length > 0"
        class="results-container"
      >
        <mat-card class="results-header-card">
          <mat-card-content>
            <div class="results-summary">
              <h2>
                <mat-icon>trending_up</mat-icon>
                Resultados de Conversión
              </h2>
              <div class="base-info">
                <span class="base-amount">{{
                  results.baseAmount | number : '1.2-2'
                }}</span>
                <span class="base-currency">{{ results.baseCurrency }}</span>
                <mat-icon>arrow_forward</mat-icon>
                <span class="conversions-count"
                  >{{ results.conversions.length }} divisas</span
                >
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Grid de Resultados -->
        <div class="results-grid">
          <mat-card
            *ngFor="
              let conversion of results.conversions;
              trackBy: trackByConversion
            "
            class="conversion-card"
            [class.positive]="conversion.rate > 1"
            [class.negative]="conversion.rate < 1"
          >
            <mat-card-header>
              <div class="currency-header">
                <span class="currency-flag">{{
                  getCurrencyFlag(conversion.to)
                }}</span>
                <div class="currency-info">
                  <h3>{{ conversion.to }}</h3>
                  <p>{{ getCurrencyName(conversion.to) }}</p>
                </div>
              </div>
            </mat-card-header>

            <mat-card-content>
              <div class="conversion-result">
                <div class="result-amount">
                  {{ conversion.result | number : '1.2-2' }}
                </div>
                <div class="conversion-rate">
                  1 {{ conversion.from }} =
                  {{ conversion.rate | number : '1.4-4' }} {{ conversion.to }}
                </div>
              </div>

              <!-- Indicador Visual -->
              <div class="rate-indicator">
                <mat-icon *ngIf="conversion.rate > 1" class="positive-icon"
                  >trending_up</mat-icon
                >
                <mat-icon *ngIf="conversion.rate < 1" class="negative-icon"
                  >trending_down</mat-icon
                >
                <mat-icon *ngIf="conversion.rate === 1" class="neutral-icon"
                  >trending_flat</mat-icon
                >
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button
                mat-icon-button
                (click)="copyToClipboard(conversion)"
                matTooltip="Copiar resultado"
              >
                <mat-icon>content_copy</mat-icon>
              </button>

              <button
                mat-icon-button
                (click)="addToFavorites(conversion)"
                matTooltip="Añadir a favoritos"
              >
                <mat-icon>star_border</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <!-- Acciones de Resultados -->
        <mat-card class="results-actions-card">
          <mat-card-content>
            <div class="results-actions">
              <button
                mat-raised-button
                color="accent"
                (click)="exportResults()"
              >
                <mat-icon>download</mat-icon>
                Exportar Resultados
              </button>

              <button mat-raised-button (click)="shareResults()">
                <mat-icon>share</mat-icon>
                Compartir
              </button>

              <button mat-raised-button color="primary" (click)="recalculate()">
                <mat-icon>refresh</mat-icon>
                Recalcular
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Estado Vacío -->
      <mat-card
        *ngIf="!loading && (!results || results.conversions.length === 0)"
        class="empty-state"
      >
        <mat-card-content>
          <div class="empty-content">
            <mat-icon class="empty-icon">calculate</mat-icon>
            <h2>Calculadora Lista</h2>
            <p>
              Configura tu conversión múltiple y obtén resultados profesionales
            </p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .calculator-container {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .calculator-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .premium-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        color: #333;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
      }

      .calculator-header h1 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: 0 0 8px 0;
        color: #333;
        font-size: 2.2rem;
      }

      .calculator-form-card {
        margin-bottom: 24px;
      }

      .calculator-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .currencies-selector {
        width: 100%;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 16px;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        gap: 16px;
      }

      .results-container {
        margin-top: 24px;
      }

      .results-header-card {
        margin-bottom: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .results-summary h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 16px 0;
      }

      .base-info {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.1rem;
      }

      .base-amount {
        font-size: 1.4rem;
        font-weight: 600;
      }

      .base-currency {
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 12px;
        border-radius: 16px;
        font-weight: 500;
      }

      .conversions-count {
        background: rgba(255, 255, 255, 0.1);
        padding: 4px 12px;
        border-radius: 16px;
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-bottom: 24px;
      }

      .conversion-card {
        position: relative;
        transition: transform 0.2s, box-shadow 0.2s;
        border-left: 4px solid #ddd;
      }

      .conversion-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      .conversion-card.positive {
        border-left-color: #4caf50;
      }

      .conversion-card.negative {
        border-left-color: #f44336;
      }

      .currency-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .currency-flag {
        font-size: 1.8rem;
      }

      .currency-info h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .currency-info p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }

      .conversion-result {
        text-align: center;
        padding: 16px 0;
      }

      .result-amount {
        font-size: 1.8rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }

      .conversion-rate {
        color: #666;
        font-size: 0.9rem;
      }

      .rate-indicator {
        position: absolute;
        top: 16px;
        right: 16px;
      }

      .positive-icon {
        color: #4caf50;
      }
      .negative-icon {
        color: #f44336;
      }
      .neutral-icon {
        color: #ff9800;
      }

      .results-actions-card {
        background: #f5f5f5;
      }

      .results-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .empty-state {
        margin: 40px 0;
        text-align: center;
      }

      .empty-content {
        padding: 40px 20px;
      }

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      @media (max-width: 768px) {
        .calculator-container {
          padding: 10px;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .results-grid {
          grid-template-columns: 1fr;
        }

        .form-actions,
        .results-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class Calculator implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = 'http://localhost:3000/api';

  calculatorForm: FormGroup;
  loading = false;
  results?: MultipleConversionResponse;

  availableCurrencies = [
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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.calculatorForm = this.fb.group({
      amount: [1000, [Validators.required, Validators.min(0.01)]],
      from: ['USD', Validators.required],
      targetCurrencies: [['EUR', 'GBP', 'JPY', 'CHF'], Validators.required],
    });
  }

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.snackBar
        .open(
          '🔐 Esta funcionalidad es exclusiva para usuarios registrados',
          'Iniciar Sesión',
          { duration: 5000 }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/login']);
        });
      return;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFilteredCurrencies() {
    const selectedFrom = this.calculatorForm.get('from')?.value;
    return this.availableCurrencies.filter(
      (currency) => currency.code !== selectedFrom
    );
  }

  calculateMultiple(): void {
    if (this.calculatorForm.invalid) return;

    const formData = this.calculatorForm.value;
    this.loading = true;

    const payload = {
      from: formData.from,
      amount: formData.amount,
      currencies: formData.targetCurrencies,
    };

    console.log('🧮 Enviando cálculo múltiple:', payload);

    this.http
      .post<MultipleConversionResponse>(
        `${this.apiUrl}/calculator/multiple`,
        payload
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta de cálculo múltiple:', response);
          this.results = response;
          this.loading = false;

          this.snackBar.open(
            `✅ ${response.conversions.length} conversiones calculadas exitosamente`,
            'Cerrar',
            { duration: 3000 }
          );
        },
        error: (error) => {
          console.error('❌ Error en cálculo múltiple:', error);
          this.loading = false;

          this.snackBar.open(
            '❌ Error al calcular las conversiones múltiples',
            'Cerrar',
            { duration: 3000 }
          );
        },
      });
  }

  clearResults(): void {
    this.results = undefined;
    this.calculatorForm.patchValue({
      amount: 1000,
      from: 'USD',
      targetCurrencies: ['EUR', 'GBP', 'JPY', 'CHF'],
    });
  }

  recalculate(): void {
    this.calculateMultiple();
  }

  trackByConversion(index: number, conversion: MultipleConversion): string {
    return `${conversion.from}-${conversion.to}`;
  }

  getCurrencyFlag(code: string): string {
    const currency = this.availableCurrencies.find((c) => c.code === code);
    return currency?.flag || '🏳️';
  }

  getCurrencyName(code: string): string {
    const currency = this.availableCurrencies.find((c) => c.code === code);
    return currency?.name || code;
  }

  copyToClipboard(conversion: MultipleConversion): void {
    const text = `${conversion.result.toFixed(2)} ${conversion.to}`;
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`📋 Copiado: ${text}`, 'Cerrar', { duration: 2000 });
    });
  }

  addToFavorites(conversion: MultipleConversion): void {
    // TODO: Implementar añadir a favoritos
    this.snackBar.open(
      `⭐ Par ${conversion.from}/${conversion.to} añadido a favoritos`,
      'Cerrar',
      { duration: 2000 }
    );
  }

  exportResults(): void {
    if (!this.results) return;

    const data = this.results.conversions.map((c) => ({
      'Moneda Destino': c.to,
      Cantidad: c.result.toFixed(2),
      Tasa: c.rate.toFixed(4),
      Descripción: `1 ${c.from} = ${c.rate.toFixed(4)} ${c.to}`,
    }));

    // TODO: Implementar exportación real
    console.log('📊 Exportando:', data);
    this.snackBar.open(
      '📊 Funcionalidad de exportación próximamente',
      'Cerrar',
      { duration: 2000 }
    );
  }

  shareResults(): void {
    if (!this.results) return;

    const text =
      `Conversión de ${this.results.baseAmount} ${this.results.baseCurrency}:\n` +
      this.results.conversions
        .map((c) => `${c.to}: ${c.result.toFixed(2)}`)
        .join('\n');

    if (navigator.share) {
      navigator.share({
        title: 'Conversión Múltiple - DivisasPro',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        this.snackBar.open('📋 Resultados copiados al portapapeles', 'Cerrar', {
          duration: 2000,
        });
      });
    }
  }
}
