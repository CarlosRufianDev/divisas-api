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
import { environment } from '../../../environments/environment';
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
        <mat-spinner diameter="60"></mat-spinner>
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
                  results.baseAmount | number : '1.2-2' : 'es-ES'
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
                  {{ conversion.result | number : '1.2-2' : 'es-ES' }}
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
  styleUrl: './calculator.scss', // ✅ USAR ARCHIVO SCSS EXTERNO
})
export class Calculator implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiUrl;

  calculatorForm: FormGroup;
  loading = false;
  results?: MultipleConversionResponse;

  // ✅ MISMA LISTA QUE OTROS COMPONENTES (31 monedas)
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
    // ✅ NUEVAS MONEDAS:
    { code: 'BGN', name: 'Lev Búlgaro', flag: '🇧🇬' },
    { code: 'CZK', name: 'Corona Checa', flag: '🇨🇿' },
    { code: 'DKK', name: 'Corona Danesa', flag: '🇩🇰' },
    { code: 'HUF', name: 'Florín Húngaro', flag: '🇭🇺' },
    { code: 'IDR', name: 'Rupia Indonesia', flag: '🇮🇩' },
    { code: 'ILS', name: 'Shekel Israelí', flag: '🇮🇱' },
    { code: 'ISK', name: 'Corona Islandesa', flag: '🇮🇸' },
    { code: 'MYR', name: 'Ringgit Malayo', flag: '🇲🇾' },
    { code: 'PHP', name: 'Peso Filipino', flag: '🇵🇭' },
    { code: 'RON', name: 'Leu Rumano', flag: '🇷🇴' },
    { code: 'THB', name: 'Baht Tailandés', flag: '🇹🇭' },
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
          {
            duration: 5000,
            panelClass: ['warning-snackbar'],
          }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/login']);
        });
      return;
    }

    console.log('🧮 Componente Calculadora iniciado');
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
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
            }
          );
        },
        error: (error) => {
          console.error('❌ Error en cálculo múltiple:', error);
          this.loading = false;

          this.snackBar.open(
            '❌ Error al calcular las conversiones múltiples',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
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

    this.snackBar.open('Formulario reiniciado', 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar'],
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
    const text = `${conversion.result.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${conversion.to}`;
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`📋 Copiado: ${text}`, 'Cerrar', {
        duration: 2000,
        panelClass: ['success-snackbar'],
      });
    });
  }

  addToFavorites(conversion: MultipleConversion): void {
    // TODO: Implementar añadir a favoritos
    this.snackBar.open(
      `⭐ Par ${conversion.from}/${conversion.to} añadido a favoritos`,
      'Cerrar',
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  exportResults(): void {
    if (!this.results) return;

    const data = this.results.conversions.map((c) => ({
      'Moneda Destino': c.to,
      Cantidad: c.result.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      Tasa: c.rate.toLocaleString('es-ES', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      Descripción: `1 ${c.from} = ${c.rate.toLocaleString('es-ES', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })} ${c.to}`,
    }));

    // TODO: Implementar exportación real
    console.log('📊 Exportando:', data);
    this.snackBar.open(
      '📊 Funcionalidad de exportación próximamente',
      'Cerrar',
      {
        duration: 2000,
        panelClass: ['warning-snackbar'],
      }
    );
  }

  shareResults(): void {
    if (!this.results) return;

    const text =
      `Conversión de ${this.results.baseAmount} ${this.results.baseCurrency}:\n` +
      this.results.conversions
        .map(
          (c) =>
            `${c.to}: ${c.result.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
        )
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
          panelClass: ['success-snackbar'],
        });
      });
    }
  }
}
