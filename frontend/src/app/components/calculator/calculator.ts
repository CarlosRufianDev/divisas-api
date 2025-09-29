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

  // ✅ USAR INJECT() EN LUGAR DE CONSTRUCTOR (Angular 20)
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
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
