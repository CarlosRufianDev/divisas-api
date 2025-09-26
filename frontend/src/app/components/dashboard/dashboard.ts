import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import {
  ConversionRequest,
  ConversionResponse,
  Currency,
  DivisasService,
  TechnicalAnalysis,
} from '../../services/divisas';
import {
  ADDITIONAL_CURRENCIES,
  CURRENCY_FLAGS,
  LIMITED_CURRENCIES,
} from '../../shared/currency-flags';
import { MaterialModule } from '../../shared/material.module';

// Dashboard interfaces
interface DashboardResult {
  amount: number;
  result: number;
  from: string;
  to: string;
  rate: number;
  date: string;
}

interface ExchangeRate {
  code: string;
  name: string;
  rate: number;
  tendencia: number; // Matches backend response
  volume?: string;
  flag: string;
  cambio: string; // Change text from backend
  trendStatus: string; // CSS class name
  changeText: string; // Display text for change
  isBaseCurrency: boolean;
}

interface UserStats {
  totalConversions: number;
  favoriteVolume: string;
  topPair: string;
  activeAlerts: number;
  weeklyTrend: string; // Changed to string to support includes()
  totalVolume: string;
  totalAlerts: number;
  trends?: { length: number }; // For trends data access
}

interface TickerRate {
  pair: string;
  rate: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

interface FavoriteTrend {
  pair: string;
  currentRate: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

interface FavoriteTrendsResponse {
  trends?: FavoriteTrend[];
  success?: boolean;
  [key: string]: unknown;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  resultado: DashboardResult | null = null;
  cargando = false;

  // Form Controls
  cantidad = new FormControl(100);
  monedaOrigen = new FormControl('USD');
  monedaDestino = new FormControl('EUR');

  // PROPIEDADES PARA LA TABLA
  tiposCambio: ExchangeRate[] = [];
  cargandoTabla = false;
  monedaBase = new FormControl('USD');
  ultimaActualizacion = '';

  // FILTRO DE DIVISAS PARA USUARIOS REGISTRADOS
  currencyFilter = new FormControl('');
  filteredTiposCambio: ExchangeRate[] = [];

  // PROPIEDADES PARA ANALYTICS
  userStats: UserStats | null = null;
  favoriteTrends: FavoriteTrendsResponse | null = null;
  loadingStats = false;

  // PROPIEDADES PARA MODALES
  showCurrencyDetail = false;
  selectedCurrency: Currency | null = null;
  selectedRate: ExchangeRate | null = null;
  showPremiumModal = false;
  premiumCurrency: Currency | null = null;

  // PROPIEDADES PARA ANÁLISIS TÉCNICO
  cargandoAnalisis = false;
  analisisCompletoReal: TechnicalAnalysis | null = null;
  tendenciasReales = new Map<string, number>();
  datosHistoricosReales: number[] = [];

  // INDICADORES TÉCNICOS
  tendenciaReal: number | null = null;
  volatilidadReal: number | null = null;
  rsi: number | null = null;
  sma: number | null = null;
  recomendacionReal: {
    accion: string;
    color: string;
    mensaje: string;
    confianza?: number;
    senales?: string[];
  } | null = null;

  indicadores: {
    label: string;
    valor: string | number;
    estado: 'ok' | 'warn' | 'bad';
    descripcion: string;
  }[] = [];

  // Control de carga optimizada
  private loadingStates = {
    rates: false,
    trends: false,
    analysis: false,
  };

  private destroy$ = new Subject<void>();

  // Lista de divisas disponibles (se cargará dinámicamente desde Frankfurter)
  divisas: Currency[] = [];

  // 🆕 PROPIEDADES PARA MARKET TICKER
  tickerRates: TickerRate[] = [];
  tickerPairs = [
    { pair: 'EUR/USD', from: 'EUR', to: 'USD' },
    { pair: 'GBP/USD', from: 'GBP', to: 'USD' },
    { pair: 'USD/JPY', from: 'USD', to: 'JPY' },
  ];
  tickerUpdateInterval: ReturnType<typeof setInterval> | null = null;

  // 🆕 NUEVAS PROPIEDADES PARA MODO LIMITADO
  isLimitedMode = false;
  limitedCurrencies: Currency[] = [];

  // Modern Angular 20 inject pattern
  private divisasService = inject(DivisasService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  public router = inject(Router);

  constructor() {
    // Configurar reactive forms - SOLO resetear resultado al cambiar divisas
    this.monedaOrigen.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        // No hacer conversión automática, solo resetear resultado si es diferente
        if (this.resultado && this.monedaOrigen.value !== this.resultado.from) {
          this.resultado = null;
        }
      });

