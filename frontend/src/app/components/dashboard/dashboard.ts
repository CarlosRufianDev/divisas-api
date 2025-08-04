import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ConversionRequest,
  ConversionResponse,
  DivisasService,
} from '../../services/divisas';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
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

  constructor(
    private divisasService: DivisasService,
    private snackBar: MatSnackBar // ✅ AÑADIR
  ) {
    // this.cargarTiposCambio();
  }

  ngOnInit() {
    this.cargarTiposCambio();
    this.cargarAnalytics();
  }

  // MÉTODO ACTUALIZADO PARA CARGAR TIPOS DE CAMBIO
  cargarTiposCambio(): void {
    const base = this.monedaBase.value || 'USD';
    this.cargandoTabla = true;

    // Usar método del servicio conectado a tu backend
    this.divisasService.getExchangeRates(base).subscribe({
      next: (response: any) => {
        console.log('✅ Datos del backend:', response);
        this.procesarTiposCambioBackend(response, base);
        this.cargandoTabla = false;
      },
      error: (error: any) => {
        console.error('❌ Error con backend, usando Frankfurter:', error);
        // Fallback a Frankfurter si falla el backend
        this.cargarTiposCambioFallback(base);
      },
    });
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

    // USAR INTERFAZ CORRECTA DE TU BACKEND
    const request: ConversionRequest = {
      from: origen, // ✅ Tu backend usa 'from'
      to: destino, // ✅ Tu backend usa 'to'
      amount: cantidad, // ✅ Tu backend usa 'amount'
    };

    // Intentar con tu backend Node.js primero
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
        console.error('❌ Error en tu backend, usando Frankfurter:', error);
        // Fallback a Frankfurter
        this.convertirConFrankfurter(cantidad, origen, destino);
      },
    });
  }

  // FALLBACK para conversión
  convertirConFrankfurter(
    cantidad: number,
    origen: string,
    destino: string
  ): void {
    this.divisasService
      .convertWithFrankfurter(origen, destino, cantidad)
      .subscribe({
        next: (response: any) => {
          console.log('✅ Conversión con Frankfurter:', response);
          this.resultado = {
            amount: cantidad,
            result: response.rates[destino],
            from: origen,
            to: destino,
            rate: response.rates[destino] / cantidad,
            date: response.date,
          };
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('❌ Error total en conversión:', error);
          this.cargando = false;
        },
      });
  }

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
  getRandomTrend(currencyCode: string): number {
    // Usar el código de moneda como seed para consistencia
    const seed = currencyCode.charCodeAt(0) + currencyCode.charCodeAt(1);
    return (seed % 3) - 1; // -1, 0, o 1
  }

  getRandomChangePercent(currencyCode: string): string {
    const trend = this.getRandomTrend(currencyCode);
    const seed = currencyCode.charCodeAt(0) + currencyCode.charCodeAt(2);
    const percent = ((seed % 500) / 100).toFixed(2); // 0.00 a 4.99

    if (trend === 0) return '0.00';
    return trend > 0 ? percent : `-${percent}`;
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
  verDetalle(currencyCode: string): void {
    this.selectedCurrency = this.divisas.find((d) => d.code === currencyCode);
    this.selectedRate = this.tiposCambio.find((r) => r.code === currencyCode);
    this.showCurrencyDetail = true;

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  }

  closeCurrencyModal(): void {
    this.showCurrencyDetail = false;
    this.selectedCurrency = null;
    this.selectedRate = null;

    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  // MÉTODOS PARA ANÁLISIS DE INVERSIÓN:
  getTrendDirection(): string {
    if (!this.selectedCurrency) return 'stable';
    const trend = this.getRandomTrend(this.selectedCurrency.code);
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

  getInvestmentRecommendation(): string {
    if (!this.selectedRate) return 'MANTENER';

    const trend = this.getTrendDirection();
    const volatility = this.getVolatilityLevel(this.selectedRate.rate);
    const rate = this.selectedRate.rate;

    // Lógica de recomendación
    if (trend === 'up' && rate < 1) return 'COMPRAR';
    if (trend === 'down' && rate > 1) return 'VENDER';
    if (trend === 'up' && volatility === 'Baja') return 'COMPRAR';
    if (trend === 'down' && volatility === 'Alta') return 'VENDER';

    return 'MANTENER';
  }

  getRecommendationIcon(): string {
    const recommendation = this.getInvestmentRecommendation();
    return recommendation === 'COMPRAR'
      ? 'trending_up'
      : recommendation === 'VENDER'
      ? 'trending_down'
      : 'remove';
  }

  getInvestmentReason(): string {
    const recommendation = this.getInvestmentRecommendation();
    const trend = this.getTrendDirection();
    const currency = this.selectedCurrency?.code || 'esta divisa';

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
    return reasonList[Math.floor(Math.random() * reasonList.length)];
  }

  getConfidenceLevel(): number {
    const trend = this.getTrendDirection();
    const volatility = this.getVolatilityLevel(this.selectedRate?.rate || 1);

    let confidence = 60; // Base

    if (trend !== 'stable') confidence += 20;
    if (volatility === 'Baja') confidence += 15;
    if (volatility === 'Alta') confidence -= 10;

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
}
