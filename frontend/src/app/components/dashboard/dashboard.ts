import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DivisasService } from '../../services/divisas.service';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  resultado: any = null;
  cargando = false;

  // Form Controls
  cantidad = new FormControl(100);
  monedaOrigen = new FormControl('USD');
  monedaDestino = new FormControl('EUR');

  // NUEVAS PROPIEDADES PARA LA TABLA
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
    { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
    { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭' },
    { code: 'CNY', name: 'Yuan Chino', flag: '🇨🇳' }
  ];

  constructor(private divisasService: DivisasService) {
    // Cargar tipos de cambio al inicializar
    this.cargarTiposCambio();
  }

  // NUEVOS MÉTODOS PARA LA TABLA
  cargarTiposCambio() {
    const base = this.monedaBase.value || 'USD';
    this.cargandoTabla = true;
    
    this.divisasService.obtenerTiposCambio(base).subscribe({
      next: (response) => {
        this.procesarTiposCambio(response);
        this.cargandoTabla = false;
      },
      error: (error) => {
        console.error('Error cargando tipos de cambio:', error);
        this.cargandoTabla = false;
      }
    });
  }

  procesarTiposCambio(response: any) {
    this.ultimaActualizacion = response.date || new Date().toLocaleDateString();
    this.tiposCambio = [];

    // Convertir rates object a array para la tabla
    Object.keys(response.rates).forEach(currency => {
      const divisa = this.divisas.find(d => d.code === currency);
      if (divisa) {
        this.tiposCambio.push({
          code: currency,
          name: divisa.name,
          flag: divisa.flag,
          rate: response.rates[currency],
          base: response.base
        });
      }
    });

    // Ordenar por código de divisa
    this.tiposCambio.sort((a, b) => a.code.localeCompare(b.code));
  }

  cambiarMonedaBase() {
    this.cargarTiposCambio();
  }

  // Método para convertir divisas dinámicamente
  convertirDivisas() {
    const cantidad = this.cantidad.value || 0;
    const origen = this.monedaOrigen.value || 'USD';
    const destino = this.monedaDestino.value || 'EUR';

    if (cantidad <= 0) {
      return;
    }

    this.cargando = true;
    this.divisasService.convertir(cantidad, origen, destino).subscribe({
      next: (response) => {
        this.resultado = response;
        this.cargando = false;
        console.log('Conversión exitosa:', response);
      },
      error: (error) => {
        console.error('Error en conversión:', error);
        this.cargando = false;
      }
    });
  }

  // Método para intercambiar divisas
  intercambiarDivisas() {
    const temp = this.monedaOrigen.value;
    this.monedaOrigen.setValue(this.monedaDestino.value);
    this.monedaDestino.setValue(temp);
    
    if (this.cantidad.value && this.cantidad.value > 0) {
      this.convertirDivisas();
    }
  }

  // Método anterior (mantenemos por compatibilidad)
  probarConversion() {
    this.convertirDivisas();
  }

  // Método para usar divisa de la tabla en el conversor
  usarEnConversor(codigoDivisa: string) {
    this.monedaDestino.setValue(codigoDivisa);
    
    // Si hay cantidad, hacer conversión automática
    if (this.cantidad.value && this.cantidad.value > 0) {
      this.convertirDivisas();
    }
  }
}
