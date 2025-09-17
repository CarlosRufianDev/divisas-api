import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';
import { DivisasService } from '../../services/divisas';
import { CURRENCY_FLAGS } from '../../shared/currency-flags';
import { MaterialModule } from '../../shared/material.module';

interface RateData {
  currency: string;
  trend: number;
  currentRate: number;
  change: string;
  trendStatus: string;
  source?: string; // ✅ NUEVO: Indica si viene de 'frankfurter' o 'exchangerate-api'
}

interface FavoritePair {
  id: string;
  from: string;
  to: string;
  nickname: string;
  currentRate: number;
  pair: string;
  createdAt: string;
  updatedAt: string;
  change?: number;
  previousRate?: number;
  // ✅ NUEVOS CAMPOS PARA DATOS COMPLETOS DEL BCE
  trendStatus?: string; // 'up', 'down', 'stable'
  changeText?: string; // Texto formateado del backend (ej: "+1.23%")
}

interface UpdatePairRequest {
  nickname: string;
}

interface UpdatePairResponse {
  success: boolean;
  message: string;
  data: FavoritePair;
}

interface QuickConversion {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}

interface PerformanceItem {
  id: string;
  name: string; // pair for favorites, currency for individual currencies
  change: number;
  type: 'pair' | 'currency';
  nickname?: string;
}

interface FavoriteCurrency {
  id: string;
  currency: string;
  nickname: string;
  priority: number;
  isDefault: boolean;
  rates: Record<string, number | string>;
  createdAt: string;
  updatedAt: string;
  change?: number;
  previousRate?: number;
  currentRate?: number;
  // ✅ NUEVOS CAMPOS PARA DATOS COMPLETOS DEL BCE
  trendStatus?: string; // 'up', 'down', 'stable'
  changeText?: string; // Texto formateado del backend (ej: "+1.23%")
}

interface ConversionResponse {
  result: number;
  rate: number;
  from: string;
  to: string;
  amount: number;
}

interface BaseCurrency {
  code: string;
  name: string;
  flag: string;
}

// ============================================================================
// INTERFACES PARA COMPONENTES DE DIÁLOGO
// ============================================================================

interface Currency {
  code: string;
  name: string;
  flag: string;
}

interface ExchangeRateResponse {
  rates: Record<string, number>;
  date: string;
}

interface DialogData {
  availableCurrencies: string[];
}

