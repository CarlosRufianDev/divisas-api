import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import {
  ConversionRequest,
  ConversionResponse,
  DivisasService,
  TechnicalAnalysis,
} from '../../services/divisas';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  resultado: any = null;
  cargando = false;

  // Form Controls
  cantidad = new FormControl(100);
  monedaOrigen = new FormControl('USD');
  monedaDestino = new FormControl('EUR');

  // PROPIEDADES PARA LA TABLA
  tiposCambio: any[] = [];
  cargandoTabla = false;
  monedaBase = new FormControl('USD');
  ultimaActualizacion: string = '';

  // PROPIEDADES PARA ANALYTICS
  userStats: any = null;
  favoriteTrends: any = null;
  loadingStats = false;

  // PROPIEDADES PARA MODALES
  showCurrencyDetail = false;
  selectedCurrency: any = null;
  selectedRate: any = null;
  showPremiumModal = false;
  premiumCurrency: any = null;

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

  // Lista de divisas disponibles
  divisas = [
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
    private divisasService: DivisasService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Configurar reactive forms para mejor rendimiento
    this.monedaOrigen.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.convert(); // ✅ CORREGIDO: usar convert() en lugar de convertir()
      });

    this.monedaDestino.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.convert(); // ✅ CORREGIDO
      });

    this.cantidad.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.convert(); // ✅ CORREGIDO
      });

    this.monedaBase.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarTiposCambioReales();
      });
  }

  async ngOnInit(): Promise<void> {
    console.log('🚀 Iniciando Dashboard con datos reales');

    try {
      // Cargar datos en paralelo para mejor rendimiento
      await Promise.all([
        this.cargarDivisas(), // ✅ CORREGIDO: usar cargarDivisas() en lugar de cargarMonedas()
        this.cargarTiposCambioReales(),
        this.cargarDatosUsuario(),
      ]);

      console.log('✅ Dashboard inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando dashboard:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ MÉTODO AÑADIDO: Cargar divisas (antes faltaba)
  async cargarDivisas(): Promise<void> {
    try {
      // Las divisas ya están hardcodeadas, pero podrías cargarlas desde el API
      console.log('✅ Divisas cargadas desde configuración local');
    } catch (error) {
      console.warn('⚠️ Error cargando divisas:', error);
    }
  }

  // 🆕 MÉTODO PRINCIPAL: Cargar tipos de cambio con datos reales
  async cargarTiposCambioReales(): Promise<void> {
    if (this.loadingStates.rates) return;

    const base = this.monedaBase.value || 'USD';
    this.loadingStates.rates = true;
    this.cargandoTabla = true;

    try {
      console.log(`💱 Cargando tipos de cambio reales desde: ${base}`);

      // 🔥 USAR EL NUEVO MÉTODO CON TENDENCIAS REALES
      const tendenciasResponse = await this.divisasService
        .getTrendingRates(base, undefined, 7)
        .toPromise();

      if (tendenciasResponse?.success) {
        console.log(
          '✅ Tendencias reales obtenidas:',
          tendenciasResponse.summary
        );

        // Procesar datos con tendencias reales
        this.tiposCambio = tendenciasResponse.rates
          .map((rateData) => {
            const divisa = this.divisas.find(
              (d) => d.code === rateData.currency
            );
            if (!divisa) return null;

            // Guardar tendencia real
            this.tendenciasReales.set(rateData.currency, rateData.trend);

            return {
              code: rateData.currency,
              name: divisa.name,
              flag: divisa.flag,
              rate: rateData.currentRate,
              tendencia: rateData.trend,
              cambio: rateData.change,
              trendStatus: rateData.trendStatus,
            };
          })
          .filter(Boolean);
        // ✅ Sin límite - mostrar todas las disponibles (ordenadas por popularidad)

        this.ultimaActualizacion = new Date().toLocaleTimeString();
        console.log(
          `✅ Procesadas ${this.tiposCambio.length} monedas con tendencias reales`
        );
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error cargando tendencias reales:', error);
      // Fallback al método anterior
      await this.cargarTiposCambioFallback(base);
    } finally {
      this.loadingStates.rates = false;
      this.cargandoTabla = false;
    }
  }

  // 🆕 MÉTODO: Fallback para tipos de cambio
  private async cargarTiposCambioFallback(base: string): Promise<void> {
    try {
      console.log('🔄 Usando fallback de Frankfurter directo...');

      const response = await this.divisasService
        .getLatestRatesFromFrankfurter(base)
        .toPromise();

      if (response?.rates) {
        this.tiposCambio = Object.entries(response.rates)
          .map(([code, rate]) => {
            const divisa = this.divisas.find((d) => d.code === code);
            if (!divisa) return null;

            return {
              code,
              name: divisa.name,
              flag: divisa.flag,
              rate: Number(rate),
              tendencia: 0, // Sin datos históricos en fallback
              cambio: '0.00%',
              trendStatus: 'stable',
            };
          })
          .filter(Boolean)
          .slice(0, 12);

        this.ultimaActualizacion =
          response.date || new Date().toLocaleDateString();
        console.log('✅ Fallback completado');
      }
    } catch (error) {
      console.error('❌ Error en fallback:', error);
      this.tiposCambio = [];
    }
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
          result: response.result,
          from: response.from,
          to: response.to,
          rate: response.rate,
          date: response.date,
        };
        this.cargando = false;
      },
      error: (error: any) => {
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

  copiarResultado(): void {
    const texto = `${this.cantidad.value} ${this.monedaOrigen.value} = ${this.resultado.result} ${this.monedaDestino.value}`;
    navigator.clipboard.writeText(texto).then(() => {
      this.snackBar.open('✅ Resultado copiado al portapapeles', 'Cerrar', {
        duration: 2000,
      });
    });
  }

  compartirResultado(): void {
    const texto = `💰 ${this.cantidad.value} ${this.monedaOrigen.value} = ${this.resultado.result} ${this.monedaDestino.value} (DivisasPro)`;

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

  getDivisasOrigen() {
    return this.divisas.filter(
      (divisa) => divisa.code !== this.monedaDestino.value
    );
  }

  getDivisasDestino() {
    return this.divisas.filter(
      (divisa) => divisa.code !== this.monedaOrigen.value
    );
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
      this.premiumCurrency = this.divisas.find((d) => d.code === currencyCode);
      this.showPremiumModal = true;
      document.body.style.overflow = 'hidden';
      return;
    }

    console.log(`🔍 Cargando análisis técnico real para ${currencyCode}`);

    this.selectedCurrency = this.divisas.find((d) => d.code === currencyCode);
    this.selectedRate = this.tiposCambio.find((r) => r.code === currencyCode);
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
      this.premiumCurrency = this.divisas.find((d) => d.code === currencyCode);
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
}
