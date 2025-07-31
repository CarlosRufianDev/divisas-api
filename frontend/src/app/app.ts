import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MaterialModule } from './shared/material.module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MaterialModule, RouterModule], 
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'frontend';
}