interface FavoriteResponse {
  message: string;
  favorite: {
    id: string;
    from: string;
    to: string;
    nickname: string;
  };
  currentRate: number;
  description: string;
}

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
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.scss', // ✅ USAR ARCHIVO SCSS EXTERNO
})
export class Favoritos implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl;
  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private divisasService = inject(DivisasService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = false;
  favoritePairs: FavoritePair[] = [];
  favoriteCurrencies: FavoriteCurrency[] = [];
  dropdownCurrencies: string[] = []; // Optimized list from backend
  allAvailableCurrencies: string[] = []; // Lista completa de las 40 monedas
  baseCurrency = 'EUR'; // Base currency for individual favorites
  baseCurrencyControl = new FormControl('EUR'); // Control para cambiar divisa base
  availableBaseCurrencies: BaseCurrency[] = [
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'USD', name: 'Dólar Estadounidense', flag: '🇺🇸' },
    { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
    { code: 'JPY', name: 'Yen Japonés', flag: '🇯🇵' },
    { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭' },
    { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
  ];
  quickConversionForm: FormGroup;
  quickConversionLoading = false;
  quickConversionResult: QuickConversion | null = null;

  constructor() {
    this.quickConversionForm = this.fb.group({
      amount: [1000, [Validators.required, Validators.min(0.01)]],
      from: [this.baseCurrency, Validators.required], // ✅ Usar moneda base por defecto
      to: ['', Validators.required],
    });

    // Listener para cambios en la divisa base
    this.baseCurrencyControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((newBaseCurrency) => {
        if (newBaseCurrency && newBaseCurrency !== this.baseCurrency) {
          this.baseCurrency = newBaseCurrency;
          console.log(`💱 Cambiando divisa base a: ${newBaseCurrency}`);
          this.reloadWithNewBaseCurrency();
        }
      });
  }

  /**
   * Recargar datos con nueva divisa base
   */
  private async reloadWithNewBaseCurrency(): Promise<void> {
    console.log(
      `🔄 Recargando favoritos con divisa base: ${this.baseCurrency}`
    );

    // ✅ NUEVO: Actualizar conversión rápida con nueva moneda base
    this.updateQuickConversionWithNewBaseCurrency();

    // Recargar divisas favoritas individuales con nueva base
    await this.loadFavoriteCurrencies(true); // Silent reload

    // Mostrar notificación
    this.snackBar.open(
      `💱 Divisa base cambiada a ${this.baseCurrency}`,
      'Cerrar',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
  }

  /**
   * ✅ NUEVO: Actualizar conversión rápida cuando cambia la moneda base
   */
  private updateQuickConversionWithNewBaseCurrency(): void {
    const currentFrom = this.quickConversionForm.get('from')?.value;
    const currentTo = this.quickConversionForm.get('to')?.value;

    // Si el campo "from" era la moneda base anterior, actualizarlo
    if (currentFrom && currentFrom !== this.baseCurrency) {
      // Si "to" es la nueva moneda base, intercambiar
      if (currentTo === this.baseCurrency) {
        this.quickConversionForm.patchValue({
          from: this.baseCurrency,
          to: currentFrom,
        });
        console.log(
          `🔄 Intercambiado conversión: ${this.baseCurrency}/${currentFrom}`
        );
      } else {
        // Solo actualizar "from" a la nueva moneda base
        this.quickConversionForm.patchValue({
          from: this.baseCurrency,
        });
        console.log(`🔄 Actualizado "from" a: ${this.baseCurrency}`);
      }
    }

    // Recalcular conversión con nuevos valores
    this.calculateQuickConversion();

    // Log de cambio
    console.log(
      `📊 Conversión rápida actualizada para base: ${this.baseCurrency}`
    );
  }

  async ngOnInit(): Promise<void> {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.snackBar
        .open('🔐 Inicia sesión para ver tus favoritos', 'Login', {
          duration: 5000,
          panelClass: ['warning-snackbar'],
        })
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/login']);
        });
      return;
    }

    console.log('⭐ Iniciando componente Favoritos');

    // ✅ MOSTRAR RESUMEN DE MEJORAS BCE
    console.log(
      '🚀 FAVORITOS CON DATOS 100% REALES - MISMO PATRÓN QUE DASHBOARD:'
    );
    console.log(
      '   📈 getTrendingRates(base, undefined, 7) - UNA LLAMADA para todas las monedas'
    );
    console.log(
      '   🌍 ~30 monedas desde Frankfurter + 9 adicionales desde exchangerate-api'
    );
    console.log('   💹 Rates actuales directos del BCE/Frankfurter');
    console.log(
      '   📊 Estados de tendencia (up/down/stable) calculados por el backend'
    );
    console.log('   🎯 Cambios porcentuales reales de los últimos 7 días');
    console.log('   � ZERO múltiples llamadas - eficiencia máxima');
    console.log('   ⚡ Performance optimizada igual que Dashboard');

    await this.loadAllCurrencies(); // Cargar las 40 monedas completas (ahora async)
    this.loadFavorites();
    this.loadFavoriteCurrencies();
    this.loadDropdownCurrencies(); // Nueva función optimizada
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFormSubscriptions(): void {
    // Auto-calculate cuando cambian los valores
    this.quickConversionForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateQuickConversion();
      });
  }

  /**
   * Cargar todas las monedas disponibles
   * FUENTE: Frankfurter API (~30 monedas) + ADDITIONAL_CURRENCIES (9 monedas)
   * FALLBACK: CURRENCY_FLAGS (lista estática en caso de error)
   *
   * ✅ MISMA LÓGICA QUE DASHBOARD para consistencia total
   */
  async loadAllCurrencies(): Promise<void> {
    try {
      console.log(
        '🌍 Cargando divisas dinámicamente desde Frankfurter (patrón Dashboard)...'
      );

      // ✅ USAR MISMO MÉTODO QUE DASHBOARD
      const currenciesData = await this.divisasService
        .loadCurrenciesFromFrankfurter()
        .toPromise();

      if (currenciesData) {
        // Transformar respuesta de Frankfurter + divisas adicionales
        const frankfurterCurrencies = Object.keys(currenciesData);
        const additionalCurrencies = [
          'ARS',
          'COP',
          'CLP',
          'PEN',
          'UYU',
          'RUB',
          'EGP',
          'VND',
          'KWD',
        ];

        // Combinar ambas listas y eliminar duplicados
        this.allAvailableCurrencies = [
          ...new Set([...frankfurterCurrencies, ...additionalCurrencies]),
        ].sort();

        console.log(
          `✅ Cargadas dinámicamente ${this.allAvailableCurrencies.length} monedas (${frankfurterCurrencies.length} desde Frankfurter + ${additionalCurrencies.length} adicionales)`
        );
      } else {
        throw new Error('No se recibieron datos de Frankfurter');
      }
    } catch (error) {
      console.error(
        '❌ Error cargando divisas dinámicamente, usando fallback:',
        error
      );
      // Fallback a las monedas desde CURRENCY_FLAGS
      this.allAvailableCurrencies = Object.keys(CURRENCY_FLAGS).sort();
    }

    // Actualizar también las monedas base disponibles
    this.updateAvailableBaseCurrencies();
  }

  /**
   * Actualizar la lista de monedas base disponibles basado en todas las monedas
   */
  private updateAvailableBaseCurrencies(): void {
    this.availableBaseCurrencies = this.allAvailableCurrencies.map((code) => ({
      code,
      name: this.getCurrencyName(code),
      flag: CURRENCY_FLAGS[code] || '🏳️',
    }));
  }

  /**
   * Obtener el nombre de una moneda (completo para todas las monedas de Frankfurter + Exchange)
   * Compatible con ambas fuentes: /api/exchange/currencies (Frankfurter ~40) y /api/convert/currencies (Lista hardcodeada 20)
   */
  getCurrencyName(code: string): string {
    const names: Record<string, string> = {
      // Principales (Exchange + Frankfurter)
      ARS: 'Peso Argentino',
      AUD: 'Dólar Australiano',
      BGN: 'Lev Búlgaro',
      BRL: 'Real Brasileño',
      CAD: 'Dólar Canadiense',
      CHF: 'Franco Suizo',
      CLP: 'Peso Chileno',
      CNY: 'Yuan Chino',
      COP: 'Peso Colombiano',
      CZK: 'Corona Checa',
      DKK: 'Corona Danesa',
      EGP: 'Libra Egipcia',
      EUR: 'Euro',
      GBP: 'Libra Esterlina',
      HKD: 'Dólar de Hong Kong',
      HRK: 'Kuna Croata', // Frankfurter adicional
      HUF: 'Forint Húngaro',
      IDR: 'Rupia Indonesia',
      ILS: 'Nuevo Shékel Israelí',
      INR: 'Rupia India',
      ISK: 'Corona Islandesa',
      JPY: 'Yen Japonés',
      KRW: 'Won Surcoreano',
      KWD: 'Dinar Kuwaití', // Frankfurter adicional
      MXN: 'Peso Mexicano',
      MYR: 'Ringgit Malayo',
      NOK: 'Corona Noruega',
      NZD: 'Dólar Neozelandés',
      PEN: 'Sol Peruano', // Frankfurter adicional
      PHP: 'Peso Filipino',
      PLN: 'Zloty Polaco',
      RON: 'Leu Rumano',
      RUB: 'Rublo Ruso',
      SEK: 'Corona Sueca',
      SGD: 'Dólar de Singapur',
      THB: 'Baht Tailandés',
      TRY: 'Lira Turca',
      USD: 'Dólar Estadounidense',
      UYU: 'Peso Uruguayo', // Frankfurter adicional
      VND: 'Dong Vietnamita', // Frankfurter adicional
      ZAR: 'Rand Sudafricano',

      // Adicionales que puede devolver Frankfurter
      CAR: 'Franco CFA Central',
      XOF: 'Franco CFA Occidental',
      XAF: 'Franco CFA Central Africano',
      MAD: 'Dirham Marroquí',
      TND: 'Dinar Tunecino',
      TWD: 'Dólar Taiwanés',
      LKR: 'Rupia de Sri Lanka',
      BDT: 'Taka de Bangladesh',
      PKR: 'Rupia Pakistaní',
      SAR: 'Riyal Saudí',
      AED: 'Dirham de EAU',
      QAR: 'Riyal Catarí',
      BHD: 'Dinar de Baréin',
      OMR: 'Rial Omaní',
      JOD: 'Dinar Jordano',
      LBP: 'Libra Libanesa',
      KES: 'Chelín Keniano',
      UGX: 'Chelín Ugandés',
      TZS: 'Chelín Tanzano',
      ETB: 'Birr Etíope',
      GHS: 'Cedi Ghanés',
      NGN: 'Naira Nigeriana',
      ZMW: 'Kwacha Zambiano',
      BWP: 'Pula de Botsuana',
      MUR: 'Rupia Mauriciana',
      SCR: 'Rupia de Seychelles',
      MVR: 'Rufiyaa de Maldivas',
      AFN: 'Afgani Afgano',
      IRR: 'Rial Iraní',
      IQD: 'Dinar Iraquí',
      SYP: 'Libra Siria',
      YER: 'Rial Yemení',

      // Fallbacks genéricos para códigos desconocidos
      XXX: 'Moneda Desconocida',
      XTS: 'Código de Prueba',
    };

    // ✅ Fallback inteligente: si no conocemos el nombre, devolver el código formateado
    return names[code] || `${code} (Divisa)`;
  }

  async loadFavorites(silent = false): Promise<void> {
    if (!silent) this.loading = true;

    this.http
      .get<{ count: number; favorites: FavoritePair[] }>(
        `${this.apiUrl}/favorites`
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          // Calcular cambios comparando con datos anteriores
          const newFavorites = response.favorites.map((newFav) => {
            const oldFav = this.favoritePairs.find(
              (old) => old.id === newFav.id
            );

            let change = 0;
            if (oldFav) {
              // Usar cambio real si hay datos históricos
              change = this.calculateChange(
                oldFav.currentRate,
                newFav.currentRate
              );
            }
            // Para nuevos elementos, change se queda en 0 y se actualizará después

            return {
              ...newFav,
              change,
              previousRate: oldFav?.currentRate,
            };
          });

          this.favoritePairs = newFavorites;

          // Cargar datos reales para todos los pares (en lote)
          await this.loadRealDataForPairs();
          this.loading = false;

          if (!silent) {
            console.log('✅ Favoritos cargados:', response);
          }
        },
        error: (error) => {
          console.error('❌ Error cargando favoritos:', error);
          this.loading = false;

          if (!silent) {
            this.snackBar.open('❌ Error al cargar los favoritos', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          }
        },
      });
  }

  async loadFavoriteCurrencies(silent = false): Promise<void> {
    if (!silent) this.loading = true;

    this.http
      .get<{
        count: number;
        favoriteCurrencies: FavoriteCurrency[];
        baseCurrency: string;
      }>(`${this.apiUrl}/favorite-currencies?base=${this.baseCurrency}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          // Calcular cambios comparando con datos anteriores
          const newFavoriteCurrencies = response.favoriteCurrencies.map(
            (newFav) => {
              const oldFav = this.favoriteCurrencies.find(
                (old) => old.id === newFav.id
              );

              // Obtener la tasa actual (EUR_to_Currency)
              const currentRateKey = `${response.baseCurrency}_to_${newFav.currency}`;
              const currentRate =
                typeof newFav.rates[currentRateKey] === 'number'
                  ? (newFav.rates[currentRateKey] as number)
                  : 0;

              const oldRate = oldFav?.previousRate || 0;

              let change = 0;
              if (oldFav && oldRate > 0) {
                // Usar cambio real si hay datos históricos
                change = this.calculateChange(oldRate, currentRate);
              }
              // Para nuevos elementos, change se queda en 0 y se actualizará después

              return {
                ...newFav,
                change,
                previousRate: currentRate,
                currentRate: currentRate, // Agregar currentRate para la interfaz
              };
            }
          );

          this.favoriteCurrencies = newFavoriteCurrencies;

          // Cargar datos reales para todas las divisas (en lote)
          await this.loadRealDataForCurrencies();

          if (!silent) this.loading = false;

          if (!silent) {
            console.log('✅ Divisas favoritas cargadas:', response);
          }
        },
        error: (error) => {
          console.error('❌ Error cargando divisas favoritas:', error);
          if (!silent) this.loading = false;

          if (!silent) {
            this.snackBar.open(
              '❌ Error al cargar las divisas favoritas',
              'Cerrar',
              {
                duration: 3000,
                panelClass: ['error-snackbar'],
              }
            );
          }
        },
      });
  }

  /**
   * Cargar monedas optimizadas para dropdowns (solo favoritos del usuario)
   * FUENTE: /api/favorite-currencies/dropdown (monedas favoritas del usuario)
   * FALLBACK: getUniqueCurrencies() (extrae de favoritos locales)
   *
   * OPTIMIZACIÓN: Reduce la lista a solo las monedas que el usuario usa
   */
  loadDropdownCurrencies(): void {
    this.http
      .get<{ code: string; name: string; isDefault: boolean }[]>(
        `${this.apiUrl}/favorite-currencies/dropdown`
      )
      .subscribe({
        next: (currencies) => {
          // Extraer solo los códigos de moneda y añadir EUR como base
          this.dropdownCurrencies = [
            'EUR',
            ...currencies.map((curr) => curr.code),
          ];
          // Remover duplicados y ordenar
          this.dropdownCurrencies = [
            ...new Set(this.dropdownCurrencies),
          ].sort();
          console.log(
            '💱 Dropdown currencies loaded:',
            this.dropdownCurrencies
          );
        },
        error: (error) => {
          console.error('Error loading dropdown currencies:', error);
          // Fallback al método tradicional
          this.dropdownCurrencies = this.getUniqueCurrencies();
        },
      });
  }

  calculateChange(oldRate: number, newRate: number): number {
    if (!oldRate || !newRate) return 0;
    return ((newRate - oldRate) / oldRate) * 100;
  }

  // ===== MÉTODOS PARA DATOS REALES (Frankfurter API vía Backend) =====

  /**
   * Obtener datos completos y reales para un par de divisas
   * FUENTE: Frankfurter API vía /api/calculator/trending-rates (mismo patrón que Dashboard)
   * RETORNA: Objeto completo con rate, change, trendStatus del BCE
   */
  private async getRealDataForPair(pair: string): Promise<{
    currentRate: number;
    change: number;
    trendStatus: string;
    changeText: string;
  }> {
    try {
      const [from, to] = pair.split('/');
      if (!from || !to) {
        return {
          currentRate: 0,
          change: 0,
          trendStatus: 'stable',
          changeText: '0.00%',
        };
      }

      console.log(`🌍 Obteniendo datos REALES del BCE para par: ${pair}`);

      // 🚀 USAR EL MISMO MÉTODO QUE EL DASHBOARD (datos 100% reales)
      const trendingResponse = await this.divisasService
        .getTrendingRates(from, [to], 7)
        .toPromise();

      if (trendingResponse?.success && trendingResponse.rates?.length > 0) {
        const rateData = trendingResponse.rates.find(
          (r: RateData) => r.currency === to
        );

        if (rateData) {
          console.log(`✅ Datos reales del BCE para ${pair}:`, {
            currentRate: rateData.currentRate,
            trend: rateData.trend,
            trendStatus: rateData.trendStatus,
            change: rateData.change,
          });

          return {
            currentRate: rateData.currentRate || 0,
            change: rateData.trend || 0, // Usar trend como percentage change
            trendStatus: rateData.trendStatus || 'stable',
            changeText: rateData.change || '0.00%', // Texto formateado del backend
          };
        }
      }

      console.warn(`⚠️ No se recibieron datos del BCE para ${pair}`);
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    } catch (error) {
      console.warn(`❌ Error obteniendo datos reales para ${pair}:`, error);
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    }
  }

  /**
   * Obtener datos completos y reales para una divisa individual
   * FUENTE: Frankfurter API vía /api/calculator/trending-rates (mismo patrón que Dashboard)
   * SOPORTE: Base dinámica (this.baseCurrency) vs cualquier moneda objetivo
   */
  private async getRealDataForCurrency(
    currency: string,
    baseCurrency?: string
  ): Promise<{
    currentRate: number;
    change: number;
    trendStatus: string;
    changeText: string;
  }> {
    try {
      const base = baseCurrency || this.baseCurrency;
      console.log(`🌍 Obteniendo datos REALES del BCE: ${base} → ${currency}`);

      // 🚀 USAR EL MISMO MÉTODO QUE EL DASHBOARD (datos 100% reales)
      const trendingResponse = await this.divisasService
        .getTrendingRates(base, [currency], 7)
        .toPromise();

      if (trendingResponse?.success && trendingResponse.rates?.length > 0) {
        const rateData = trendingResponse.rates.find(
          (r: RateData) => r.currency === currency
        );

        if (rateData) {
          console.log(`✅ Datos reales del BCE para ${base}/${currency}:`, {
            currentRate: rateData.currentRate,
            trend: rateData.trend,
            trendStatus: rateData.trendStatus,
            change: rateData.change,
          });

          return {
            currentRate: rateData.currentRate || 0,
            change: rateData.trend || 0, // Usar trend como percentage change
            trendStatus: rateData.trendStatus || 'stable',
            changeText: rateData.change || '0.00%', // Texto formateado del backend
          };
        }
      }

      console.warn(
        `⚠️ No se recibieron datos del BCE para ${base}/${currency}`
      );
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    } catch (error) {
      console.warn(
        `❌ Error obteniendo datos reales para ${
          baseCurrency || this.baseCurrency
        }/${currency}:`,
        error
      );
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    }
  }

  /**
   * Cargar datos reales para todos los pares favoritos
   * ACTUALIZADO: Usar MISMO PATRÓN que Dashboard (una sola llamada para todas las monedas)
   */
  private async loadRealDataForPairs(): Promise<void> {
    if (this.favoritePairs.length === 0) return;

    console.log(
      '🌍 Cargando datos COMPLETOS del BCE para pares favoritos (patrón Dashboard)...'
    );

    try {
      // 🚀 OBTENER TODAS LAS MONEDAS DE UNA VEZ (mismo patrón que Dashboard)
      const uniqueBases = [...new Set(this.favoritePairs.map((p) => p.from))];

      // Procesar cada base por separado para mayor precisión
      for (const base of uniqueBases) {
        console.log(`📊 Obteniendo datos del BCE con base ${base}...`);

        // ✅ MISMO MÉTODO QUE DASHBOARD: getTrendingRates(base, undefined, 7)
        const trendingResponse = await this.divisasService
          .getTrendingRates(base, undefined, 7) // ✅ undefined = TODAS las monedas (~40)
          .toPromise();

        if (trendingResponse?.success && trendingResponse.rates) {
          console.log(
            `✅ Recibidos datos para ${trendingResponse.rates.length} monedas desde base ${base}`
          );
          console.log(
            `🔍 Incluye ARS: ${
              trendingResponse.rates.find((r) => r.currency === 'ARS')
                ? 'SÍ'
                : 'NO'
            }`
          );
          console.log(
            `🔍 Incluye EUR: ${
              trendingResponse.rates.find((r) => r.currency === 'EUR')
                ? 'SÍ'
                : 'NO'
            }`
          );

          // Actualizar todos los pares que usan esta base
          this.favoritePairs = this.favoritePairs.map((favorite) => {
            if (favorite.from === base) {
              // Buscar los datos para la moneda destino
              const rateData = trendingResponse.rates.find(
                (r: RateData) => r.currency === favorite.to
              );

              if (rateData) {
                console.log(
                  `🔍 ${favorite.pair}: rate=${rateData.currentRate}, change=${rateData.change}, trend=${rateData.trendStatus}`
                );

                return {
                  ...favorite,
                  currentRate: rateData.currentRate || favorite.currentRate, // ✅ Rate del BCE
                  change: rateData.trend || 0, // ✅ Cambio porcentual del BCE
                  trendStatus: rateData.trendStatus || 'stable', // ✅ Estado de tendencia del BCE
                  changeText: rateData.change || '0.00%', // ✅ Texto formateado del BCE
                  previousRate: favorite.previousRate || rateData.currentRate,
                };
              }
            }
            return favorite;
          });
        }
      }

      console.log(
        '✅ Datos COMPLETOS del BCE cargados para pares favoritos (patrón Dashboard)'
      );
    } catch (error) {
      console.error('❌ Error cargando datos reales para pares:', error);
    }
  }

  /**
   * Cargar datos reales para todas las divisas favoritas individuales
   * ACTUALIZADO: Usar MISMO PATRÓN que Dashboard + manejo de monedas base no soportadas
   */
  private async loadRealDataForCurrencies(): Promise<void> {
    if (this.favoriteCurrencies.length === 0) return;

    console.log(
      '🌍 Cargando datos COMPLETOS del BCE para divisas favoritas (patrón Dashboard)...'
    );

    try {
      // 🔍 VERIFICAR SI LA MONEDA BASE ESTÁ SOPORTADA EN FRANKFURTER
      const unsupportedBases = [
        'ARS',
        'COP',
        'CLP',
        'PEN',
        'UYU',
        'RUB',
        'EGP',
        'VND',
        'KWD',
      ];
      const needsConversion = unsupportedBases.includes(this.baseCurrency);

      if (needsConversion) {
        console.log(
          `⚠️ ${this.baseCurrency} no está soportado como base en Frankfurter, usando conversión via USD...`
        );
        await this.loadRealDataWithUSDConversion();
        return;
      }

      // 🚀 USAR UNA SOLA LLAMADA PARA TODAS LAS MONEDAS (mismo patrón que Dashboard)
      console.log(
        `📊 Obteniendo datos del BCE con base ${this.baseCurrency}...`
      );

      // ✅ MISMO MÉTODO QUE DASHBOARD: getTrendingRates(base, undefined, 7)
      const trendingResponse = await this.divisasService
        .getTrendingRates(this.baseCurrency, undefined, 7) // ✅ undefined = TODAS las monedas (~40)
        .toPromise();

      if (trendingResponse?.success && trendingResponse.rates) {
        console.log(
          `✅ Recibidos datos para ${trendingResponse.rates.length} monedas desde base ${this.baseCurrency}`
        );
        console.log(
          `🔍 Incluye ARS: ${
            trendingResponse.rates.find((r) => r.currency === 'ARS')
              ? 'SÍ'
              : 'NO'
          }`
        );
        console.log(
          `🔍 Incluye USD: ${
            trendingResponse.rates.find((r) => r.currency === 'USD')
              ? 'SÍ'
              : 'NO'
          }`
        );

        // Actualizar todas las divisas favoritas de una vez
        this.favoriteCurrencies = this.favoriteCurrencies.map((favorite) => {
          // Buscar los datos para esta divisa
          const rateData = trendingResponse.rates.find(
            (r: RateData) => r.currency === favorite.currency
          );

          if (rateData) {
            console.log(
              `🔍 ${this.baseCurrency}/${favorite.currency}: rate=${rateData.currentRate}, change=${rateData.change}, trend=${rateData.trendStatus}`
            );

            return {
              ...favorite,
              currentRate: rateData.currentRate || favorite.currentRate, // ✅ Rate del BCE
              change: rateData.trend || 0, // ✅ Cambio porcentual del BCE
              trendStatus: rateData.trendStatus || 'stable', // ✅ Estado de tendencia del BCE
              changeText: rateData.change || '0.00%', // ✅ Texto formateado del BCE
              previousRate: favorite.previousRate || rateData.currentRate,
            };
          }

          return favorite; // Mantener sin cambios si no hay datos del BCE
        });
      }

      console.log(
        '✅ Datos COMPLETOS del BCE cargados para divisas favoritas (patrón Dashboard)'
      );
    } catch (error) {
      console.error('❌ Error cargando datos reales para divisas:', error);
    }
  }

  /**
   * Cargar datos con conversión USD para monedas base no soportadas (ARS, COP, etc.)
   */
  private async loadRealDataWithUSDConversion(): Promise<void> {
    try {
      console.log(
        `🔄 Cargando datos via USD para base ${this.baseCurrency}...`
      );

      // 1. Obtener datos con USD como base
      const usdTrendingResponse = await this.divisasService
        .getTrendingRates('USD', undefined, 7)
        .toPromise();

      // 2. Obtener rate actual de USD a la moneda base (ej: USD/ARS)
      const baseRateResponse = await this.divisasService
        .getTrendingRates('USD', [this.baseCurrency], 7)
        .toPromise();

      if (usdTrendingResponse?.success && baseRateResponse?.success) {
        const usdRates = usdTrendingResponse.rates;
        const baseRateData = baseRateResponse.rates.find(
          (r) => r.currency === this.baseCurrency
        );

        if (!baseRateData || !baseRateData.currentRate) {
          console.error(`❌ No se pudo obtener rate USD/${this.baseCurrency}`);
          return;
        }

        const usdToBaseRate = baseRateData.currentRate;
        console.log(`📊 Rate USD/${this.baseCurrency}: ${usdToBaseRate}`);

        // 3. Convertir todas las divisas favoritas
        this.favoriteCurrencies = this.favoriteCurrencies.map((favorite) => {
          const usdRateData = usdRates.find(
            (r: RateData) => r.currency === favorite.currency
          );

          if (usdRateData) {
            // Convertir de USD/Currency a BaseCurrency/Currency
            const convertedRate = usdRateData.currentRate / usdToBaseRate;

            console.log(
              `🔄 ${this.baseCurrency}/${
                favorite.currency
              }: ${convertedRate.toFixed(4)} (via USD conversion)`
            );

            return {
              ...favorite,
              currentRate: convertedRate,
              change: usdRateData.trend || 0, // Usar trend de USD (aproximación)
              trendStatus: usdRateData.trendStatus || 'stable',
              changeText: usdRateData.change || '0.00%',
              previousRate: favorite.previousRate || convertedRate,
            };
          }

          return favorite;
        });

        console.log(
          `✅ Conversión USD completada para base ${this.baseCurrency}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error en conversión USD para ${this.baseCurrency}:`,
        error
      );
    }
  }

  // DEPRECATED: Método de simulación reemplazado por datos reales de Frankfurter/BCE
  /*
  simulateRealisticChange(pair: string): number {
    const volatilityMap: Record<string, number> = {
      'EUR/USD': 0.5,
      'GBP/USD': 0.8,
      'USD/JPY': 0.6,
      'GBP/EUR': 0.4,
      'EUR/GBP': 0.4,
      'USD/CHF': 0.3,
      'AUD/USD': 0.9,
      'USD/CAD': 0.4,
      'EUR/JPY': 0.7,
      'GBP/JPY': 1.2,
      'CHF/JPY': 0.8,
      'CAD/JPY': 0.9,
    };

    // Volatilidad base para el par o default
    const baseVolatility = volatilityMap[pair] || 0.6;

    // Generar cambio aleatorio con distribución normal-ish
    const random1 = Math.random();
    const random2 = Math.random();
    const normal =
      Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);

    // Aplicar volatilidad y limitar el rango
    const change = normal * baseVolatility;
    return Math.max(-3, Math.min(3, change)); // Limitar entre -3% y +3%
  }
  */

  formatPercentageChange(change: number): string {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  trackByFavorite(index: number, favorite: FavoritePair): string {
    return favorite.id;
  }

  getUniqueCurrencies(): string[] {
    // Prioridad 1: Si tenemos las 40 monedas completas, usarlas
    if (this.allAvailableCurrencies.length > 0) {
      return this.allAvailableCurrencies;
    }

    // Prioridad 2: Si tenemos datos del dropdown optimizado, usarlos
    if (this.dropdownCurrencies.length > 0) {
      return this.dropdownCurrencies;
    }

    // Fallback al método tradicional (solo favoritos)
    const currencies = new Set<string>();

    // Añadir divisas de los pares favoritos
    this.favoritePairs.forEach((fav) => {
      currencies.add(fav.from);
      currencies.add(fav.to);
    });

    // Añadir divisas favoritas individuales
    this.favoriteCurrencies.forEach((fav) => {
      currencies.add(fav.currency);
    });

    // Añadir EUR como base si no está presente
    currencies.add('EUR');

    return Array.from(currencies).sort();
  }

  getFilteredToCurrencies(): string[] {
    const fromCurrency = this.quickConversionForm.get('from')?.value;
    return this.getFavoriteCurrencies().filter(
      (currency) => currency !== fromCurrency
    );
  }

  /**
   * Obtener solo las monedas que están en favoritos (para conversión rápida)
   */
  getFavoriteCurrencies(): string[] {
    const currencies = new Set<string>();

    // Añadir divisas de los pares favoritos
    this.favoritePairs.forEach((fav) => {
      currencies.add(fav.from);
      currencies.add(fav.to);
    });

    // Añadir divisas favoritas individuales
    this.favoriteCurrencies.forEach((fav) => {
      currencies.add(fav.currency);
    });

    // Añadir EUR como base si no está presente
    currencies.add('EUR');

    return Array.from(currencies).sort();
  }

  onFromCurrencyChange(): void {
    const fromCurrency = this.quickConversionForm.get('from')?.value;
    const toCurrency = this.quickConversionForm.get('to')?.value;

    // Si las monedas son iguales, limpiar 'to'
    if (fromCurrency === toCurrency) {
      this.quickConversionForm.patchValue({ to: '' });
    }
  }

  swapCurrencies(): void {
    const fromValue = this.quickConversionForm.get('from')?.value;
    const toValue = this.quickConversionForm.get('to')?.value;

    this.quickConversionForm.patchValue({
      from: toValue,
      to: fromValue,
    });
  }

  calculateQuickConversion(): void {
    const form = this.quickConversionForm;
    if (form.invalid || !form.get('from')?.value || !form.get('to')?.value) {
      this.quickConversionResult = null;
      return;
    }

    const { amount, from, to } = form.value;
    this.quickConversionLoading = true;

    const payload = { from, to, amount };

    this.http
      .post<ConversionResponse>(`${this.apiUrl}/convert`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.quickConversionResult = {
            from,
            to,
            amount,
            result: response.result,
            rate: response.rate,
          };
          this.quickConversionLoading = false;
        },
        error: (error) => {
          console.error('❌ Error en conversión rápida:', error);
          this.quickConversionLoading = false;
          this.quickConversionResult = null;
        },
      });
  }

  useInQuickConversion(favorite: FavoritePair): void {
    // ✅ MEJORADO: Verificar si el par usa la moneda base actual
    let fromCurrency = favorite.from;
    let toCurrency = favorite.to;

    // Si ninguna de las divisas del par es la moneda base actual,
    // usar la moneda base como "from" y la primera divisa del par como "to"
    if (
      fromCurrency !== this.baseCurrency &&
      toCurrency !== this.baseCurrency
    ) {
      fromCurrency = this.baseCurrency;
      toCurrency = favorite.from; // Usar la primera divisa del par original
    }
    // Si "to" es la moneda base, intercambiar para que "from" sea la base
    else if (toCurrency === this.baseCurrency) {
      fromCurrency = this.baseCurrency;
      toCurrency = favorite.from;
    }

    this.quickConversionForm.patchValue({
      from: fromCurrency,
      to: toCurrency,
    });

    // Scroll al panel de conversión
    document.querySelector('.conversion-panel')?.scrollIntoView({
      behavior: 'smooth',
    });

    this.snackBar.open(
      `📊 Usando ${fromCurrency}/${toCurrency} en conversión rápida`,
      'Cerrar',
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  // ✅ NUEVO: Método para navegar a alertas con pares preseleccionados
  navigateToAlerts(fromCurrency?: string, toCurrency?: string): void {
    if (fromCurrency && toCurrency) {
      // Navegar con query parameters para preseleccionar el par
      this.router.navigate(['/alertas'], {
        queryParams: {
          from: fromCurrency,
          to: toCurrency,
        },
      });
    } else {
      // Navegar sin parámetros
      this.router.navigate(['/alertas']);
    }

    this.snackBar.open(
      `🔔 Navegando a alertas${
        fromCurrency && toCurrency ? ` para ${fromCurrency}/${toCurrency}` : ''
      }`,
      'Cerrar',
      {
        duration: 2000,
        panelClass: ['info-snackbar'],
      }
    );
  }

  getBestPerformer(): PerformanceItem | null {
    const allPerformers: PerformanceItem[] = [
      // Pares favoritos
      ...this.favoritePairs.map((pair) => ({
        id: pair.id,
        name: pair.pair,
        change: pair.change || 0,
        type: 'pair' as const,
        nickname: pair.nickname,
      })),
      // Divisas individuales
      ...this.favoriteCurrencies.map((currency) => ({
        id: currency.id,
        name: currency.currency,
        change: currency.change || 0,
        type: 'currency' as const,
        nickname: currency.nickname,
      })),
    ];

    if (allPerformers.length === 0) return null;

    return allPerformers.reduce((best, current) =>
      current.change > best.change ? current : best
    );
  }

  getWorstPerformer(): PerformanceItem | null {
    const allPerformers: PerformanceItem[] = [
      // Pares favoritos
      ...this.favoritePairs.map((pair) => ({
        id: pair.id,
        name: pair.pair,
        change: pair.change || 0,
        type: 'pair' as const,
        nickname: pair.nickname,
      })),
      // Divisas individuales
      ...this.favoriteCurrencies.map((currency) => ({
        id: currency.id,
        name: currency.currency,
        change: currency.change || 0,
        type: 'currency' as const,
        nickname: currency.nickname,
      })),
    ];

    if (allPerformers.length === 0) return null;

    return allPerformers.reduce((worst, current) =>
      current.change < worst.change ? current : worst
    );
  }

  openAddFavoriteDialog(): void {
    const dialogRef = this.dialog.open(AddFavoriteDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: {
        availableCurrencies: this.getUniqueCurrencies(),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si se añadió un favorito, recargar la lista
        console.log('✅ Favorito añadido:', result);
        this.loadFavorites();
      }
    });
  }

  editFavorite(favorite: FavoritePair): void {
    const dialogRef = this.dialog.open(EditPairDialogComponent, {
      width: '500px',
      data: { pair: favorite },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((updates) => {
      if (updates) {
        this.updateFavoriteOnServer(favorite.id, updates);
      }
    });
  }

  private updateFavoriteOnServer(id: string, updates: UpdatePairRequest): void {
    const payload = {
      nickname: updates.nickname,
    };

    this.http
      .put<UpdatePairResponse>(`${this.apiUrl}/favorites/${id}`, payload)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar el favorito en la lista local
            const index = this.favoritePairs.findIndex(
              (fav: FavoritePair) => fav.id === id
            );
            if (index !== -1) {
              this.favoritePairs[index] = {
                ...this.favoritePairs[index],
                nickname: updates.nickname,
              };
            }

            this.snackBar.open(
              response.message || 'Par actualizado correctamente',
              'Cerrar',
              {
                duration: 2000,
                panelClass: ['success-snackbar'],
              }
            );
          }
        },
        error: (error) => {
          console.error('Error al actualizar par:', error);
          this.snackBar.open(
            'Error al actualizar el par. Inténtalo de nuevo.',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  deleteFavorite(favorite: FavoritePair): void {
    if (!confirm(`¿Eliminar "${favorite.pair}" de favoritos?`)) return;

    this.http
      .delete(`${this.apiUrl}/favorites/${favorite.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.favoritePairs = this.favoritePairs.filter(
            (f) => f.id !== favorite.id
          );
          this.snackBar.open(
            `✅ ${favorite.pair} eliminado de favoritos`,
            'Cerrar',
            { duration: 2000, panelClass: ['success-snackbar'] }
          );
        },
        error: (error) => {
          console.error('❌ Error eliminando favorito:', error);
          this.snackBar.open('❌ Error al eliminar el favorito', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  // ========== MÉTODOS PARA DIVISAS FAVORITAS INDIVIDUALES ==========

  addFavoriteCurrency(currency: string, nickname?: string): void {
    const payload = {
      currency: currency.toUpperCase(),
      nickname: nickname || '',
      priority: 1,
    };

    this.http
      .post<{ message: string; favoriteCurrency: FavoriteCurrency }>(
        `${this.apiUrl}/favorite-currencies`,
        payload
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadFavoriteCurrencies(); // Recargar la lista
          this.snackBar.open(
            `✅ ${currency.toUpperCase()} añadida a favoritas`,
            'Cerrar',
            { duration: 2000, panelClass: ['success-snackbar'] }
          );
        },
        error: (error) => {
          console.error('❌ Error añadiendo divisa favorita:', error);
          const message =
            error.status === 409
              ? 'Esta divisa ya está en tus favoritas'
              : 'Error al añadir la divisa a favoritas';
          this.snackBar.open(`❌ ${message}`, 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  deleteFavoriteCurrency(favoriteCurrency: FavoriteCurrency): void {
    if (!confirm(`¿Eliminar "${favoriteCurrency.currency}" de favoritas?`))
      return;

    this.http
      .delete(`${this.apiUrl}/favorite-currencies/${favoriteCurrency.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.favoriteCurrencies = this.favoriteCurrencies.filter(
            (f) => f.id !== favoriteCurrency.id
          );
          // Recargar dropdown al eliminar divisa
          this.loadDropdownCurrencies();
          this.snackBar.open(
            `✅ ${favoriteCurrency.currency} eliminada de favoritas`,
            'Cerrar',
            { duration: 2000, panelClass: ['success-snackbar'] }
          );
        },
        error: (error) => {
          console.error('❌ Error eliminando divisa favorita:', error);
          this.snackBar.open(
            '❌ Error al eliminar la divisa favorita',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  updateFavoriteCurrency(
    favoriteCurrency: FavoriteCurrency,
    updates: Partial<FavoriteCurrency>
  ): void {
    this.http
      .put<{ message: string; favoriteCurrency: FavoriteCurrency }>(
        `${this.apiUrl}/favorite-currencies/${favoriteCurrency.id}`,
        updates
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Actualizar en la lista local
          const index = this.favoriteCurrencies.findIndex(
            (f) => f.id === favoriteCurrency.id
          );
          if (index !== -1) {
            this.favoriteCurrencies[index] = {
              ...this.favoriteCurrencies[index],
              ...updates,
            };
          }
          this.snackBar.open('✅ Divisa favorita actualizada', 'Cerrar', {
            duration: 2000,
            panelClass: ['success-snackbar'],
          });
        },
        error: (error) => {
          console.error('❌ Error actualizando divisa favorita:', error);
          this.snackBar.open(
            '❌ Error al actualizar la divisa favorita',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  /**
   * Debug: Comparar datos del backend vs BCE
   */
  private logDataComparison(
    item: FavoritePair | FavoriteCurrency,
    type: 'pair' | 'currency'
  ): void {
    if (type === 'pair') {
      const pair = item as FavoritePair;
      console.log(`🔍 Comparación de datos para par ${pair.pair}:`, {
        backend: {
          currentRate: pair.currentRate,
          change: pair.change,
        },
        bce: {
          currentRate: 'N/A', // Los pares no tienen rate directo del backend
          change: pair.change,
          trendStatus: pair.trendStatus,
          changeText: pair.changeText,
        },
      });
    } else {
      const currency = item as FavoriteCurrency;
      const backendRate = this.getCurrentRateFromBackend(currency);
      console.log(`🔍 Comparación de datos para divisa ${currency.currency}:`, {
        backend: {
          currentRate: backendRate,
          change: 'N/A', // Backend no proporciona change para divisas individuales
        },
        bce: {
          currentRate: currency.currentRate,
          change: currency.change,
          trendStatus: currency.trendStatus,
          changeText: currency.changeText,
        },
      });
    }
  }

  /**
   * Obtener rate del backend (método original)
   */
  private getCurrentRateFromBackend(
    favoriteCurrency: FavoriteCurrency
  ): number {
    const base = this.baseCurrency;
    const rateKey = `${base}_to_${favoriteCurrency.currency}`;
    const rate = favoriteCurrency.rates[rateKey];
    return typeof rate === 'number' ? rate : 0;
  }

  getCurrentRateForCurrency(
    favoriteCurrency: FavoriteCurrency,
    baseCurrency?: string
  ): number {
    // ✅ PRIORIDAD 1: Usar currentRate del BCE si está disponible
    if (favoriteCurrency.currentRate && favoriteCurrency.currentRate > 0) {
      return favoriteCurrency.currentRate;
    }

    // ✅ FALLBACK: Usar rates del backend como antes
    const base = baseCurrency || this.baseCurrency;
    const rateKey = `${base}_to_${favoriteCurrency.currency}`;
    const rate = favoriteCurrency.rates[rateKey];
    return typeof rate === 'number' ? rate : 0;
  }

  trackByFavoriteCurrency(
    index: number,
    favoriteCurrency: FavoriteCurrency
  ): string {
    return favoriteCurrency.id;
  }

  // ========== MÉTODOS ADICIONALES PARA DIVISAS FAVORITAS ==========

  openAddCurrencyDialog(): void {
    const dialogRef = this.dialog.open(AddCurrencyDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si se añadió una divisa favorita, recargar la lista y el dropdown
        console.log('✅ Divisa favorita añadida:', result);
        this.loadFavoriteCurrencies();
        this.loadDropdownCurrencies(); // Recargar dropdown optimizado
      }
    });
  }

  editFavoriteCurrency(currency: FavoriteCurrency): void {
    const dialogRef = this.dialog.open(EditCurrencyDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      data: {
        currency: currency,
      },
    });

    dialogRef.afterClosed().subscribe((updates) => {
      if (updates) {
        // Aplicar las actualizaciones usando el método existente
        this.updateFavoriteCurrency(currency, updates);
      }
    });
  }

  toggleDefaultCurrency(currency: FavoriteCurrency): void {
    const newDefaultValue = !currency.isDefault;
    this.updateFavoriteCurrency(currency, { isDefault: newDefaultValue });
  }

  useInQuickConversionCurrency(currency: FavoriteCurrency): void {
    // ✅ MEJORADO: Usar la moneda base actual en lugar de EUR hardcodeado
    this.quickConversionForm.patchValue({
      from: this.baseCurrency, // ✅ Usa la moneda base seleccionada
      to: currency.currency,
    });

    // Scroll al panel de conversión
    document.querySelector('.conversion-panel')?.scrollIntoView({
      behavior: 'smooth',
    });

    this.snackBar.open(
      `📊 Usando ${this.baseCurrency}/${currency.currency} en conversión rápida`,
      'Cerrar',
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  getTotalFavorites(): number {
    return this.favoritePairs.length + this.favoriteCurrencies.length;
  }

  // Nuevas métricas valiosas
  getAverageChange(): number {
    const allItems = [
      ...this.favoritePairs.map((p) => p.change || 0),
      ...this.favoriteCurrencies.map((c) => c.change || 0),
    ];

    if (allItems.length === 0) return 0;
    return allItems.reduce((sum, change) => sum + change, 0) / allItems.length;
  }

  getPositiveChangesCount(): number {
    const allItems = [
      ...this.favoritePairs.map((p) => p.change || 0),
      ...this.favoriteCurrencies.map((c) => c.change || 0),
    ];
    return allItems.filter((change) => change > 0).length;
  }

  getVolatilityLevel(): 'Baja' | 'Media' | 'Alta' {
    const allChanges = [
      ...this.favoritePairs.map((p) => Math.abs(p.change || 0)),
      ...this.favoriteCurrencies.map((c) => Math.abs(c.change || 0)),
    ];

    if (allChanges.length === 0) return 'Baja';

    const avgVolatility =
      allChanges.reduce((sum, change) => sum + change, 0) / allChanges.length;

    if (avgVolatility < 0.5) return 'Baja';
    if (avgVolatility < 1.5) return 'Media';
    return 'Alta';
  }

  getMostActiveTime(): string {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 8 && hour < 17) return 'Mercado Europeo';
    if (hour >= 14 && hour < 23) return 'Mercado Americano';
    if (hour >= 23 || hour < 8) return 'Mercado Asiático';
    return 'Horario de Trading';
  }

  getMarketStatus(): { status: string; color: string; icon: string } {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend
    if (day === 0 || day === 6) {
      return { status: 'Mercado Cerrado', color: '#666', icon: 'schedule' };
    }

    // Weekday trading hours (simplified)
    if (hour >= 8 && hour < 17) {
      return {
        status: 'Mercado Activo',
        color: '#4caf50',
        icon: 'trending_up',
      };
    } else {
      return {
        status: 'Trading Limitado',
        color: '#ff9800',
        icon: 'access_time',
      };
    }
  }

  /**
   * Obtener la bandera de una moneda desde CURRENCY_FLAGS
   */
  getCurrencyFlag(code: string): string {
    return CURRENCY_FLAGS[code] || '🏳️'; // Fallback a bandera genérica
  }

  /**
   * Detectar si una moneda viene de Exchange (Frankfurter ~40) o Convert (Hardcoded 20)
   * ÚTIL: Para debugging y logging de fuentes de datos
   */
  private getCurrencySource(code: string): 'exchange' | 'convert' | 'unknown' {
    // Lista hardcodeada de /api/convert/currencies (20 monedas)
    const convertCurrencies = [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'CHF',
      'CAD',
      'AUD',
      'CNY',
      'MXN',
      'BRL',
      'KRW',
      'INR',
      'SEK',
      'NOK',
      'HKD',
      'SGD',
      'NZD',
      'ZAR',
      'TRY',
      'PLN',
    ];

    if (convertCurrencies.includes(code)) {
      return 'convert'; // Disponible en ambas fuentes
    } else if (this.allAvailableCurrencies.includes(code)) {
      return 'exchange'; // Solo disponible en Frankfurter
    } else {
      return 'unknown'; // No disponible en ninguna fuente conocida
    }
  }
}

// ============================================================================
// COMPONENTES DE DIÁLOGO INTEGRADOS
// ============================================================================

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
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<AddCurrencyDialogComponent>);
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
      nickname: ['', [Validators.maxLength(50)]],
      priority: [
        3,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
      isDefault: [false],
    });
  }

  ngOnInit(): void {
    // Inicialización del componente AddCurrencyDialogComponent
    console.log('AddCurrencyDialogComponent inicializado');
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
        .get<ExchangeRateResponse>(`${this.apiUrl}/exchange/latest?base=EUR`)
        .toPromise();

      if (response && response.rates[currency]) {
        this.currentRate = response.rates[currency];
      }
    } catch (error) {
      console.warn('Error obteniendo tasa actual:', error);
    } finally {
      this.loadingRate = false;
    }
  }

  getCurrencyName(code: string): string {
    const currency = this.currencies.find((c) => c.code === code);
    return currency ? currency.name : code;
  }

  onSave(): void {
    if (this.currencyForm.invalid) return;

    this.saving = true;
    const formValue = this.currencyForm.value;

    // Simular guardado (el componente padre manejará la lógica real)
    setTimeout(() => {
      this.saving = false;
      this.snackBar.open(
        `✅ ${formValue.currency} añadida a favoritas`,
        'Cerrar',
        { duration: 2000, panelClass: ['success-snackbar'] }
      );
      this.dialogRef.close(formValue);
    }, 500);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

// ============================================================================

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
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<AddFavoriteDialogComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  favoriteForm: FormGroup;
  currencies: Currency[] = [];
  currentRate: number | null = null;
  loadingRate = false;
  saving = false;
  private apiUrl = environment.apiUrl;

  constructor() {
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
  }

  setupFormSubscriptions(): void {
    this.favoriteForm.valueChanges.subscribe(() => {
      this.getCurrentRate();
    });
  }

  onFromCurrencyChange(): void {
    const toValue = this.favoriteForm.get('to')?.value;
    const fromValue = this.favoriteForm.get('from')?.value;

    if (toValue === fromValue) {
      this.favoriteForm.get('to')?.setValue('');
    }
  }

  getFilteredToCurrencies(): Currency[] {
    const fromValue = this.favoriteForm.get('from')?.value;
    return this.currencies.filter((currency) => currency.code !== fromValue);
  }

  swapCurrencies(): void {
    const fromValue = this.favoriteForm.get('from')?.value;
    const toValue = this.favoriteForm.get('to')?.value;

    this.favoriteForm.patchValue({
      from: toValue,
      to: fromValue,
    });
  }

  getCurrencyName(code: string): string {
    const currency = this.currencies.find((c) => c.code === code);
    return currency ? currency.name : code;
  }

  getCurrentRate(): void {
    const from = this.favoriteForm.get('from')?.value;
    const to = this.favoriteForm.get('to')?.value;

    if (!from || !to) {
      this.currentRate = null;
      return;
    }

    this.loadingRate = true;

    this.http
      .post<ConversionResponse>(`${this.apiUrl}/convert`, {
        from,
        to,
        amount: 1,
      })
      .subscribe({
        next: (response) => {
          this.currentRate = response.result;
          this.loadingRate = false;
        },
        error: (error) => {
          console.error('Error obteniendo tasa:', error);
          this.loadingRate = false;
        },
      });
  }

  onSave(): void {
    if (this.favoriteForm.invalid) return;

    this.saving = true;
    const formValue = this.favoriteForm.value;

    this.http
      .post<FavoriteResponse>(`${this.apiUrl}/favorites`, formValue)
      .subscribe({
        next: (response) => {
          this.saving = false;
          this.snackBar.open(response.message, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.dialogRef.close(response.favorite);
        },
        error: (error) => {
          this.saving = false;
          this.snackBar.open(
            error.error?.message || 'Error al guardar el favorito',
            'Cerrar',
            { duration: 3000, panelClass: ['error-snackbar'] }
          );
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

// ============================================================================

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

// ============================================================================

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
