import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router'; // ✅ AÑADIR esta línea
import { AuthService } from '../../services/auth'; // ✅ AÑADIR
import {
  ConversionRequest,
  ConversionResponse,
  DivisasService,
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

  // AÑADIR propiedades para analytics:
  userStats: any = null;
  favoriteTrends: any = null;
  loadingStats = false;

  // AÑADIR propiedades para el modal:
  showCurrencyDetail = false;
  selectedCurrency: any = null;
  selectedRate: any = null;

  // AÑADIR nueva propiedad para el modal premium
  showPremiumModal = false;
  premiumCurrency: any = null;

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
  ]; // ✅ Ahora 14 divisas (igual que historial)

  private refreshInterval: any;

  // NUEVAS PROPIEDADES PARA TENDENCIA Y VOLATILIDAD REALES
  tendenciaReal: number | null = null;
  volatilidadReal: number | null = null;
  historicoReal: number[] = [];

  // AÑADIDO: propiedad para recomendación real
  recomendacionReal: { accion: string; color: string; mensaje: string } | null =
    null;

  // NUEVO: propiedad para RSI
  rsi: number | null = null;
  sma: number | null = null;

  // Añade esta propiedad:
  indicadores: {
    label: string;
    valor: string | number;
    estado: 'ok' | 'warn' | 'bad';
    descripcion: string;
  }[] = [];

  // Añade esta nueva propiedad a la clase
  tendenciasReales: Map<string, number> = new Map();

  constructor(
    private divisasService: DivisasService,
    private snackBar: MatSnackBar,
    private authService: AuthService, // ✅ AÑADIR esta línea
    private router: Router // ✅ AÑADIR esta línea
  ) {
    // this.cargarTiposCambio();
  }

  ngOnInit() {
    this.cargarTiposCambio();

    // Actualizar una vez al día en lugar de cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.cargarTiposCambio();
    }, 24 * 60 * 60 * 1000); // 24 horas

    if (this.isAuthenticated) {
      this.monedaBase.enable();
      this.cargarAnalytics();
    } else {
      this.monedaBase.disable();
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // Asegurar que cargarTiposCambio() usa datos reales
  async cargarTiposCambio(): Promise<void> {
    const base = this.monedaBase.value || 'USD';
    this.cargandoTabla = true;

    try {
      // ✅ AÑADIR LOG para verificar URL
      console.log(
        '🌍 Obteniendo datos de Frankfurter:',
        `https://api.frankfurter.app/latest?from=${base}`
      );

      const response = await this.divisasService
        .getLatestRatesFromFrankfurter(base)
        .toPromise();

      // ✅ AÑADIR LOG para verificar respuesta
      console.log('📊 Respuesta de Frankfurter:', response);
      console.log('💱 Rates disponibles:', Object.keys(response.rates));

      // 2. Para cada divisa, cargar histórico y calcular indicadores
      this.tiposCambio = [];

      for (const currency of Object.keys(response.rates)) {
        const divisa = this.divisas.find((d) => d.code === currency);
        if (divisa) {
          try {
            // Obtener histórico real de 30 días
            const historico = await this.obtenerHistorico(base, currency);

            // Calcular todos los indicadores reales
            const tendencia = this.calcularTendencia(historico);
            const volatilidad = this.calcularVolatilidad(historico);
            const rsi = this.calcularRSI(historico);
            const sma = this.calcularSMA(historico);

            // Añadir a tiposCambio con todos los indicadores reales
            this.tiposCambio.push({
              code: currency,
              name: divisa.name,
              flag: divisa.flag,
              rate: response.rates[currency],
              base: response.base,
              tendencia: tendencia,
              volatilidad: volatilidad,
              rsi: rsi,
              sma: sma,
              cambio: tendencia.toFixed(2),
            });

            // Guardar tendencia real para usar en la vista
            this.tendenciasReales.set(currency, tendencia);
          } catch (error) {
            console.error(
              `Error calculando indicadores para ${currency}:`,
              error
            );
          }
        }
      }

      // 3. Actualizar timestamp y ordenar
      this.ultimaActualizacion = new Date().toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }); // + ' (Datos: Frankfurter/BCE)';
      this.tiposCambio.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      console.error('Error cargando tipos de cambio:', error);
    } finally {
      this.cargandoTabla = false;
    }
  }

  // PROCESAR datos de tu backend Node.js
  procesarTiposCambioBackend(response: any, base: string): void {
    console.log('🔍 Response completo del backend:', response);
    console.log('🔍 Rates disponibles:', Object.keys(response.rates || {}));

    this.ultimaActualizacion = response.date || new Date().toLocaleDateString();
    this.tiposCambio = [];

    if (response.rates) {
      Object.keys(response.rates).forEach((currency) => {
        const divisa = this.divisas.find((d) => d.code === currency);

        if (divisa) {
          console.log(`✅ Añadiendo ${currency}: ${response.rates[currency]}`);
          this.tiposCambio.push({
            code: currency,
            name: divisa ? divisa.name : this.getCurrencyName(currency),
            flag: divisa ? divisa.flag : this.getCurrencyFlag(currency),
            rate: response.rates[currency],
            base: response.base || base,
          });
        } else {
          console.log(`❌ Divisa ${currency} no encontrada en array local`);
        }
      });
    }

    console.log('🔍 Final tiposCambio array:', this.tiposCambio);
    this.tiposCambio.sort((a, b) => a.code.localeCompare(b.code));
  }

  // FALLBACK con Frankfurter
  cargarTiposCambioFallback(base: string): void {
    this.divisasService.getLatestRatesFromFrankfurter(base).subscribe({
      next: (response: any) => {
        console.log('✅ Datos de Frankfurter:', response);
        this.procesarTiposCambioFrankfurter(response);
        this.cargandoTabla = false;
      },
      error: (error: any) => {
        console.error('❌ Error total:', error);
        this.cargandoTabla = false;
      },
    });
  }

  // PROCESAR datos de Frankfurter (fallback)
  procesarTiposCambioFrankfurter(response: any): void {
    this.ultimaActualizacion = response.date || new Date().toLocaleDateString();
    this.tiposCambio = [];

    if (response.rates) {
      Object.keys(response.rates).forEach((currency) => {
        const divisa = this.divisas.find((d) => d.code === currency);
        if (divisa) {
          this.tiposCambio.push({
            code: currency,
            name: divisa.name,
            flag: divisa.flag,
            rate: response.rates[currency],
            base: response.base,
          });
        }
      });
    }

    this.tiposCambio.sort((a, b) => a.code.localeCompare(b.code));
  }

  cambiarMonedaBase(): void {
    this.cargarTiposCambio();
  }

  // MÉTODO ACTUALIZADO PARA CONVERSIÓN
  convertirDivisas(): void {
    const cantidad = this.cantidad.value || 0;
    const origen = this.monedaOrigen.value || 'USD';
    const destino = this.monedaDestino.value || 'EUR';

    if (cantidad <= 0) {
      return;
    }

    this.cargando = true;

    const request: ConversionRequest = {
      from: origen,
      to: destino,
      amount: cantidad,
    };

    this.divisasService.convertCurrency(request).subscribe({
      next: (response: ConversionResponse) => {
        console.log('✅ Conversión desde tu backend:', response);

        // ✅ CORREGIR: Usar directamente los valores del backend
        this.resultado = {
          amount: response.amount,
          result: response.result, // ✅ Ya está calculado correctamente (85.361)
          from: response.from,
          to: response.to,
          rate: response.rate, // ✅ Ya está calculado correctamente (0.85361)
          date: response.date,
        };

        // ✅ AÑADIR: Calcular el rate inverso correctamente
        this.resultado.inverseRate = 1 / response.rate; // Para mostrar EUR a USD

        this.cargando = false;
      },
      error: (error: any) => {
        console.error('❌ Error en conversión:', error);
        this.cargando = false;
      },
    });
  }

  // ❌ ELIMINAR este método que causa confusión:
  // convertirConFrankfurter() { ... }

  intercambiarDivisas(): void {
    const temp = this.monedaOrigen.value;
    this.monedaOrigen.setValue(this.monedaDestino.value);
    this.monedaDestino.setValue(temp);

    if (this.cantidad.value && this.cantidad.value > 0) {
      this.convertirDivisas();
    }
  }

  probarConversion(): void {
    this.convertirDivisas();
  }

  usarEnConversor(codigoDivisa: string): void {
    this.monedaDestino.setValue(codigoDivisa);

    if (this.cantidad.value && this.cantidad.value > 0) {
      this.convertirDivisas();
    }
  }

  // NUEVO: Método convert() con validaciones
  convert(): void {
    // ✅ VALIDACIÓN: Misma divisa (CORREGIR)
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

    // ✅ VALIDACIÓN: Cantidad válida (CORREGIR)
    if (!this.cantidad.value || this.cantidad.value <= 0) {
      this.snackBar.open('❌ Ingresa una cantidad válida', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // ✅ VALIDACIÓN: Divisas seleccionadas (AÑADIR)
    if (!this.monedaOrigen.value || !this.monedaDestino.value) {
      this.snackBar.open('❌ Selecciona ambas divisas', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.cargando = true;

    // ✅ CORREGIR request con validación de null:
    const request: ConversionRequest = {
      from: this.monedaOrigen.value!, // ✅ Usar ! para indicar que no es null
      to: this.monedaDestino.value!, // ✅ Usar ! para indicar que no es null
      amount: this.cantidad.value!, // ✅ Usar ! para indicar que no es null
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
        console.error('❌ Error en tu conversión:', error);
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

  // ✅ FILTRAR divisas para origen (excluir la seleccionada en destino)
  getDivisasOrigen() {
    return this.divisas.filter(
      (divisa) => divisa.code !== this.monedaDestino.value
    );
  }

  // ✅ FILTRAR divisas para destino (excluir la seleccionada en origen)
  getDivisasDestino() {
    return this.divisas.filter(
      (divisa) => divisa.code !== this.monedaOrigen.value
    );
  }

  // ✅ EVENTO cuando cambia divisa origen
  onMonedaOrigenChange(): void {
    // Si la divisa destino es igual a la origen, resetear destino
    if (this.monedaDestino.value === this.monedaOrigen.value) {
      this.monedaDestino.setValue('');
    }
  }

  // ✅ EVENTO cuando cambia divisa destino
  onMonedaDestinoChange(): void {
    // Si la divisa origen es igual a la destino, resetear origen
    if (this.monedaOrigen.value === this.monedaDestino.value) {
      this.monedaOrigen.setValue('');
    }
  }

  // ✅ AÑADIR funciones helper al final de la clase:

  getCurrencyName(code: string): string {
    const names: { [key: string]: string } = {
      AUD: 'Dólar Australiano',
      BGN: 'Lev Búlgaro',
      BRL: 'Real Brasileño',
      CAD: 'Dólar Canadiense',
      CHF: 'Franco Suizo',
      CNY: 'Yuan Chino',
      CZK: 'Corona Checa',
      DKK: 'Corona Danesa',
      EUR: 'Euro',
      GBP: 'Libra Esterlina',
      HKD: 'Dólar de Hong Kong',
      HUF: 'Forint Húngaro',
      IDR: 'Rupia Indonesia',
      ILS: 'Shekel Israelí',
      INR: 'Rupia India',
      ISK: 'Corona Islandesa',
      JPY: 'Yen Japonés',
      KRW: 'Won Surcoreano',
      MXN: 'Peso Mexicano',
      MYR: 'Ringgit Malayo',
      NOK: 'Corona Noruega',
      NZD: 'Dólar Neozelandés',
      PHP: 'Peso Filipino',
      PLN: 'Zloty Polaco',
      RON: 'Leu Rumano',
      SEK: 'Corona Sueca',
      SGD: 'Dólar de Singapur',
      THB: 'Baht Tailandés',
      TRY: 'Lira Turca',
      USD: 'Dólar Estadounidense',
      ZAR: 'Rand Sudafricano',
    };
    return names[code] || code;
  }

  getCurrencyFlag(code: string): string {
    const flags: { [key: string]: string } = {
      AUD: '🇦🇺',
      BGN: '🇧🇬',
      BRL: '🇧🇷',
      CAD: '🇨🇦',
      CHF: '🇨🇭',
      CNY: '🇨🇳',
      CZK: '🇨🇿',
      DKK: '🇩🇰',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      HKD: '🇭🇰',
      HUF: '🇭🇺',
      IDR: '🇮🇩',
      ILS: '🇮🇱',
      INR: '🇮🇳',
      ISK: '🇮🇸',
      JPY: '🇯🇵',
      KRW: '🇰🇷',
      MXN: '🇲🇽',
      MYR: '🇲🇾',
      NOK: '🇳🇴',
      NZD: '🇳🇿',
      PHP: '🇵🇭',
      PLN: '🇵🇱',
      RON: '🇷🇴',
      SEK: '🇸🇪',
      SGD: '🇸🇬',
      THB: '🇹🇭',
      TRY: '🇹🇷',
      USD: '🇺🇸',
      ZAR: '🇿🇦',
    };
    return flags[code] || '🌍';
  }

  // NUEVOS MÉTODOS:
  cargarAnalytics(): void {
    this.loadingStats = true;
    console.log('🔍 Cargando analytics...');

    // Cargar estadísticas del usuario
    this.divisasService.getUserStats().subscribe({
      next: (stats) => {
        this.userStats = stats;
        console.log('✅ User stats loaded:', stats);
      },
      error: (error) => console.error('❌ Error loading stats:', error),
    });

    // Cargar tendencias de favoritos
    this.divisasService.getFavoriteTrends().subscribe({
      next: (trends) => {
        this.favoriteTrends = trends;
        this.loadingStats = false;
        console.log('✅ Favorite trends loaded:', trends);
      },
      error: (error) => {
        console.error('❌ Error loading trends:', error);
        this.loadingStats = false;
      },
    });
  }

  // AÑADIR después de las otras propiedades:
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
      // Fallback: copiar al portapapeles
      this.copiarResultado();
    }
  }

  // Simular tendencias (en futuro podrías obtenerlas de tu API)
  getTendenciaReal(currencyCode: string): number {
    return this.tendenciasReales.get(currencyCode) || 0;
  }

  getVariacionPorcentual(currencyCode: string): string {
    const tendencia = this.tendenciasReales.get(currencyCode);
    if (tendencia === undefined) return '0.00';
    return tendencia.toFixed(2);
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

  convertirDesde(currencyCode: string): void {
    this.monedaOrigen.setValue(currencyCode);

    // Auto-scroll al conversor
    document.querySelector('.converter-section')?.scrollIntoView({
      behavior: 'smooth',
    });

    this.snackBar.open(`📤 Convirtiendo desde ${currencyCode}`, 'Cerrar', {
      duration: 2000,
    });
  }

  // NUEVO: Ver detalles de una divisa
  async verDetalle(currencyCode: string): Promise<void> {
    // Verificación de seguridad adicional
    if (!this.authService.isAuthenticated()) {
      return;
    }

    console.log('Abriendo detalle', currencyCode);
    this.selectedCurrency = this.divisas.find((d) => d.code === currencyCode);
    this.selectedRate = this.tiposCambio.find((r) => r.code === currencyCode);
    this.showCurrencyDetail = true;

    document.body.style.overflow = 'hidden';

    this.tendenciaReal = null;
    this.volatilidadReal = null;
    this.historicoReal = [];
    this.indicadores = [];

    if (this.selectedRate) {
      const base = this.selectedRate.base;
      const destino = this.selectedRate.code;
      try {
        const historico = await this.obtenerHistorico(base, destino);
        this.historicoReal = historico;
        this.tendenciaReal = this.calcularTendencia(historico);
        this.volatilidadReal = this.calcularVolatilidad(historico);
        this.rsi = this.calcularRSI(historico);
        this.sma = this.calcularSMA(historico);

        // Estado para cada indicador
        this.indicadores = [
          {
            label: 'RSI',
            valor: this.rsi ?? 'N/A',
            estado:
              this.rsi !== null && this.rsi < 40
                ? 'ok'
                : this.rsi !== null && this.rsi > 60
                ? 'bad'
                : 'warn',
            descripcion: 'Índice de fuerza relativa',
          },
          {
            label: 'Tendencia (%)',
            valor:
              this.tendenciaReal !== null
                ? this.tendenciaReal.toFixed(2)
                : 'N/A',
            estado:
              this.tendenciaReal !== null && this.tendenciaReal > 0.5
                ? 'ok'
                : this.tendenciaReal !== null && this.tendenciaReal < -0.5
                ? 'bad'
                : 'warn',
            descripcion: 'Variación porcentual últimos 30 días',
          },
          {
            label: 'SMA',
            valor: this.sma ?? 'N/A',
            estado:
              this.selectedRate &&
              this.sma !== null &&
              this.selectedRate.rate > this.sma
                ? 'ok'
                : this.selectedRate &&
                  this.sma !== null &&
                  this.selectedRate.rate < this.sma
                ? 'bad'
                : 'warn',
            descripcion: 'Media móvil simple (7 días)',
          },
          {
            label: 'Volatilidad',
            valor:
              this.volatilidadReal !== null
                ? this.volatilidadReal.toFixed(4)
                : 'N/A',
            estado:
              this.volatilidadReal !== null && this.volatilidadReal > 0.05
                ? 'bad'
                : 'ok',
            descripcion: 'Desviación estándar últimos 30 días',
          },
        ];

        this.recomendacionReal = this.getInvestmentRecommendation(
          this.tendenciaReal,
          this.volatilidadReal,
          this.rsi,
          this.sma,
          this.selectedRate?.rate || 0
        );
      } catch (e) {
        this.tendenciaReal = null;
        this.volatilidadReal = null;
        this.recomendacionReal = null;
        this.indicadores = [];
      }
    }
  }

  closeCurrencyModal(): void {
    this.showCurrencyDetail = false;
    this.selectedCurrency = null;
    this.selectedRate = null;

    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  // NUEVO: Método para cerrar el modal al hacer clic en el fondo
  onModalBackground(event: MouseEvent) {
    // Solo cierra si el click es directamente en el fondo, no en el contenido
    if (event.target === event.currentTarget) {
      this.closeCurrencyModal();
    }
  }

  // NUEVO: Cerrar modal premium al hacer clic en el fondo
  onPremiumModalBackground(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closePremiumModal();
    }
  }

  // MÉTODOS PARA ANÁLISIS DE INVERSIÓN:
  getTrendDirection(): string {
    if (!this.selectedCurrency) return 'stable';
    const trend = this.getTendenciaReal(this.selectedCurrency.code);
    return trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable';
  }

  getTrendIcon(): string {
    const direction = this.getTrendDirection();
    return direction === 'up'
      ? 'trending_up'
      : direction === 'down'
      ? 'trending_down'
      : 'trending_flat';
  }

  getInverseRate(): number {
    return this.selectedRate ? 1 / this.selectedRate.rate : 1;
  }

  getInvestmentRecommendation(
    tendencia: number,
    volatilidad: number,
    rsi: number,
    sma: number,
    rate: number
  ) {
    // Log para depuración
    console.log(
      'RSI:',
      rsi,
      'Tendencia:',
      tendencia,
      'SMA:',
      sma,
      'Rate:',
      rate,
      'Volatilidad:',
      volatilidad
    );

    // Si la volatilidad es muy alta, mejor esperar
    if (volatilidad > 0.05) {
      return {
        accion: 'ESPERAR',
        color: '#fbc02d',
        mensaje: 'Alta volatilidad. Espera una mejor oportunidad.',
      };
    }

    let score = 0;

    // Señales de compra
    if (rsi < 40) score += 1; // RSI bajo
    if (tendencia > 0.5) score += 1; // Tendencia alcista clara
    if (rate > sma) score += 1; // Precio por encima de la media

    // Señales de venta
    if (rsi > 60) score -= 1; // RSI alto
    if (tendencia < -0.5) score -= 1; // Tendencia bajista clara
    if (rate < sma) score -= 1; // Precio por debajo de la media

    // Decisión basada en el score
    if (score >= 2) {
      return {
        accion: 'COMPRAR',
        color: '#43a047',
        mensaje:
          'Señales técnicas alineadas para compra: RSI bajo, tendencia alcista y precio por encima de la media.',
      };
    }
    if (score <= -2) {
      return {
        accion: 'VENDER',
        color: '#e53935',
        mensaje:
          'Señales técnicas alineadas para venta: RSI alto, tendencia bajista y precio por debajo de la media.',
      };
    }
    if (Math.abs(rate - sma) / sma < 0.01) {
      return {
        accion: 'MANTENER',
        color: '#1976d2',
        mensaje: 'El precio está cerca de la media. Mantén tu posición.',
      };
    }
    return {
      accion: 'ESPERAR',
      color: '#fbc02d',
      mensaje: 'No hay señales claras. Espera una mejor oportunidad.',
    };
  }

  getRecommendationIcon(accion: string | undefined): string {
    switch ((accion || '').toLowerCase()) {
      case 'comprar':
        return 'trending_up';
      case 'vender':
        return 'trending_down';
      case 'mantener':
        return 'trending_flat';
      case 'esperar':
        return 'hourglass_empty';
      default:
        return 'help_outline';
    }
  }

  getInvestmentReason(): string {
    const recommendation = this.recomendacionReal?.accion || 'MANTENER';
    const currency = this.selectedCurrency?.code || 'esta divisa';

    // ✅ USAR SEED FIJO BASADO EN DIVISA (no Math.random)
    const seed = currency.charCodeAt(0) + currency.charCodeAt(1);
    const reasonIndex = seed % 3; // 0, 1, o 2

    const reasons = {
      COMPRAR: [
        `${currency} muestra tendencia alcista y potencial de crecimiento`,
        `La volatilidad baja sugiere un momento estable para invertir en ${currency}`,
        `${currency} está infravalorado respecto a ${this.monedaBase.value}`,
      ],
      VENDER: [
        `${currency} presenta tendencia bajista y posible depreciación`,
        `Alta volatilidad indica riesgo en la posición de ${currency}`,
        `${currency} está sobrevalorado, momento oportuno para vender`,
      ],
      MANTENER: [
        `${currency} mantiene estabilidad, sin señales claras de cambio`,
        `Tendencia lateral sugiere esperar mejores oportunidades`,
        `Equilibrio en el mercado de ${currency} vs ${this.monedaBase.value}`,
      ],
    };

    const reasonList = reasons[recommendation as keyof typeof reasons];
    return reasonList[reasonIndex]; // ✅ SEED FIJO, no random
  }

  getConfidenceLevel(): number {
    // Usa tendencia y volatilidad reales si están disponibles
    const tendencia = this.tendenciaReal;
    const volatilidad = this.volatilidadReal;

    let confidence = 60; // Base

    if (tendencia !== null && tendencia !== undefined) {
      if (tendencia > 0.5) confidence += 20;
      if (tendencia < -0.5) confidence -= 10;
    }

    if (volatilidad !== null && volatilidad !== undefined) {
      if (volatilidad < 0.01) confidence += 15;
      if (volatilidad > 0.05) confidence -= 10;
    }

    return Math.min(Math.max(confidence, 30), 95);
  }

  addToFavorites(): void {
    const currency = this.selectedCurrency?.code;
    if (currency) {
      this.snackBar.open(`⭐ ${currency} añadido a favoritos`, 'Cerrar', {
        duration: 2000,
      });
    }
  }
  // AÑADIR después del método addToFavorites():
  goToRegister(): void {
    // Cerrar cualquier modal abierto
    this.closePremiumModal();
    this.closeCurrencyModal();

    // Navegar al registro
    this.router.navigate(['/register']).then(() => {
      console.log('🔄 Navegando al registro...');
    });

    this.snackBar.open('🔄 Redirigiendo al registro...', 'Cerrar', {
      duration: 2000,
      panelClass: ['info-snackbar'],
    });
  }

  // NUEVOS MÉTODOS PARA RESULTADO MEJORADO:
  getCurrencyFullName(code: string): string {
    const divisa = this.divisas.find((d) => d.code === code);
    return divisa ? divisa.name : code;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Hoy';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  getVolatilityLevel(rate: number): string {
    const volatility = Math.abs(rate - 1);
    if (volatility > 0.5) return 'Alta';
    if (volatility > 0.1) return 'Media';
    return 'Baja';
  }

  // ✅ HACER AUTHSERVICE ACCESIBLE EN EL TEMPLATE
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  async obtenerHistorico(
    monedaBase: string,
    monedaDestino: string
  ): Promise<number[]> {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const url = `https://api.frankfurter.app/${start
      .toISOString()
      .slice(0, 10)}..${end
      .toISOString()
      .slice(0, 10)}?from=${monedaBase}&to=${monedaDestino}`;
    const response = await fetch(url);
    const data = await response.json();

    // Extrae los valores de cierre diarios
    return Object.values(data.rates).map((r: any) => r[monedaDestino]);
  }

  calcularTendencia(rates: number[]): number {
    if (rates.length < 2) return 0;
    const first = rates[0];
    const last = rates[rates.length - 1];
    return ((last - first) / first) * 100;
  }

  calcularVolatilidad(rates: number[]): number {
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    return Math.sqrt(variance);
  }

  // Calcula RSI (ya lo tienes)
  calcularRSI(rates: number[], period: number = 14): number {
    if (rates.length < period + 1) return 50;
    let gains = 0,
      losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = rates[i] - rates[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round(100 - 100 / (1 + rs));
  }

  // Calcula SMA (media móvil simple)
  calcularSMA(rates: number[], period: number = 7): number {
    if (rates.length < period) return rates[rates.length - 1] || 0;
    const slice = rates.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return +(sum / period).toFixed(4);
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
            ? (this.tendenciaReal * 100).toFixed(2) + '%'
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

  /**
   * Maneja el acceso a detalles según autenticación
   */
  handleDetalles(currencyCode: string): void {
    if (this.authService.isAuthenticated()) {
      this.verDetalle(currencyCode);
    } else {
      // En lugar de redirigir, mostrar modal premium
      this.showPremiumModal = true;
      this.premiumCurrency = this.divisas.find((d) => d.code === currencyCode);

      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
    }
  }

  // NUEVO: Cerrar modal premium
  closePremiumModal(): void {
    this.showPremiumModal = false;
    this.premiumCurrency = null;

    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  // NUEVO: Ir a login desde modal premium
  goToLogin(): void {
    this.closePremiumModal();

    this.router.navigate(['/login']).then(() => {
      console.log('🔄 Navegando al login...');
    });

    this.snackBar.open('🔄 Redirigiendo al login...', 'Cerrar', {
      duration: 2000,
      panelClass: ['info-snackbar'],
    });
  }
}
