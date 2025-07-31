import { Component } from '@angular/core';
import { MaterialModule } from '../../shared/material.module'; // ← Agregar

@Component({
  selector: 'app-favoritos',
  imports: [MaterialModule], 
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.scss'
})
export class Favoritos {

}
