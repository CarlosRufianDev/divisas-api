import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { MaterialModule } from './shared/material.module';

import { AuthService, User } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MaterialModule, RouterModule, CommonModule], 
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  title = 'DivisasPro';
  currentUser: User | null = null;
  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Suscribirse a cambios de usuario
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
        console.log('👤 Usuario actual:', user);
      }
    );
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  logout(): void {
    console.log('🚪 Cerrando sesión...');
    this.authService.logout();
  }

  // Método helper para templates
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}

