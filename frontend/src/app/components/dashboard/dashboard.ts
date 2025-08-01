import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class Dashboard {
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
    this.cargarTiposCambio();
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
}
