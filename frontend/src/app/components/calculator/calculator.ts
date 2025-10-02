import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { Currency, DivisasService } from '../../services/divisas';
import {
  ADDITIONAL_CURRENCIES,
  CURRENCY_FLAGS,
} from '../../shared/currency-flags';
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
  templateUrl: './calculator.html', // ✅ USAR ARCHIVO HTML EXTERNO
  styleUrl: './calculator.scss', // ✅ USAR ARCHIVO SCSS EXTERNO
})
export class Calculator implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiUrl;

  calculatorForm: FormGroup;
  loading = false;
  results?: MultipleConversionResponse;

  // ✅ MISMA ESTRUCTURA QUE DASHBOARD: currencies dinámicas
  availableCurrencies: Currency[] = [];
  isLimitedMode = false;
  limitedCurrencies: Currency[] = [];

  // ✅ USAR INJECT() EN LUGAR DE CONSTRUCTOR (Angular 20)
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private divisasService = inject(DivisasService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.calculatorForm = this.fb.group({
      amount: [1000, [Validators.required, Validators.min(0.01)]],
      from: ['USD', Validators.required],
      targetCurrencies: [['EUR', 'GBP', 'JPY', 'CHF'], Validators.required],
    });

    // ✅ LISTENER PARA ACTUALIZAR FORMATO DE DISPLAY
    this.calculatorForm
      .get('from')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => this.updateCurrencyDisplay(), 100);
      });

    this.calculatorForm
      .get('targetCurrencies')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => this.updateCurrencyDisplay(), 100);
      });
  }

  async ngOnInit(): Promise<void> {
    // ✅ DETERMINAR MODO DE OPERACIÓN (igual que dashboard)
    this.isLimitedMode = !this.authService.isAuthenticated();

    if (this.isLimitedMode) {
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

    // ✅ CARGAR DIVISAS DINÁMICAMENTE (igual que dashboard)
    await this.loadCurrencies();

    // ✅ ACTUALIZAR DISPLAY INICIAL
    setTimeout(() => this.updateCurrencyDisplay(), 500);

    console.log('🧮 Componente Calculadora iniciado');
  }

  /**
   * ✅ CARGAR DIVISAS DINÁMICAMENTE DESDE FRANKFURTER (igual que dashboard)
   */
  private async loadCurrencies(): Promise<void> {
    try {
      const currenciesData = await this.divisasService
        .loadCurrenciesFromFrankfurter()
        .toPromise();

      if (currenciesData) {
        // Transformar respuesta de Frankfurter en nuestro formato
        this.availableCurrencies = Object.keys(currenciesData).map((code) => ({
          code,
          name: currenciesData[code],
          flag: CURRENCY_FLAGS[code] || '🏳️',
          symbol: code,
        }));

        // Agregar divisas adicionales (como ARS) que no están en Frankfurter
        this.availableCurrencies = [
          ...this.availableCurrencies,
          ...ADDITIONAL_CURRENCIES,
        ];

        // Ordenar alfabéticamente por código
        this.availableCurrencies.sort((a, b) => a.code.localeCompare(b.code));

        console.log(
          `✅ Cargadas ${this.availableCurrencies.length} divisas para calculadora`
        );
      } else {
        throw new Error('No se recibieron datos de Frankfurter');
      }
    } catch (error) {
      console.error('❌ Error cargando divisas, usando fallback:', error);

      // Fallback: crear lista mínima desde el mapeo de flags
      this.availableCurrencies = Object.keys(CURRENCY_FLAGS).map((code) => ({
        code,
        name: this.getCurrencyNameFallback(code),
        flag: CURRENCY_FLAGS[code],
        symbol: code,
      }));

      this.availableCurrencies.sort((a, b) => a.code.localeCompare(b.code));
    }
  }

  /**
   * ✅ FALLBACK DE NOMBRES DE CURRENCY (igual que dashboard)
   */
  private getCurrencyNameFallback(code: string): string {
    const names: Record<string, string> = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CHF: 'Swiss Franc',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CNY: 'Chinese Yuan',
      MXN: 'Mexican Peso',
      BRL: 'Brazilian Real',
      KRW: 'South Korean Won',
      INR: 'Indian Rupee',
      SEK: 'Swedish Krona',
      NOK: 'Norwegian Krone',
      HKD: 'Hong Kong Dollar',
      SGD: 'Singapore Dollar',
      NZD: 'New Zealand Dollar',
      ZAR: 'South African Rand',
      TRY: 'Turkish Lira',
      PLN: 'Polish Złoty',
      BGN: 'Bulgarian Lev',
      CZK: 'Czech Koruna',
      DKK: 'Danish Krone',
      HUF: 'Hungarian Forint',
      IDR: 'Indonesian Rupiah',
      ILS: 'Israeli New Shekel',
      ISK: 'Icelandic Króna',
      MYR: 'Malaysian Ringgit',
      PHP: 'Philippine Peso',
      RON: 'Romanian Leu',
      THB: 'Thai Baht',
    };
    return names[code] || `${code} Currency`;
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

  /**
   * ✅ OBTENER FORMATO COMPLETO DE CURRENCY PARA DISPLAY
   */
  getCurrencyDisplay(code: string): string {
    const currency = this.availableCurrencies.find((c) => c.code === code);
    return currency ? `${currency.code} - ${currency.name}` : code;
  }

  /**
   * ✅ ACTUALIZAR DISPLAY DE CURRENCY EN CAMPOS SELECCIONADOS
   */
  private updateCurrencyDisplay(): void {
    // Actualizar moneda base
    const fromValue = this.calculatorForm.get('from')?.value;
    if (fromValue) {
      const fromElement = document.querySelector(
        '.currency-field .mat-mdc-select-value-text'
      );
      if (fromElement) {
        fromElement.textContent = this.getCurrencyDisplay(fromValue);
      }
    }

    // Actualizar monedas destino
    const targetValues = this.calculatorForm.get('targetCurrencies')?.value;
    if (targetValues && Array.isArray(targetValues)) {
      const targetElement = document.querySelector(
        '.target-currencies-field .mat-mdc-select-value-text'
      );
      if (targetElement) {
        const displayTexts = targetValues.map((code) =>
          this.getCurrencyDisplay(code)
        );
        targetElement.textContent = displayTexts.join(', ');
      }
    }
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
