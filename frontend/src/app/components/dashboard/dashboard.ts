import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DivisasService } from '../../services/divisas.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  resultado: any = null;

  constructor(private divisasService: DivisasService) {}

  // Método para probar la conversión
  probarConversion() {
    this.divisasService.convertir(100, 'USD', 'EUR').subscribe({
      next: (response) => {
        this.resultado = response;
        console.log('Conversión exitosa:', response);
      },
      error: (error) => {
        console.error('Error en conversión:', error);
      }
    });
  }
}