    this.monedaDestino.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        // No hacer conversión automática, solo resetear resultado si es diferente
        if (this.resultado && this.monedaDestino.value !== this.resultado.to) {
          this.resultado = null;
        }
      });

    this.cantidad.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        // No hacer conversión automática, solo resetear resultado si es diferente
        if (this.resultado && this.cantidad.value !== this.resultado.amount) {
          this.resultado = null;
        }
      });

    this.monedaBase.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarTiposCambioReales();
      });

    // CONFIGURAR FILTRO DE DIVISAS (solo para usuarios registrados)
    this.currencyFilter.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((filterValue) => {
        this.filtrarDivisas(filterValue || '');
      });
  }

  async ngOnInit(): Promise<void> {
    console.log('🚀 Iniciando Dashboard...');

    // 🆕 DETERMINAR MODO DE OPERACIÓN
    this.isLimitedMode = !this.authService.isAuthenticated();

    if (this.isLimitedMode) {
      console.log('⚠️ Modo limitado activado para usuario no autenticado');
      // Fijar moneda base en USD para usuarios no autenticados
      this.monedaBase.setValue('USD');
      this.monedaBase.disable();
    } else {
      // Asegurar que el control esté habilitado para usuarios autenticados
      this.monedaBase.enable();
      // 🆕 INICIAR TICKER SOLO PARA USUARIOS AUTENTICADOS
      this.iniciarActualizacionTicker();
    }

    try {
      // Cargar datos según el modo
      await Promise.all([
        this.cargarDivisas(),
        this.cargarTiposCambioReales(),
        this.isLimitedMode ? Promise.resolve() : this.cargarDatosUsuario(),
      ]);

      console.log('✅ Dashboard inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando dashboard:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // 🆕 LIMPIAR TICKER
    this.detenerActualizacionTicker();
  }

  // � CARGAR DIVISAS DINÁMICAMENTE DESDE FRANKFURTER
  async cargarDivisas(): Promise<void> {
    try {
      console.log('🌍 Cargando divisas dinámicamente desde Frankfurter...');

      // 🆕 CARGAR DESDE FRANKFURTER API
      const currenciesData = await this.divisasService
        .loadCurrenciesFromFrankfurter()
        .toPromise();

      if (currenciesData) {
        // Transformar respuesta de Frankfurter en nuestro formato
        this.divisas = Object.keys(currenciesData).map((code) => ({
          code,
          name: currenciesData[code],
          flag: CURRENCY_FLAGS[code] || '🏳️', // Fallback si no tenemos flag
          symbol: code, // Using code as symbol fallback
        }));

        // 🆕 AGREGAR DIVISAS ADICIONALES (como ARS) que no están en Frankfurter
        this.divisas = [...this.divisas, ...ADDITIONAL_CURRENCIES];

        // Configurar divisas limitadas para usuarios no autenticados
        this.limitedCurrencies = this.divisas.filter((d) =>
          LIMITED_CURRENCIES.includes(d.code)
        );

        console.log(
          `✅ Cargadas dinámicamente ${this.divisas.length} divisas (${
            Object.keys(currenciesData).length
          } desde Frankfurter + ${ADDITIONAL_CURRENCIES.length} adicionales)`
        );
        console.log(
          `📊 Disponibles para no autenticados: ${this.limitedCurrencies.length}`
        );
      } else {
        throw new Error('No se recibieron datos de Frankfurter');
      }
    } catch (error) {
      console.error(
        '❌ Error cargando divisas dinámicamente, usando fallback:',
        error
      );

      // Fallback: crear lista mínima desde el mapeo de flags
      this.divisas = Object.keys(CURRENCY_FLAGS).map((code) => ({
        code,
        name: this.getCurrencyNameFallback(code),
        flag: CURRENCY_FLAGS[code],
        symbol: code, // Using code as symbol fallback
      }));

      this.limitedCurrencies = this.divisas.filter((d) =>
        LIMITED_CURRENCIES.includes(d.code)
      );

      console.log(
        `🔄 Fallback aplicado: ${this.divisas.length} divisas desde mapeo local`
      );
    }
  }

  // 🔧 HELPER: Nombres de divisas como fallback
  private getCurrencyNameFallback(code: string): string {
    const names: Record<string, string> = {
      ARS: 'Argentine Peso', // ✅ AGREGADO
      COP: 'Colombian Peso', // ✅ AGREGADO
      CLP: 'Chilean Peso', // ✅ AGREGADO
      PEN: 'Peruvian Sol', // ✅ AGREGADO
      UYU: 'Uruguayan Peso', // ✅ AGREGADO
      RUB: 'Russian Ruble', // ✅ AGREGADO
      EGP: 'Egyptian Pound', // ✅ AGREGADO
      VND: 'Vietnamese Dong', // ✅ AGREGADO
      KWD: 'Kuwaiti Dinar', // ✅ AGREGADO
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CHF: 'Swiss Franc',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CNY: 'Chinese Yuan',
      SEK: 'Swedish Krona',
      NOK: 'Norwegian Krone',
      DKK: 'Danish Krone',
      PLN: 'Polish Zloty',
      CZK: 'Czech Koruna',
      HUF: 'Hungarian Forint',
      RON: 'Romanian Leu',
      BGN: 'Bulgarian Lev',
      HRK: 'Croatian Kuna',
      TRY: 'Turkish Lira',
      BRL: 'Brazilian Real',
      MXN: 'Mexican Peso',
      SGD: 'Singapore Dollar',
      HKD: 'Hong Kong Dollar',
      NZD: 'New Zealand Dollar',
      KRW: 'South Korean Won',
      INR: 'Indian Rupee',
      MYR: 'Malaysian Ringgit',
      THB: 'Thai Baht',
      IDR: 'Indonesian Rupiah',
      PHP: 'Philippine Peso',
      ZAR: 'South African Rand',
      ILS: 'Israeli Shekel',
      ISK: 'Icelandic Krona',
    };
    return names[code] || `${code} Currency`;
  }

  // �🆕 MÉTODO PRINCIPAL: Cargar tipos de cambio con datos reales de Frankfurter
  async cargarTiposCambioReales(): Promise<void> {
    if (this.loadingStates.rates) return;

    const base = this.monedaBase.value || 'USD';
    this.loadingStates.rates = true;
    this.cargandoTabla = true;

    try {
      console.log(
        `💱 Cargando tipos de cambio y tendencias REALES desde BCE: ${base}`
      );

      // 🚀 USAR DATOS REALES DE TENDENCIAS VIA NUESTRO BACKEND
      const trendingResponse = await this.divisasService
        .getTrendingRates(base, undefined, 7)
        .toPromise();

      if (trendingResponse?.success && trendingResponse.rates) {
        const processedRates = [];

        // 🔥 AGREGAR LA MONEDA BASE COMO REFERENCIA
        const baseCurrencyInfo = this.divisas.find((d) => d.code === base);
        if (baseCurrencyInfo) {
          processedRates.push({
            code: base,
            name: baseCurrencyInfo.name,
            flag: baseCurrencyInfo.flag,
            rate: 1.0,
            tendencia: 0,
            cambio: '0.00%',
            trendStatus: 'reference',
            changeText: 'REFERENCIA',
            isBaseCurrency: true,
          });
        }

        // 🌍 PROCESAR TODAS LAS DIVISAS CON TENDENCIAS REALES DEL BCE
        trendingResponse.rates.forEach((rateData) => {
          // Buscar info de la divisa en nuestra lista (para flag y nombre)
          const currencyInfo = this.divisas.find(
            (d) => d.code === rateData.currency
          );

          if (currencyInfo) {
            // 🔄 MAPEAR trendStatus del backend a los valores esperados por el frontend
            let mappedTrendStatus: string;
            console.log(
              `🔍 Procesando ${rateData.currency}: trendStatus=${rateData.trendStatus}, trend=${rateData.trend}, currentRate=${rateData.currentRate}`
            );

            switch (rateData.trendStatus) {
              case 'up':
                mappedTrendStatus = 'trending-up';
                break;
              case 'down':
                mappedTrendStatus = 'trending-down';
                break;
              case 'stable':
              default:
                mappedTrendStatus = 'trending-stable'; // Cambiar a trending-stable
                break;
            }

            processedRates.push({
              code: rateData.currency,
              name: currencyInfo.name,
              flag: currencyInfo.flag,
              rate: rateData.currentRate,
              tendencia: rateData.trend, // REAL del BCE
              cambio: rateData.change, // REAL del BCE
              trendStatus: mappedTrendStatus, // MAPEADO para CSS
              changeText: rateData.change, // REAL del BCE
              isBaseCurrency: false,
            });
          }
        });

        this.tiposCambio = processedRates.slice(
          0,
          this.isLimitedMode ? 8 : undefined
        );
        this.ultimaActualizacion =
          trendingResponse.date || new Date().toLocaleDateString();

        console.log(
          `✅ Cargados ${processedRates.length} tipos de cambio CON TENDENCIAS REALES desde BCE`
        );
        console.log('📊 Fecha de datos:', trendingResponse.date);
        console.log('📈 Resumen tendencias:', trendingResponse.summary);
        console.log(
          '🎨 Datos procesados para CSS:',
          processedRates.map((r) => ({
            code: r.code,
            trendStatus: r.trendStatus,
            tendencia: r.tendencia,
            isBaseCurrency: r.isBaseCurrency,
          }))
        );

        // ✅ APLICAR FILTRO DESPUÉS DE CARGAR DATOS
        this.aplicarFiltroActual();
      } else {
        throw new Error('No se recibieron datos de tendencias reales');
      }
    } catch (error) {
      console.error('❌ Error cargando tipos de cambio:', error);
      this.snackBar.open(
        '❌ Error al cargar tipos de cambio. Inténtalo más tarde.',
        'Cerrar',
        { duration: 4000 }
      );
    } finally {
      this.loadingStates.rates = false;
      this.cargandoTabla = false;
    }
  }

  // MÉTODO PARA FILTRAR DIVISAS (solo usuarios registrados)
  private filtrarDivisas(filterValue: string): void {
    console.log(
      `🔍 filtrarDivisas llamado con: "${filterValue}", isAuthenticated=${this.isAuthenticated}, tiposCambio.length=${this.tiposCambio.length}`
    );

    if (!this.isAuthenticated) {
      // Para usuarios no autenticados, siempre mostrar todas las divisas disponibles
      this.filteredTiposCambio = [];
      return;
    }

    if (!filterValue.trim()) {
      // Sin filtro, mostrar todas las divisas
      this.filteredTiposCambio = [...this.tiposCambio];
    } else {
      const filter = this.normalizeText(filterValue.toLowerCase().trim());
      this.filteredTiposCambio = this.tiposCambio.filter(
        (rate) =>
          // Buscar en código (USD, EUR, etc.)
          this.normalizeText(rate.code.toLowerCase()).includes(filter) ||
          // Buscar en nombre completo (Dólar Estadounidense, Euro, etc.)
          this.normalizeText(rate.name.toLowerCase()).includes(filter) ||
          // Buscar en palabras individuales del nombre (Dólar, Estadounidense)
          rate.name
            .toLowerCase()
            .split(' ')
            .some((word: string) => this.normalizeText(word).includes(filter))
      );
    }

    console.log(
      `🔍 Filtro aplicado: "${filterValue}" - ${this.filteredTiposCambio.length} resultados de ${this.tiposCambio.length} divisas`
    );

    // Registrar uso del filtro (activity logging pattern)
    if (filterValue.trim()) {
      // Solo loggear búsquedas activas, no el clear
      this.logFilterUsage(filterValue, this.filteredTiposCambio.length);
    }
  }

  // MÉTODO AUXILIAR: Normalizar texto removiendo acentos y caracteres especiales
  private normalizeText(text: string): string {
    return text
      .normalize('NFD') // Descomponer caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos)
      .replace(/[^\w\s]/g, '') // Remover caracteres especiales excepto letras, números y espacios
      .trim();
  }

  // LOGGING DE ACTIVIDAD (siguiendo patrón establecido)
  private logFilterUsage(filterValue: string, resultsCount: number): void {
    if (!this.isAuthenticated) return;

    this.divisasService
      .logCurrencyFilter(filterValue, resultsCount)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Log silencioso - no mostrar nada al usuario
        },
        error: (error: Error) => {
          console.warn('📊 No se pudo registrar el uso del filtro:', error);
        },
      });
  }

  // MÉTODO AUXILIAR PARA APLICAR EL FILTRO ACTUAL
  private aplicarFiltroActual(): void {
    if (!this.isAuthenticated) {
      // Para usuarios no autenticados, la lista filtrada queda vacía
      // porque van a usar directamente tiposCambio en el template
      this.filteredTiposCambio = [];
      return;
    }

    // Para usuarios autenticados, SIEMPRE inicializar con todas las divisas disponibles
    this.filteredTiposCambio = [...this.tiposCambio];

    // Si hay un filtro activo, aplicarlo
    const currentFilter = this.currencyFilter.value || '';
    if (currentFilter.trim()) {
      this.filtrarDivisas(currentFilter);
    }

    console.log(
      `📊 Lista filtrada inicializada: ${this.filteredTiposCambio.length} divisas de ${this.tiposCambio.length} total`
    );
  }

  // ✅ MÉTODO PRINCIPAL DE CONVERSIÓN
  convert(): void {
    // Validaciones
    if (this.monedaOrigen.value === this.monedaDestino.value) {
      this.snackBar.open(
        '❌ Las divisas origen y destino deben ser diferentes',
        'Cerrar',
        {
          duration: 4000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    if (!this.cantidad.value || this.cantidad.value <= 0) {
      this.snackBar.open('❌ Ingresa una cantidad válida', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    if (!this.monedaOrigen.value || !this.monedaDestino.value) {
      this.snackBar.open('❌ Selecciona ambas divisas', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.cargando = true;

    const request: ConversionRequest = {
      from: this.monedaOrigen.value!,
      to: this.monedaDestino.value!,
      amount: this.cantidad.value!,
    };

    this.divisasService.convertCurrency(request).subscribe({
      next: (response: ConversionResponse) => {
        console.log('✅ Conversión desde tu backend:', response);
        this.resultado = {
          amount: response.amount,
          result: parseFloat(response.result),
          from: response.from,
          to: response.to,
          rate: response.rate,
          date: response.date,
        };
        this.cargando = false;
      },
      error: (error: { status: number }) => {
        console.error('❌ Error en conversión:', error);
        this.cargando = false;

        let errorMessage = 'Error en la conversión. Inténtalo de nuevo.';

        if (error.status === 422) {
          errorMessage = 'Las divisas origen y destino no pueden ser iguales.';
        } else if (error.status === 404) {
          errorMessage = 'Divisa no encontrada.';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifica tu internet.';
        }

        this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  // ✅ MÉTODOS HELPER PARA EL TEMPLATE
  getCurrencyFullName(code: string): string {
    const divisa = this.divisas.find((d) => d.code === code);
    return divisa?.name || code;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  getVolatilityLevel(rate: number): string {
    if (rate > 1.1 || rate < 0.9) return 'Alta';
    if (rate > 1.05 || rate < 0.95) return 'Moderada';
    return 'Baja';
  }

  cambiarMonedaBase(): void {
    this.cargarTiposCambioReales();
  }

  cargarTiposCambio(): void {
    this.cargarTiposCambioReales();
  }

  closeCurrencyModal(): void {
    this.showCurrencyDetail = false;
    this.selectedCurrency = null;
    this.selectedRate = null;
    this.showPremiumModal = false;
    this.premiumCurrency = null;
    document.body.style.overflow = 'auto';
  }

  getInverseRate(): number {
    return this.selectedRate ? 1 / this.selectedRate.rate : 0;
  }

  getTrendDirection(): string {
    if (!this.tendenciaReal) return 'stable';
    return this.tendenciaReal > 0
      ? 'up'
      : this.tendenciaReal < 0
      ? 'down'
      : 'stable';
  }

  // Helper methods for template null safety
  hasFavoriteTrends(): boolean {
    return !!(
      this.isAuthenticated &&
      this.favoriteTrends?.trends &&
      this.favoriteTrends.trends.length > 0
    );
  }

  getSmaComparison(): { text: string; class: string } | null {
    if (!this.sma || !this.selectedRate?.rate) return null;

    const rate = this.selectedRate.rate;
    const smaValue = this.sma;

    if (rate > smaValue)
      return { text: '(Por encima de la media)', class: 'sma-up' };
    if (rate < smaValue)
      return { text: '(Por debajo de la media)', class: 'sma-down' };
    return { text: '(En la media)', class: 'neutro' };
  }

  getTrendIcon(): string {
    const direction = this.getTrendDirection();
    switch (direction) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  addToFavorites(): void {
    this.snackBar.open('✅ Añadido a favoritos', 'Cerrar', { duration: 2000 });
  }

  goToRegister(): void {
    this.closePremiumModal();
    this.router.navigate(['/register']);
  }

  onPremiumModalBackground(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closePremiumModal();
    }
  }

  goToLogin(): void {
    this.closePremiumModal();
    this.router.navigate(['/login']);
  }

  // ✅ MÉTODOS EXISTENTES MEJORADOS
  intercambiarDivisas(): void {
    const temp = this.monedaOrigen.value;
    this.monedaOrigen.setValue(this.monedaDestino.value);
    this.monedaDestino.setValue(temp);

    if (this.cantidad.value && this.cantidad.value > 0) {
      this.convert();
    }
  }

  convertirA(currencyCode: string): void {
    this.monedaDestino.setValue(currencyCode);

    // Auto-scroll al conversor
    document.querySelector('.converter-section')?.scrollIntoView({
      behavior: 'smooth',
    });

    // Auto-convertir si hay cantidad
    if (this.cantidad.value && this.cantidad.value > 0) {
      setTimeout(() => this.convert(), 500);
    }

    this.snackBar.open(`🔄 Convirtiendo a ${currencyCode}`, 'Cerrar', {
      duration: 2000,
    });
  }

  compartirResultado(): void {
    if (!this.resultado) return;

    const texto = `💰 ${this.cantidad.value} ${
      this.monedaOrigen.value
    } = ${this.resultado.result.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${this.monedaDestino.value} (DivisasPro)`;

    if (navigator.share) {
      navigator.share({
        title: 'Conversión de Divisas',
        text: texto,
      });
    } else {
      this.copiarResultado();
    }
  }

  getTendenciaReal(currencyCode: string): number {
    return this.tendenciasReales.get(currencyCode) || 0;
  }

  onMonedaOrigenChange(): void {
    if (this.monedaDestino.value === this.monedaOrigen.value) {
      this.monedaDestino.setValue('');
    }
  }

  onMonedaDestinoChange(): void {
    if (this.monedaOrigen.value === this.monedaDestino.value) {
      this.monedaOrigen.setValue('');
    }
  }

  formatVolume(volume: string): string {
    const numericValue = parseFloat(volume);

    if (isNaN(numericValue)) return '0';

    if (numericValue >= 1000000000) {
      return (numericValue / 1000000000).toFixed(1) + 'B';
    } else if (numericValue >= 1000000) {
      return (numericValue / 1000000).toFixed(1) + 'M';
    } else if (numericValue >= 1000) {
      return (numericValue / 1000).toFixed(1) + 'K';
    } else {
      return numericValue.toString();
    }
  }

  // 🆕 MÉTODO MEJORADO: Ver detalles con análisis real
  async verDetalle(currencyCode: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.premiumCurrency =
        this.divisas.find((d) => d.code === currencyCode) || null;
      this.showPremiumModal = true;
      document.body.style.overflow = 'hidden';
      return;
    }

    console.log(`🔍 Cargando análisis técnico real para ${currencyCode}`);

    this.selectedCurrency =
      this.divisas.find((d) => d.code === currencyCode) || null;
    this.selectedRate =
      this.tiposCambio.find((r) => r.code === currencyCode) || null;
    this.showCurrencyDetail = true;
    document.body.style.overflow = 'hidden';

    // Reset
    this.analisisCompletoReal = null;
    this.cargandoAnalisis = true;
    this.indicadores = [];

    if (this.selectedRate && this.selectedCurrency) {
      try {
        const baseCurrency = this.monedaBase.value || 'USD';

        // 🔥 OBTENER ANÁLISIS TÉCNICO REAL
        console.log(
          `📊 Solicitando análisis: ${baseCurrency} → ${currencyCode}`
        );

        const analysis = await this.divisasService
          .getTechnicalAnalysis(baseCurrency, currencyCode, 30)
          .toPromise();

        if (analysis?.success) {
          this.analisisCompletoReal = analysis;
          console.log('✅ Análisis técnico recibido:', analysis.recommendation);

          // Asignar datos reales a propiedades existentes
          this.tendenciaReal = analysis.analysis.trend;
          this.volatilidadReal = analysis.analysis.volatility;
          this.rsi = analysis.analysis.rsi;
          this.sma = analysis.analysis.sma;
          this.datosHistoricosReales = analysis.rawData.rates;

          // Recomendación real
          this.recomendacionReal = {
            accion: analysis.recommendation.action,
            color: analysis.recommendation.color,
            mensaje: analysis.recommendation.message,
            confianza: analysis.recommendation.confidence,
            senales: analysis.recommendation.signals,
          };

          // Generar indicadores con datos reales
          this.indicadores = [
            {
              label: 'Tendencia',
              valor: `${this.tendenciaReal.toFixed(2)}%`,
              estado:
                this.tendenciaReal > 1
                  ? 'ok'
                  : this.tendenciaReal < -1
                  ? 'bad'
                  : 'warn',
              descripcion: `Variación ${analysis.period} (datos reales BCE)`,
            },
            {
              label: 'RSI',
              valor: this.rsi.toString(),
              estado: this.rsi < 30 || this.rsi > 70 ? 'warn' : 'ok',
              descripcion: `Índice de fuerza relativa (${analysis.dataPoints} días)`,
            },
            {
              label: 'SMA',
              valor: this.sma.toFixed(4),
              estado: this.selectedRate.rate > this.sma ? 'ok' : 'warn',
              descripcion: 'Media móvil simple (7 días)',
            },
            {
              label: 'Volatilidad',
              valor: (this.volatilidadReal * 100).toFixed(2) + '%',
              estado:
                this.volatilidadReal < 0.02
                  ? 'ok'
                  : this.volatilidadReal > 0.05
                  ? 'bad'
                  : 'warn',
              descripcion: 'Desviación estándar de precios',
            },
            {
              label: 'Soporte',
              valor: analysis.analysis.support.toFixed(4),
              estado: 'ok',
              descripcion: `Nivel mínimo ${analysis.period}`,
            },
            {
              label: 'Resistencia',
              valor: analysis.analysis.resistance.toFixed(4),
              estado: 'ok',
              descripcion: `Nivel máximo ${analysis.period}`,
            },
          ];

          console.log('✅ Indicadores actualizados con datos reales');
        } else {
          throw new Error('Análisis inválido recibido');
        }
      } catch (error) {
        console.error('❌ Error cargando análisis:', error);

        // Indicador de error
        this.indicadores = [
          {
            label: 'Error',
            valor: 'No disponible',
            estado: 'bad',
            descripcion: 'No se pudieron cargar los datos técnicos',
          },
        ];
      } finally {
        this.cargandoAnalisis = false;
      }
    }
  }

  getRecommendationBreakdown() {
    return [
      {
        label: 'RSI',
        value: this.rsi ?? '—',
        descripcion:
          'Índice de fuerza relativa (14 días). <30: sobreventa, >70: sobrecompra.',
        positive: this.rsi !== null && this.rsi < 40,
        negative: this.rsi !== null && this.rsi > 60,
      },
      {
        label: 'Tendencia',
        value:
          this.tendenciaReal !== null
            ? this.tendenciaReal.toFixed(2) + '%'
            : '—',
        descripcion: 'Variación porcentual últimos 30 días.',
        positive: this.tendenciaReal !== null && this.tendenciaReal > 0.5,
        negative: this.tendenciaReal !== null && this.tendenciaReal < -0.5,
      },
      {
        label: 'SMA',
        value: this.sma ?? '—',
        descripcion: 'Media móvil simple de 7 días.',
        positive:
          this.selectedRate &&
          this.sma !== null &&
          this.selectedRate.rate > this.sma,
        negative:
          this.selectedRate &&
          this.sma !== null &&
          this.selectedRate.rate < this.sma,
      },
      {
        label: 'Volatilidad',
        value:
          this.volatilidadReal !== null ? this.volatilidadReal.toFixed(4) : '—',
        descripcion: 'Desviación estándar últimos 30 días.',
        positive: this.volatilidadReal !== null && this.volatilidadReal < 0.02,
        negative: this.volatilidadReal !== null && this.volatilidadReal > 0.05,
      },
    ];
  }

  handleDetalles(currencyCode: string): void {
    if (this.authService.isAuthenticated()) {
      this.verDetalle(currencyCode);
    } else {
      this.showPremiumModal = true;
      this.premiumCurrency =
        this.divisas.find((d) => d.code === currencyCode) || null;
      document.body.style.overflow = 'hidden';
    }
  }

  closePremiumModal(): void {
    this.showPremiumModal = false;
    this.premiumCurrency = null;
    document.body.style.overflow = 'auto';
  }

  private async cargarDatosUsuario(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    try {
      const [userStats, favoriteTrends] = await Promise.all([
        this.divisasService
          .getUserStats()
          .toPromise()
          .catch(() => null),
        this.divisasService
          .getFavoriteTrends()
          .toPromise()
          .catch(() => null),
      ]);

      if (userStats?.success) {
        this.userStats = userStats.stats;
        console.log('✅ Stats de usuario cargados');
      }

      if (favoriteTrends?.success) {
        this.favoriteTrends = favoriteTrends;
        console.log('✅ Tendencias de favoritos cargadas');
      }
    } catch (error) {
      console.warn('⚠️ Error cargando datos de usuario:', error);
    }
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
  // 🆕 MÉTODO NUEVO: Obtener divisas según el modo
  getDivisasDisponibles() {
    return this.isLimitedMode ? this.limitedCurrencies : this.divisas;
  }

  // 🆕 MÉTODO MODIFICADO: Filtrar divisas origen según el modo
  getDivisasOrigen() {
    const disponibles = this.getDivisasDisponibles();
    return disponibles.filter(
      (divisa) => divisa.code !== this.monedaDestino.value
    );
  }

  // 🆕 MÉTODO MODIFICADO: Filtrar divisas destino según el modo
  getDivisasDestino() {
    const disponibles = this.getDivisasDisponibles();
    return disponibles.filter(
      (divisa) => divisa.code !== this.monedaOrigen.value
    );
  }

  // 🆕 MÉTODO PARA CARGAR TICKER EN TIEMPO REAL

  // 🆕 MÉTODO ALTERNATIVO: Usar datos de tendencias reales para ticker
  async cargarTickerRealTime(): Promise<void> {
    if (!this.isAuthenticated) return;

    try {
      console.log('📊 Cargando ticker desde tendencias reales...');

      // ✅ USAR EL MÉTODO EXISTENTE QUE YA FUNCIONA
      const tendenciasResponse = await this.divisasService
        .getTrendingRates('USD', undefined, 7)
        .toPromise();

      if (tendenciasResponse?.success && tendenciasResponse.rates) {
        // Filtrar solo los pares que queremos en el ticker
        const paresTickerCodes = ['EUR', 'GBP', 'JPY'];

        this.tickerRates = []; // Limpiar array

        tendenciasResponse.rates
          .filter((rate) => paresTickerCodes.includes(rate.currency))
          .forEach((rateData) => {
            let pairName = '';

            // Construir nombre del par
            if (rateData.currency === 'EUR') pairName = 'EUR/USD';
            else if (rateData.currency === 'GBP') pairName = 'GBP/USD';
            else if (rateData.currency === 'JPY') pairName = 'USD/JPY';

            if (pairName) {
              this.actualizarTickerItem(
                pairName,
                rateData.currentRate,
                rateData.trend
              );
            }
          });

        console.log(
          `✅ Ticker actualizado con datos reales: ${this.tickerRates.length} pares`
        );
      } else {
        console.warn('⚠️ No se recibieron datos reales para ticker');
        this.tickerRates = []; // Mantener vacío sin datos simulados
      }
    } catch (error) {
      console.error('❌ Error cargando ticker real:', error);
      this.tickerRates = []; // Mantener vacío si falla, no usar datos simulados
    }
  }

  // 🆕 MÉTODO PARA ACTUALIZAR ITEM DEL TICKER
  private actualizarTickerItem(
    pair: string,
    rate: number,
    tendencia: number
  ): void {
    const existingIndex = this.tickerRates.findIndex(
      (item) => item.pair === pair
    );

    const tickerItem: TickerRate = {
      pair: pair,
      rate: rate.toFixed(4),
      change:
        tendencia > 0
          ? `+${tendencia.toFixed(2)}%`
          : `${tendencia.toFixed(2)}%`,
      trend: tendencia > 0 ? 'up' : tendencia < 0 ? 'down' : 'stable',
    };

    if (existingIndex >= 0) {
      this.tickerRates[existingIndex] = tickerItem;
    } else {
      this.tickerRates.push(tickerItem);
    }
  }

  // 🆕 MÉTODO PARA INICIAR ACTUALIZACIÓN AUTOMÁTICA
  private iniciarActualizacionTicker(): void {
    if (!this.isAuthenticated) return;

    // Cargar inmediatamente
    this.cargarTickerRealTime();

    // Actualizar cada 60 segundos
    this.tickerUpdateInterval = setInterval(() => {
      if (this.isAuthenticated) {
        this.cargarTickerRealTime();
      } else {
        this.detenerActualizacionTicker();
      }
    }, 60000);

    console.log('⏰ Ticker automático iniciado (60s)');
  }

  // 🆕 MÉTODO PARA DETENER ACTUALIZACIÓN
  private detenerActualizacionTicker(): void {
    if (this.tickerUpdateInterval) {
      clearInterval(this.tickerUpdateInterval);
      this.tickerUpdateInterval = null;
      console.log('⏹️ Ticker automático detenido');
    }
  }

  // 🆕 MÉTODOS AUXILIARES PARA EL NUEVO CONVERSOR
  limpiarResultado(): void {
    this.resultado = null;
  }

  formatearFecha(timestamp: string | Date): string {
    if (!timestamp) return '';
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString('es-ES');
  }

  obtenerTasaInversa(): number {
    return this.resultado ? 1 / this.resultado.rate : 0;
  }

  copiarResultado(): void {
    if (this.resultado) {
      const texto = `${this.cantidad.value} ${
        this.monedaOrigen.value
      } = ${this.resultado.result.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${this.monedaDestino.value}`;
      navigator.clipboard.writeText(texto).then(() => {
        // Opcional: mostrar mensaje de éxito
        console.log('Resultado copiado al portapapeles');
      });
    }
  }
}
