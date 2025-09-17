import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';
import { DivisasService } from '../../services/divisas';
import { CURRENCY_FLAGS } from '../../shared/currency-flags';
import { MaterialModule } from '../../shared/material.module';
import { AddCurrencyDialogComponent } from './add-currency-dialog.component';
import { AddFavoriteDialogComponent } from './add-favorite-dialog.component';
import { EditCurrencyDialogComponent } from './edit-currency-dialog.component';
import { EditPairDialogComponent } from './edit-pair-dialog.component';

interface RateData {
  currency: string;
  trend: number;
  currentRate: number;
  change: string;
  trendStatus: string;
  source?: string; // ✅ NUEVO: Indica si viene de 'frankfurter' o 'exchangerate-api'
}

interface FavoritePair {
  id: string;
  from: string;
  to: string;
  nickname: string;
  currentRate: number;
  pair: string;
  createdAt: string;
  updatedAt: string;
  change?: number;
  previousRate?: number;
  // ✅ NUEVOS CAMPOS PARA DATOS COMPLETOS DEL BCE
  trendStatus?: string; // 'up', 'down', 'stable'
  changeText?: string; // Texto formateado del backend (ej: "+1.23%")
}

interface UpdatePairRequest {
  nickname: string;
}

interface UpdatePairResponse {
  success: boolean;
  message: string;
  data: FavoritePair;
}

interface QuickConversion {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}

interface PerformanceItem {
  id: string;
  name: string; // pair for favorites, currency for individual currencies
  change: number;
  type: 'pair' | 'currency';
  nickname?: string;
}

interface FavoriteCurrency {
  id: string;
  currency: string;
  nickname: string;
  priority: number;
  isDefault: boolean;
  rates: Record<string, number | string>;
  createdAt: string;
  updatedAt: string;
  change?: number;
  previousRate?: number;
  currentRate?: number;
  // ✅ NUEVOS CAMPOS PARA DATOS COMPLETOS DEL BCE
  trendStatus?: string; // 'up', 'down', 'stable'
  changeText?: string; // Texto formateado del backend (ej: "+1.23%")
}

interface ConversionResponse {
  result: number;
  rate: number;
  from: string;
  to: string;
  amount: number;
}

interface BaseCurrency {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="favoritos-container">
      <!-- Header Principal -->
      <div class="favoritos-header">
        <h1>⭐ Tu Centro de Control de Divisas</h1>
        <p class="subtitle">Gestiona y monitorea tus pares favoritos</p>
      </div>

      <!-- SECCIÓN 1: FAVORITOS ACTIVOS -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>star</mat-icon>
            Pares Favoritos ({{ favoritePairs.length }})
          </mat-card-title>
          <button
            mat-raised-button
            color="primary"
            (click)="openAddFavoriteDialog()"
          >
            <mat-icon>add</mat-icon>
            Añadir Par
          </button>
        </mat-card-header>

        <mat-card-content>
          <!-- Loading -->
          <div
            *ngIf="loading && favoritePairs.length === 0"
            class="loading-container"
          >
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando favoritos...</p>
          </div>

          <!-- Sin favoritos -->
          <div
            *ngIf="!loading && favoritePairs.length === 0"
            class="empty-favorites"
          >
            <mat-icon class="empty-icon">star_border</mat-icon>
            <h3>No tienes pares favoritos</h3>
            <p>
              Añade tus pares de divisas favoritos para monitorearlos en tiempo
              real
            </p>
            <button
              mat-raised-button
              color="primary"
              (click)="openAddFavoriteDialog()"
            >
              <mat-icon>add</mat-icon>
              Añadir Primer Favorito
            </button>
          </div>

          <!-- Grid de favoritos -->
          <div *ngIf="favoritePairs.length > 0" class="favoritos-grid">
            <div
              *ngFor="let favorite of favoritePairs; trackBy: trackByFavorite"
              class="favorito-item"
              [class.trending-up]="(favorite.change || 0) > 0"
              [class.trending-down]="(favorite.change || 0) < 0"
              [class.trending-neutral]="(favorite.change || 0) === 0"
            >
              <div class="par-info">
                <div class="par-header">
                  <span class="par-name">{{ favorite.pair }}</span>
                  <span class="par-nickname" *ngIf="favorite.nickname">{{
                    favorite.nickname
                  }}</span>
                </div>
                <span class="par-rate">{{
                  favorite.currentRate | number : '1.4-4'
                }}</span>
              </div>

              <div
                class="par-change"
                [class.positive]="(favorite.change || 0) > 0"
                [class.negative]="(favorite.change || 0) < 0"
                [class.neutral]="(favorite.change || 0) === 0"
              >
                <mat-icon *ngIf="(favorite.change || 0) > 0"
                  >trending_up</mat-icon
                >
                <mat-icon *ngIf="(favorite.change || 0) < 0"
                  >trending_down</mat-icon
                >
                <mat-icon *ngIf="(favorite.change || 0) === 0"
                  >trending_flat</mat-icon
                >
                <span>{{
                  favorite.changeText ||
                    formatPercentageChange(favorite.change || 0)
                }}</span>
              </div>

              <div class="par-actions">
                <button
                  mat-icon-button
                  (click)="editFavorite(favorite)"
                  matTooltip="Editar nickname"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="deleteFavorite(favorite)"
                  matTooltip="Eliminar favorito"
                  color="warn"
                >
                  <mat-icon>delete</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="useInQuickConversion(favorite)"
                  matTooltip="Usar en conversión rápida"
                  color="primary"
                >
                  <mat-icon>swap_horiz</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- SECCIÓN 1.5: DIVISAS FAVORITAS INDIVIDUALES -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>monetization_on</mat-icon>
            Divisas Favoritas ({{ favoriteCurrencies.length }})
          </mat-card-title>
          <button
            mat-raised-button
            color="accent"
            (click)="openAddCurrencyDialog()"
          >
            <mat-icon>add</mat-icon>
            Añadir Divisa
          </button>
        </mat-card-header>

        <mat-card-content>
          <!-- Loading -->
          <div
            *ngIf="loading && favoriteCurrencies.length === 0"
            class="loading-container"
          >
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando divisas favoritas...</p>
          </div>

          <!-- Sin divisas favoritas -->
          <div
            *ngIf="!loading && favoriteCurrencies.length === 0"
            class="empty-favorites"
          >
            <mat-icon class="empty-icon">monetization_on</mat-icon>
            <h3>No tienes divisas favoritas</h3>
            <p>
              Añade divisas individuales para monitorear sus tipos de cambio
            </p>
            <button
              mat-raised-button
              color="accent"
              (click)="openAddCurrencyDialog()"
            >
              <mat-icon>add</mat-icon>
              Añadir Primera Divisa
            </button>
          </div>

          <!-- Grid de divisas favoritas -->
          <div *ngIf="favoriteCurrencies.length > 0" class="currencies-grid">
            <div
              *ngFor="
                let currency of favoriteCurrencies;
                trackBy: trackByFavoriteCurrency
              "
              class="currency-item"
              [class.trending-up]="(currency.change || 0) > 0"
              [class.trending-down]="(currency.change || 0) < 0"
              [class.trending-neutral]="(currency.change || 0) === 0"
            >
              <div class="currency-info">
                <div class="currency-header">
                  <span class="currency-code">{{ currency.currency }}</span>
                  <span class="currency-nickname" *ngIf="currency.nickname">{{
                    currency.nickname
                  }}</span>
                  <mat-chip
                    *ngIf="currency.isDefault"
                    class="default-chip"
                    color="primary"
                  >
                    Por defecto
                  </mat-chip>
                </div>
                <span class="currency-rate">
                  1 {{ baseCurrency }} =
                  {{ getCurrentRateForCurrency(currency) | number : '1.4-4' }}
                  {{ currency.currency }}
                </span>
              </div>

              <div
                class="currency-change"
                [class.positive]="(currency.change || 0) > 0"
                [class.negative]="(currency.change || 0) < 0"
                [class.neutral]="(currency.change || 0) === 0"
              >
                <mat-icon *ngIf="(currency.change || 0) > 0"
                  >trending_up</mat-icon
                >
                <mat-icon *ngIf="(currency.change || 0) < 0"
                  >trending_down</mat-icon
                >
                <mat-icon *ngIf="(currency.change || 0) === 0"
                  >trending_flat</mat-icon
                >
                <span>{{
                  currency.changeText ||
                    formatPercentageChange(currency.change || 0)
                }}</span>
              </div>

              <div class="currency-actions">
                <button
                  mat-icon-button
                  (click)="editFavoriteCurrency(currency)"
                  matTooltip="Editar nickname"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="toggleDefaultCurrency(currency)"
                  [matTooltip]="
                    currency.isDefault
                      ? 'Quitar como predeterminada'
                      : 'Marcar como predeterminada'
                  "
                  color="primary"
                >
                  <mat-icon>{{
                    currency.isDefault ? 'star' : 'star_border'
                  }}</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="deleteFavoriteCurrency(currency)"
                  matTooltip="Eliminar divisa favorita"
                  color="warn"
                >
                  <mat-icon>delete</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="useInQuickConversionCurrency(currency)"
                  matTooltip="Usar en conversión rápida"
                  color="primary"
                >
                  <mat-icon>swap_horiz</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- SECCIÓN 2: CONVERSIÓN RÁPIDA -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>swap_horiz</mat-icon>
            Conversión Rápida entre Favoritos
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="quickConversionForm" class="conversion-panel">
            <mat-form-field class="amount-field" appearance="outline">
              <mat-label>Cantidad</mat-label>
              <input
                matInput
                type="number"
                formControlName="amount"
                min="0"
                step="0.01"
              />
              <span matPrefix>💰 </span>
            </mat-form-field>

            <mat-form-field class="currency-field" appearance="outline">
              <mat-label>De</mat-label>
              <mat-select
                formControlName="from"
                (selectionChange)="onFromCurrencyChange()"
              >
                <mat-option
                  *ngFor="let currency of getFavoriteCurrencies()"
                  [value]="currency"
                >
                  {{ getCurrencyFlag(currency) }} {{ currency }}
                  {{ getCurrencyName(currency) }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-icon-button
              type="button"
              class="swap-btn"
              color="primary"
              (click)="swapCurrencies()"
              matTooltip="Intercambiar monedas"
            >
              <mat-icon>swap_horiz</mat-icon>
            </button>

            <mat-form-field class="currency-field" appearance="outline">
              <mat-label>A</mat-label>
              <mat-select
                formControlName="to"
                (selectionChange)="calculateQuickConversion()"
              >
                <mat-option
                  *ngFor="let currency of getFilteredToCurrencies()"
                  [value]="currency"
                >
                  {{ getCurrencyFlag(currency) }} {{ currency }}
                  {{ getCurrencyName(currency) }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <div class="result-panel">
              <div *ngIf="quickConversionLoading" class="result-loading">
                <mat-spinner diameter="20"></mat-spinner>
                <span>Calculando...</span>
              </div>
              <div
                *ngIf="!quickConversionLoading && quickConversionResult"
                class="result-success"
              >
                <span class="result-label">Resultado:</span>
                <span class="result-value">
                  {{ quickConversionResult.result | number : '1.2-2' }}
                  {{ quickConversionResult.to }}
                </span>
                <span class="result-rate">
                  1 {{ quickConversionResult.from }} =
                  {{ quickConversionResult.rate | number : '1.4-4' }}
                  {{ quickConversionResult.to }}
                </span>
              </div>
              <div
                *ngIf="!quickConversionLoading && !quickConversionResult"
                class="result-empty"
              >
                <span>Selecciona monedas para ver el resultado</span>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- SECCIÓN 3: RESUMEN DEL DÍA -->
      <div
        class="summary-row"
        *ngIf="favoritePairs.length > 0 || favoriteCurrencies.length > 0"
      >
        <!-- Mejor Performer -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title class="trending-up-icon">
              <mat-icon>trending_up</mat-icon>
              Mejor Performer
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div
              class="performer-info"
              *ngIf="getBestPerformer(); else noPerformer"
            >
              <span class="performer-pair">
                {{ getBestPerformer()?.name }}
                <span
                  class="performer-type"
                  *ngIf="getBestPerformer()?.type === 'currency'"
                >
                  (Divisa)</span
                >
              </span>
              <span class="performer-change positive">{{
                formatPercentageChange(getBestPerformer()?.change || 0)
              }}</span>
            </div>
            <p class="performer-description">
              Tu favorito con mejor rendimiento hoy
            </p>
          </mat-card-content>
        </mat-card>

        <!-- Peor Performer -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title class="trending-down-icon">
              <mat-icon>trending_down</mat-icon>
              Necesita Atención
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div
              class="performer-info"
              *ngIf="getWorstPerformer(); else noPerformer"
            >
              <span class="performer-pair">
                {{ getWorstPerformer()?.name }}
                <span
                  class="performer-type"
                  *ngIf="getWorstPerformer()?.type === 'currency'"
                >
                  (Divisa)</span
                >
              </span>
              <span class="performer-change negative">{{
                formatPercentageChange(getWorstPerformer()?.change || 0)
              }}</span>
            </div>
            <p class="performer-description">
              Revisa las tendencias de este par
            </p>
          </mat-card-content>
        </mat-card>

        <!-- Total Favoritos -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title class="star-icon">
              <mat-icon>star</mat-icon>
              Total Favoritos
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="total-info">
              <span class="total-count">{{ getTotalFavorites() }}</span>
              <span class="total-label">favoritos activos</span>
            </div>
            <div class="breakdown-info">
              <small
                >{{ favoritePairs.length }} pares •
                {{ favoriteCurrencies.length }} divisas</small
              >
            </div>
            <p class="total-description">
              Gestiona todos tus favoritos desde aquí
            </p>
          </mat-card-content>
        </mat-card>

        <!-- Promedio de Cambios -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title class="analytics-icon">
              <mat-icon>analytics</mat-icon>
              Rendimiento Promedio
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="metric-info">
              <span
                class="metric-value"
                [class.positive]="getAverageChange() > 0"
                [class.negative]="getAverageChange() < 0"
              >
                {{ formatPercentageChange(getAverageChange()) }}
              </span>
              <span class="metric-label">cambio promedio</span>
            </div>
            <div class="metric-details">
              <small
                >{{ getPositiveChangesCount() }} de {{ getTotalFavorites() }} en
                positivo</small
              >
            </div>
            <p class="metric-description">Rendimiento general de tu cartera</p>
          </mat-card-content>
        </mat-card>

        <!-- Estado del Mercado -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title class="market-icon">
              <mat-icon [style.color]="getMarketStatus().color">{{
                getMarketStatus().icon
              }}</mat-icon>
              Estado del Mercado
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="market-info">
              <span
                class="market-status"
                [style.color]="getMarketStatus().color"
              >
                {{ getMarketStatus().status }}
              </span>
              <span class="market-time">{{ getMostActiveTime() }}</span>
            </div>
            <div class="volatility-info">
              <small>Volatilidad: {{ getVolatilityLevel() }}</small>
            </div>
            <p class="market-description">Horario y actividad actual</p>
          </mat-card-content>
        </mat-card>

        <!-- Selector de Divisa Base -->
        <mat-card class="summary-card base-currency-card">
          <mat-card-header>
            <mat-card-title class="base-currency-icon">
              <mat-icon>language</mat-icon>
              Divisa Base
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="base-currency-selector">
              <mat-form-field appearance="outline" class="base-currency-field">
                <mat-label>Cambiar divisa base</mat-label>
                <mat-select [formControl]="baseCurrencyControl">
                  <mat-option
                    *ngFor="let currency of availableBaseCurrencies"
                    [value]="currency.code"
                  >
                    <div class="currency-option">
                      <span class="currency-flag">{{ currency.flag }}</span>
                      <span class="currency-code">{{ currency.code }}</span>
                      <span class="currency-name">{{ currency.name }}</span>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <div class="base-currency-info">
                <small
                  >Los tipos de cambio se mostrarán desde
                  {{ baseCurrency }}</small
                >
              </div>
            </div>
            <p class="base-currency-description">
              Personaliza tu divisa de referencia
            </p>
          </mat-card-content>
        </mat-card>

        <ng-template #noPerformer>
          <div class="no-performer">
            <span>Sin datos suficientes</span>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styleUrl: './favoritos.scss', // ✅ USAR ARCHIVO SCSS EXTERNO
})
export class Favoritos implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl;
  private destroy$ = new Subject<void>();

  // Angular 20: Usar inject() function en lugar de constructor injection
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private divisasService = inject(DivisasService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = false;
  favoritePairs: FavoritePair[] = [];
  favoriteCurrencies: FavoriteCurrency[] = [];
  dropdownCurrencies: string[] = []; // Optimized list from backend
  allAvailableCurrencies: string[] = []; // Lista completa de las 40 monedas
  baseCurrency = 'EUR'; // Base currency for individual favorites
  baseCurrencyControl = new FormControl('EUR'); // Control para cambiar divisa base
  availableBaseCurrencies: BaseCurrency[] = [
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'USD', name: 'Dólar Estadounidense', flag: '🇺🇸' },
    { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
    { code: 'JPY', name: 'Yen Japonés', flag: '🇯🇵' },
    { code: 'CHF', name: 'Franco Suizo', flag: '🇨🇭' },
    { code: 'CAD', name: 'Dólar Canadiense', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
  ];
  quickConversionForm: FormGroup;
  quickConversionLoading = false;
  quickConversionResult: QuickConversion | null = null;

  constructor() {
    this.quickConversionForm = this.fb.group({
      amount: [1000, [Validators.required, Validators.min(0.01)]],
      from: ['', Validators.required],
      to: ['', Validators.required],
    });

    // Listener para cambios en la divisa base
    this.baseCurrencyControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((newBaseCurrency) => {
        if (newBaseCurrency && newBaseCurrency !== this.baseCurrency) {
          this.baseCurrency = newBaseCurrency;
          console.log(`💱 Cambiando divisa base a: ${newBaseCurrency}`);
          this.reloadWithNewBaseCurrency();
        }
      });
  }

  /**
   * Recargar datos con nueva divisa base
   */
  private async reloadWithNewBaseCurrency(): Promise<void> {
    console.log(
      `🔄 Recargando favoritos con divisa base: ${this.baseCurrency}`
    );

    // Recargar divisas favoritas individuales con nueva base
    await this.loadFavoriteCurrencies(true); // Silent reload

    // Mostrar notificación
    this.snackBar.open(
      `💱 Divisa base cambiada a ${this.baseCurrency}`,
      'Cerrar',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
  }

  async ngOnInit(): Promise<void> {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.snackBar
        .open('🔐 Inicia sesión para ver tus favoritos', 'Login', {
          duration: 5000,
          panelClass: ['warning-snackbar'],
        })
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/login']);
        });
      return;
    }

    console.log('⭐ Iniciando componente Favoritos');

    // ✅ MOSTRAR RESUMEN DE MEJORAS BCE
    console.log(
      '🚀 FAVORITOS CON DATOS 100% REALES - MISMO PATRÓN QUE DASHBOARD:'
    );
    console.log(
      '   📈 getTrendingRates(base, undefined, 7) - UNA LLAMADA para todas las monedas'
    );
    console.log(
      '   🌍 ~30 monedas desde Frankfurter + 9 adicionales desde exchangerate-api'
    );
    console.log('   💹 Rates actuales directos del BCE/Frankfurter');
    console.log(
      '   📊 Estados de tendencia (up/down/stable) calculados por el backend'
    );
    console.log('   🎯 Cambios porcentuales reales de los últimos 7 días');
    console.log('   � ZERO múltiples llamadas - eficiencia máxima');
    console.log('   ⚡ Performance optimizada igual que Dashboard');

    await this.loadAllCurrencies(); // Cargar las 40 monedas completas (ahora async)
    this.loadFavorites();
    this.loadFavoriteCurrencies();
    this.loadDropdownCurrencies(); // Nueva función optimizada
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFormSubscriptions(): void {
    // Auto-calculate cuando cambian los valores
    this.quickConversionForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateQuickConversion();
      });
  }

  /**
   * Cargar todas las monedas disponibles
   * FUENTE: Frankfurter API (~30 monedas) + ADDITIONAL_CURRENCIES (9 monedas)
   * FALLBACK: CURRENCY_FLAGS (lista estática en caso de error)
   *
   * ✅ MISMA LÓGICA QUE DASHBOARD para consistencia total
   */
  async loadAllCurrencies(): Promise<void> {
    try {
      console.log(
        '🌍 Cargando divisas dinámicamente desde Frankfurter (patrón Dashboard)...'
      );

      // ✅ USAR MISMO MÉTODO QUE DASHBOARD
      const currenciesData = await this.divisasService
        .loadCurrenciesFromFrankfurter()
        .toPromise();

      if (currenciesData) {
        // Transformar respuesta de Frankfurter + divisas adicionales
        const frankfurterCurrencies = Object.keys(currenciesData);
        const additionalCurrencies = [
          'ARS',
          'COP',
          'CLP',
          'PEN',
          'UYU',
          'RUB',
          'EGP',
          'VND',
          'KWD',
        ];

        // Combinar ambas listas y eliminar duplicados
        this.allAvailableCurrencies = [
          ...new Set([...frankfurterCurrencies, ...additionalCurrencies]),
        ].sort();

        console.log(
          `✅ Cargadas dinámicamente ${this.allAvailableCurrencies.length} monedas (${frankfurterCurrencies.length} desde Frankfurter + ${additionalCurrencies.length} adicionales)`
        );
      } else {
        throw new Error('No se recibieron datos de Frankfurter');
      }
    } catch (error) {
      console.error(
        '❌ Error cargando divisas dinámicamente, usando fallback:',
        error
      );
      // Fallback a las monedas desde CURRENCY_FLAGS
      this.allAvailableCurrencies = Object.keys(CURRENCY_FLAGS).sort();
    }

    // Actualizar también las monedas base disponibles
    this.updateAvailableBaseCurrencies();
  }

  /**
   * Actualizar la lista de monedas base disponibles basado en todas las monedas
   */
  private updateAvailableBaseCurrencies(): void {
    this.availableBaseCurrencies = this.allAvailableCurrencies.map((code) => ({
      code,
      name: this.getCurrencyName(code),
      flag: CURRENCY_FLAGS[code] || '🏳️',
    }));
  }

  /**
   * Obtener el nombre de una moneda (completo para todas las monedas de Frankfurter + Exchange)
   * Compatible con ambas fuentes: /api/exchange/currencies (Frankfurter ~40) y /api/convert/currencies (Lista hardcodeada 20)
   */
  getCurrencyName(code: string): string {
    const names: Record<string, string> = {
      // Principales (Exchange + Frankfurter)
      ARS: 'Peso Argentino',
      AUD: 'Dólar Australiano',
      BGN: 'Lev Búlgaro',
      BRL: 'Real Brasileño',
      CAD: 'Dólar Canadiense',
      CHF: 'Franco Suizo',
      CLP: 'Peso Chileno',
      CNY: 'Yuan Chino',
      COP: 'Peso Colombiano',
      CZK: 'Corona Checa',
      DKK: 'Corona Danesa',
      EGP: 'Libra Egipcia',
      EUR: 'Euro',
      GBP: 'Libra Esterlina',
      HKD: 'Dólar de Hong Kong',
      HRK: 'Kuna Croata', // Frankfurter adicional
      HUF: 'Forint Húngaro',
      IDR: 'Rupia Indonesia',
      ILS: 'Nuevo Shékel Israelí',
      INR: 'Rupia India',
      ISK: 'Corona Islandesa',
      JPY: 'Yen Japonés',
      KRW: 'Won Surcoreano',
      KWD: 'Dinar Kuwaití', // Frankfurter adicional
      MXN: 'Peso Mexicano',
      MYR: 'Ringgit Malayo',
      NOK: 'Corona Noruega',
      NZD: 'Dólar Neozelandés',
      PEN: 'Sol Peruano', // Frankfurter adicional
      PHP: 'Peso Filipino',
      PLN: 'Zloty Polaco',
      RON: 'Leu Rumano',
      RUB: 'Rublo Ruso',
      SEK: 'Corona Sueca',
      SGD: 'Dólar de Singapur',
      THB: 'Baht Tailandés',
      TRY: 'Lira Turca',
      USD: 'Dólar Estadounidense',
      UYU: 'Peso Uruguayo', // Frankfurter adicional
      VND: 'Dong Vietnamita', // Frankfurter adicional
      ZAR: 'Rand Sudafricano',

      // Adicionales que puede devolver Frankfurter
      CAR: 'Franco CFA Central',
      XOF: 'Franco CFA Occidental',
      XAF: 'Franco CFA Central Africano',
      MAD: 'Dirham Marroquí',
      TND: 'Dinar Tunecino',
      TWD: 'Dólar Taiwanés',
      LKR: 'Rupia de Sri Lanka',
      BDT: 'Taka de Bangladesh',
      PKR: 'Rupia Pakistaní',
      SAR: 'Riyal Saudí',
      AED: 'Dirham de EAU',
      QAR: 'Riyal Catarí',
      BHD: 'Dinar de Baréin',
      OMR: 'Rial Omaní',
      JOD: 'Dinar Jordano',
      LBP: 'Libra Libanesa',
      KES: 'Chelín Keniano',
      UGX: 'Chelín Ugandés',
      TZS: 'Chelín Tanzano',
      ETB: 'Birr Etíope',
      GHS: 'Cedi Ghanés',
      NGN: 'Naira Nigeriana',
      ZMW: 'Kwacha Zambiano',
      BWP: 'Pula de Botsuana',
      MUR: 'Rupia Mauriciana',
      SCR: 'Rupia de Seychelles',
      MVR: 'Rufiyaa de Maldivas',
      AFN: 'Afgani Afgano',
      IRR: 'Rial Iraní',
      IQD: 'Dinar Iraquí',
      SYP: 'Libra Siria',
      YER: 'Rial Yemení',

      // Fallbacks genéricos para códigos desconocidos
      XXX: 'Moneda Desconocida',
      XTS: 'Código de Prueba',
    };

    // ✅ Fallback inteligente: si no conocemos el nombre, devolver el código formateado
    return names[code] || `${code} (Divisa)`;
  }

  async loadFavorites(silent = false): Promise<void> {
    if (!silent) this.loading = true;

    this.http
      .get<{ count: number; favorites: FavoritePair[] }>(
        `${this.apiUrl}/favorites`
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          // Calcular cambios comparando con datos anteriores
          const newFavorites = response.favorites.map((newFav) => {
            const oldFav = this.favoritePairs.find(
              (old) => old.id === newFav.id
            );

            let change = 0;
            if (oldFav) {
              // Usar cambio real si hay datos históricos
              change = this.calculateChange(
                oldFav.currentRate,
                newFav.currentRate
              );
            }
            // Para nuevos elementos, change se queda en 0 y se actualizará después

            return {
              ...newFav,
              change,
              previousRate: oldFav?.currentRate,
            };
          });

          this.favoritePairs = newFavorites;

          // Cargar datos reales para todos los pares (en lote)
          await this.loadRealDataForPairs();
          this.loading = false;

          if (!silent) {
            console.log('✅ Favoritos cargados:', response);
          }
        },
        error: (error) => {
          console.error('❌ Error cargando favoritos:', error);
          this.loading = false;

          if (!silent) {
            this.snackBar.open('❌ Error al cargar los favoritos', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          }
        },
      });
  }

  async loadFavoriteCurrencies(silent = false): Promise<void> {
    if (!silent) this.loading = true;

    this.http
      .get<{
        count: number;
        favoriteCurrencies: FavoriteCurrency[];
        baseCurrency: string;
      }>(`${this.apiUrl}/favorite-currencies?base=${this.baseCurrency}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          // Calcular cambios comparando con datos anteriores
          const newFavoriteCurrencies = response.favoriteCurrencies.map(
            (newFav) => {
              const oldFav = this.favoriteCurrencies.find(
                (old) => old.id === newFav.id
              );

              // Obtener la tasa actual (EUR_to_Currency)
              const currentRateKey = `${response.baseCurrency}_to_${newFav.currency}`;
              const currentRate =
                typeof newFav.rates[currentRateKey] === 'number'
                  ? (newFav.rates[currentRateKey] as number)
                  : 0;

              const oldRate = oldFav?.previousRate || 0;

              let change = 0;
              if (oldFav && oldRate > 0) {
                // Usar cambio real si hay datos históricos
                change = this.calculateChange(oldRate, currentRate);
              }
              // Para nuevos elementos, change se queda en 0 y se actualizará después

              return {
                ...newFav,
                change,
                previousRate: currentRate,
                currentRate: currentRate, // Agregar currentRate para la interfaz
              };
            }
          );

          this.favoriteCurrencies = newFavoriteCurrencies;

          // Cargar datos reales para todas las divisas (en lote)
          await this.loadRealDataForCurrencies();

          if (!silent) this.loading = false;

          if (!silent) {
            console.log('✅ Divisas favoritas cargadas:', response);
          }
        },
        error: (error) => {
          console.error('❌ Error cargando divisas favoritas:', error);
          if (!silent) this.loading = false;

          if (!silent) {
            this.snackBar.open(
              '❌ Error al cargar las divisas favoritas',
              'Cerrar',
              {
                duration: 3000,
                panelClass: ['error-snackbar'],
              }
            );
          }
        },
      });
  }

  /**
   * Cargar monedas optimizadas para dropdowns (solo favoritos del usuario)
   * FUENTE: /api/favorite-currencies/dropdown (monedas favoritas del usuario)
   * FALLBACK: getUniqueCurrencies() (extrae de favoritos locales)
   *
   * OPTIMIZACIÓN: Reduce la lista a solo las monedas que el usuario usa
   */
  loadDropdownCurrencies(): void {
    this.http
      .get<{ code: string; name: string; isDefault: boolean }[]>(
        `${this.apiUrl}/favorite-currencies/dropdown`
      )
      .subscribe({
        next: (currencies) => {
          // Extraer solo los códigos de moneda y añadir EUR como base
          this.dropdownCurrencies = [
            'EUR',
            ...currencies.map((curr) => curr.code),
          ];
          // Remover duplicados y ordenar
          this.dropdownCurrencies = [
            ...new Set(this.dropdownCurrencies),
          ].sort();
          console.log(
            '💱 Dropdown currencies loaded:',
            this.dropdownCurrencies
          );
        },
        error: (error) => {
          console.error('Error loading dropdown currencies:', error);
          // Fallback al método tradicional
          this.dropdownCurrencies = this.getUniqueCurrencies();
        },
      });
  }

  calculateChange(oldRate: number, newRate: number): number {
    if (!oldRate || !newRate) return 0;
    return ((newRate - oldRate) / oldRate) * 100;
  }

  // ===== MÉTODOS PARA DATOS REALES (Frankfurter API vía Backend) =====

  /**
   * Obtener datos completos y reales para un par de divisas
   * FUENTE: Frankfurter API vía /api/calculator/trending-rates (mismo patrón que Dashboard)
   * RETORNA: Objeto completo con rate, change, trendStatus del BCE
   */
  private async getRealDataForPair(pair: string): Promise<{
    currentRate: number;
    change: number;
    trendStatus: string;
    changeText: string;
  }> {
    try {
      const [from, to] = pair.split('/');
      if (!from || !to) {
        return {
          currentRate: 0,
          change: 0,
          trendStatus: 'stable',
          changeText: '0.00%',
        };
      }

      console.log(`🌍 Obteniendo datos REALES del BCE para par: ${pair}`);

      // 🚀 USAR EL MISMO MÉTODO QUE EL DASHBOARD (datos 100% reales)
      const trendingResponse = await this.divisasService
        .getTrendingRates(from, [to], 7)
        .toPromise();

      if (trendingResponse?.success && trendingResponse.rates?.length > 0) {
        const rateData = trendingResponse.rates.find(
          (r: RateData) => r.currency === to
        );

        if (rateData) {
          console.log(`✅ Datos reales del BCE para ${pair}:`, {
            currentRate: rateData.currentRate,
            trend: rateData.trend,
            trendStatus: rateData.trendStatus,
            change: rateData.change,
          });

          return {
            currentRate: rateData.currentRate || 0,
            change: rateData.trend || 0, // Usar trend como percentage change
            trendStatus: rateData.trendStatus || 'stable',
            changeText: rateData.change || '0.00%', // Texto formateado del backend
          };
        }
      }

      console.warn(`⚠️ No se recibieron datos del BCE para ${pair}`);
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    } catch (error) {
      console.warn(`❌ Error obteniendo datos reales para ${pair}:`, error);
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    }
  }

  /**
   * Obtener datos completos y reales para una divisa individual
   * FUENTE: Frankfurter API vía /api/calculator/trending-rates (mismo patrón que Dashboard)
   * SOPORTE: Base dinámica (this.baseCurrency) vs cualquier moneda objetivo
   */
  private async getRealDataForCurrency(
    currency: string,
    baseCurrency?: string
  ): Promise<{
    currentRate: number;
    change: number;
    trendStatus: string;
    changeText: string;
  }> {
    try {
      const base = baseCurrency || this.baseCurrency;
      console.log(`🌍 Obteniendo datos REALES del BCE: ${base} → ${currency}`);

      // 🚀 USAR EL MISMO MÉTODO QUE EL DASHBOARD (datos 100% reales)
      const trendingResponse = await this.divisasService
        .getTrendingRates(base, [currency], 7)
        .toPromise();

      if (trendingResponse?.success && trendingResponse.rates?.length > 0) {
        const rateData = trendingResponse.rates.find(
          (r: RateData) => r.currency === currency
        );

        if (rateData) {
          console.log(`✅ Datos reales del BCE para ${base}/${currency}:`, {
            currentRate: rateData.currentRate,
            trend: rateData.trend,
            trendStatus: rateData.trendStatus,
            change: rateData.change,
          });

          return {
            currentRate: rateData.currentRate || 0,
            change: rateData.trend || 0, // Usar trend como percentage change
            trendStatus: rateData.trendStatus || 'stable',
            changeText: rateData.change || '0.00%', // Texto formateado del backend
          };
        }
      }

      console.warn(
        `⚠️ No se recibieron datos del BCE para ${base}/${currency}`
      );
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    } catch (error) {
      console.warn(
        `❌ Error obteniendo datos reales para ${
          baseCurrency || this.baseCurrency
        }/${currency}:`,
        error
      );
      return {
        currentRate: 0,
        change: 0,
        trendStatus: 'stable',
        changeText: '0.00%',
      };
    }
  }

  /**
   * Cargar datos reales para todos los pares favoritos
   * ACTUALIZADO: Usar MISMO PATRÓN que Dashboard (una sola llamada para todas las monedas)
   */
  private async loadRealDataForPairs(): Promise<void> {
    if (this.favoritePairs.length === 0) return;

    console.log(
      '🌍 Cargando datos COMPLETOS del BCE para pares favoritos (patrón Dashboard)...'
    );

    try {
      // 🚀 OBTENER TODAS LAS MONEDAS DE UNA VEZ (mismo patrón que Dashboard)
      const uniqueBases = [...new Set(this.favoritePairs.map((p) => p.from))];

      // Procesar cada base por separado para mayor precisión
      for (const base of uniqueBases) {
        console.log(`📊 Obteniendo datos del BCE con base ${base}...`);

        // ✅ MISMO MÉTODO QUE DASHBOARD: getTrendingRates(base, undefined, 7)
        const trendingResponse = await this.divisasService
          .getTrendingRates(base, undefined, 7) // ✅ undefined = TODAS las monedas (~40)
          .toPromise();

        if (trendingResponse?.success && trendingResponse.rates) {
          console.log(
            `✅ Recibidos datos para ${trendingResponse.rates.length} monedas desde base ${base}`
          );
          console.log(
            `🔍 Incluye ARS: ${
              trendingResponse.rates.find((r) => r.currency === 'ARS')
                ? 'SÍ'
                : 'NO'
            }`
          );
          console.log(
            `🔍 Incluye EUR: ${
              trendingResponse.rates.find((r) => r.currency === 'EUR')
                ? 'SÍ'
                : 'NO'
            }`
          );

          // Actualizar todos los pares que usan esta base
          this.favoritePairs = this.favoritePairs.map((favorite) => {
            if (favorite.from === base) {
              // Buscar los datos para la moneda destino
              const rateData = trendingResponse.rates.find(
                (r: RateData) => r.currency === favorite.to
              );

              if (rateData) {
                console.log(
                  `🔍 ${favorite.pair}: rate=${rateData.currentRate}, change=${rateData.change}, trend=${rateData.trendStatus}`
                );

                return {
                  ...favorite,
                  currentRate: rateData.currentRate || favorite.currentRate, // ✅ Rate del BCE
                  change: rateData.trend || 0, // ✅ Cambio porcentual del BCE
                  trendStatus: rateData.trendStatus || 'stable', // ✅ Estado de tendencia del BCE
                  changeText: rateData.change || '0.00%', // ✅ Texto formateado del BCE
                  previousRate: favorite.previousRate || rateData.currentRate,
                };
              }
            }
            return favorite;
          });
        }
      }

      console.log(
        '✅ Datos COMPLETOS del BCE cargados para pares favoritos (patrón Dashboard)'
      );
    } catch (error) {
      console.error('❌ Error cargando datos reales para pares:', error);
    }
  }

  /**
   * Cargar datos reales para todas las divisas favoritas individuales
   * ACTUALIZADO: Usar MISMO PATRÓN que Dashboard + manejo de monedas base no soportadas
   */
  private async loadRealDataForCurrencies(): Promise<void> {
    if (this.favoriteCurrencies.length === 0) return;

    console.log(
      '🌍 Cargando datos COMPLETOS del BCE para divisas favoritas (patrón Dashboard)...'
    );

    try {
      // 🔍 VERIFICAR SI LA MONEDA BASE ESTÁ SOPORTADA EN FRANKFURTER
      const unsupportedBases = [
        'ARS',
        'COP',
        'CLP',
        'PEN',
        'UYU',
        'RUB',
        'EGP',
        'VND',
        'KWD',
      ];
      const needsConversion = unsupportedBases.includes(this.baseCurrency);

      if (needsConversion) {
        console.log(
          `⚠️ ${this.baseCurrency} no está soportado como base en Frankfurter, usando conversión via USD...`
        );
        await this.loadRealDataWithUSDConversion();
        return;
      }

      // 🚀 USAR UNA SOLA LLAMADA PARA TODAS LAS MONEDAS (mismo patrón que Dashboard)
      console.log(
        `📊 Obteniendo datos del BCE con base ${this.baseCurrency}...`
      );

      // ✅ MISMO MÉTODO QUE DASHBOARD: getTrendingRates(base, undefined, 7)
      const trendingResponse = await this.divisasService
        .getTrendingRates(this.baseCurrency, undefined, 7) // ✅ undefined = TODAS las monedas (~40)
        .toPromise();

      if (trendingResponse?.success && trendingResponse.rates) {
        console.log(
          `✅ Recibidos datos para ${trendingResponse.rates.length} monedas desde base ${this.baseCurrency}`
        );
        console.log(
          `🔍 Incluye ARS: ${
            trendingResponse.rates.find((r) => r.currency === 'ARS')
              ? 'SÍ'
              : 'NO'
          }`
        );
        console.log(
          `🔍 Incluye USD: ${
            trendingResponse.rates.find((r) => r.currency === 'USD')
              ? 'SÍ'
              : 'NO'
          }`
        );

        // Actualizar todas las divisas favoritas de una vez
        this.favoriteCurrencies = this.favoriteCurrencies.map((favorite) => {
          // Buscar los datos para esta divisa
          const rateData = trendingResponse.rates.find(
            (r: RateData) => r.currency === favorite.currency
          );

          if (rateData) {
            console.log(
              `🔍 ${this.baseCurrency}/${favorite.currency}: rate=${rateData.currentRate}, change=${rateData.change}, trend=${rateData.trendStatus}`
            );

            return {
              ...favorite,
              currentRate: rateData.currentRate || favorite.currentRate, // ✅ Rate del BCE
              change: rateData.trend || 0, // ✅ Cambio porcentual del BCE
              trendStatus: rateData.trendStatus || 'stable', // ✅ Estado de tendencia del BCE
              changeText: rateData.change || '0.00%', // ✅ Texto formateado del BCE
              previousRate: favorite.previousRate || rateData.currentRate,
            };
          }

          return favorite; // Mantener sin cambios si no hay datos del BCE
        });
      }

      console.log(
        '✅ Datos COMPLETOS del BCE cargados para divisas favoritas (patrón Dashboard)'
      );
    } catch (error) {
      console.error('❌ Error cargando datos reales para divisas:', error);
    }
  }

  /**
   * Cargar datos con conversión USD para monedas base no soportadas (ARS, COP, etc.)
   */
  private async loadRealDataWithUSDConversion(): Promise<void> {
    try {
      console.log(
        `🔄 Cargando datos via USD para base ${this.baseCurrency}...`
      );

      // 1. Obtener datos con USD como base
      const usdTrendingResponse = await this.divisasService
        .getTrendingRates('USD', undefined, 7)
        .toPromise();

      // 2. Obtener rate actual de USD a la moneda base (ej: USD/ARS)
      const baseRateResponse = await this.divisasService
        .getTrendingRates('USD', [this.baseCurrency], 7)
        .toPromise();

      if (usdTrendingResponse?.success && baseRateResponse?.success) {
        const usdRates = usdTrendingResponse.rates;
        const baseRateData = baseRateResponse.rates.find(
          (r) => r.currency === this.baseCurrency
        );

        if (!baseRateData || !baseRateData.currentRate) {
          console.error(`❌ No se pudo obtener rate USD/${this.baseCurrency}`);
          return;
        }

        const usdToBaseRate = baseRateData.currentRate;
        console.log(`📊 Rate USD/${this.baseCurrency}: ${usdToBaseRate}`);

        // 3. Convertir todas las divisas favoritas
        this.favoriteCurrencies = this.favoriteCurrencies.map((favorite) => {
          const usdRateData = usdRates.find(
            (r: RateData) => r.currency === favorite.currency
          );

          if (usdRateData) {
            // Convertir de USD/Currency a BaseCurrency/Currency
            const convertedRate = usdRateData.currentRate / usdToBaseRate;

            console.log(
              `🔄 ${this.baseCurrency}/${
                favorite.currency
              }: ${convertedRate.toFixed(4)} (via USD conversion)`
            );

            return {
              ...favorite,
              currentRate: convertedRate,
              change: usdRateData.trend || 0, // Usar trend de USD (aproximación)
              trendStatus: usdRateData.trendStatus || 'stable',
              changeText: usdRateData.change || '0.00%',
              previousRate: favorite.previousRate || convertedRate,
            };
          }

          return favorite;
        });

        console.log(
          `✅ Conversión USD completada para base ${this.baseCurrency}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error en conversión USD para ${this.baseCurrency}:`,
        error
      );
    }
  }

  // DEPRECATED: Método de simulación reemplazado por datos reales de Frankfurter/BCE
  /*
  simulateRealisticChange(pair: string): number {
    const volatilityMap: Record<string, number> = {
      'EUR/USD': 0.5,
      'GBP/USD': 0.8,
      'USD/JPY': 0.6,
      'GBP/EUR': 0.4,
      'EUR/GBP': 0.4,
      'USD/CHF': 0.3,
      'AUD/USD': 0.9,
      'USD/CAD': 0.4,
      'EUR/JPY': 0.7,
      'GBP/JPY': 1.2,
      'CHF/JPY': 0.8,
      'CAD/JPY': 0.9,
    };

    // Volatilidad base para el par o default
    const baseVolatility = volatilityMap[pair] || 0.6;

    // Generar cambio aleatorio con distribución normal-ish
    const random1 = Math.random();
    const random2 = Math.random();
    const normal =
      Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);

    // Aplicar volatilidad y limitar el rango
    const change = normal * baseVolatility;
    return Math.max(-3, Math.min(3, change)); // Limitar entre -3% y +3%
  }
  */

  formatPercentageChange(change: number): string {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  trackByFavorite(index: number, favorite: FavoritePair): string {
    return favorite.id;
  }

  getUniqueCurrencies(): string[] {
    // Prioridad 1: Si tenemos las 40 monedas completas, usarlas
    if (this.allAvailableCurrencies.length > 0) {
      return this.allAvailableCurrencies;
    }

    // Prioridad 2: Si tenemos datos del dropdown optimizado, usarlos
    if (this.dropdownCurrencies.length > 0) {
      return this.dropdownCurrencies;
    }

    // Fallback al método tradicional (solo favoritos)
    const currencies = new Set<string>();

    // Añadir divisas de los pares favoritos
    this.favoritePairs.forEach((fav) => {
      currencies.add(fav.from);
      currencies.add(fav.to);
    });

    // Añadir divisas favoritas individuales
    this.favoriteCurrencies.forEach((fav) => {
      currencies.add(fav.currency);
    });

    // Añadir EUR como base si no está presente
    currencies.add('EUR');

    return Array.from(currencies).sort();
  }

  getFilteredToCurrencies(): string[] {
    const fromCurrency = this.quickConversionForm.get('from')?.value;
    return this.getFavoriteCurrencies().filter(
      (currency) => currency !== fromCurrency
    );
  }

  /**
   * Obtener solo las monedas que están en favoritos (para conversión rápida)
   */
  getFavoriteCurrencies(): string[] {
    const currencies = new Set<string>();

    // Añadir divisas de los pares favoritos
    this.favoritePairs.forEach((fav) => {
      currencies.add(fav.from);
      currencies.add(fav.to);
    });

    // Añadir divisas favoritas individuales
    this.favoriteCurrencies.forEach((fav) => {
      currencies.add(fav.currency);
    });

    // Añadir EUR como base si no está presente
    currencies.add('EUR');

    return Array.from(currencies).sort();
  }

  onFromCurrencyChange(): void {
    const fromCurrency = this.quickConversionForm.get('from')?.value;
    const toCurrency = this.quickConversionForm.get('to')?.value;

    // Si las monedas son iguales, limpiar 'to'
    if (fromCurrency === toCurrency) {
      this.quickConversionForm.patchValue({ to: '' });
    }
  }

  swapCurrencies(): void {
    const fromValue = this.quickConversionForm.get('from')?.value;
    const toValue = this.quickConversionForm.get('to')?.value;

    this.quickConversionForm.patchValue({
      from: toValue,
      to: fromValue,
    });
  }

  calculateQuickConversion(): void {
    const form = this.quickConversionForm;
    if (form.invalid || !form.get('from')?.value || !form.get('to')?.value) {
      this.quickConversionResult = null;
      return;
    }

    const { amount, from, to } = form.value;
    this.quickConversionLoading = true;

    const payload = { from, to, amount };

    this.http
      .post<ConversionResponse>(`${this.apiUrl}/convert`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.quickConversionResult = {
            from,
            to,
            amount,
            result: response.result,
            rate: response.rate,
          };
          this.quickConversionLoading = false;
        },
        error: (error) => {
          console.error('❌ Error en conversión rápida:', error);
          this.quickConversionLoading = false;
          this.quickConversionResult = null;
        },
      });
  }

  useInQuickConversion(favorite: FavoritePair): void {
    this.quickConversionForm.patchValue({
      from: favorite.from,
      to: favorite.to,
    });

    // Scroll al panel de conversión
    document.querySelector('.conversion-panel')?.scrollIntoView({
      behavior: 'smooth',
    });

    this.snackBar.open(
      `📊 Usando ${favorite.pair} en conversión rápida`,
      'Cerrar',
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  getBestPerformer(): PerformanceItem | null {
    const allPerformers: PerformanceItem[] = [
      // Pares favoritos
      ...this.favoritePairs.map((pair) => ({
        id: pair.id,
        name: pair.pair,
        change: pair.change || 0,
        type: 'pair' as const,
        nickname: pair.nickname,
      })),
      // Divisas individuales
      ...this.favoriteCurrencies.map((currency) => ({
        id: currency.id,
        name: currency.currency,
        change: currency.change || 0,
        type: 'currency' as const,
        nickname: currency.nickname,
      })),
    ];

    if (allPerformers.length === 0) return null;

    return allPerformers.reduce((best, current) =>
      current.change > best.change ? current : best
    );
  }

  getWorstPerformer(): PerformanceItem | null {
    const allPerformers: PerformanceItem[] = [
      // Pares favoritos
      ...this.favoritePairs.map((pair) => ({
        id: pair.id,
        name: pair.pair,
        change: pair.change || 0,
        type: 'pair' as const,
        nickname: pair.nickname,
      })),
      // Divisas individuales
      ...this.favoriteCurrencies.map((currency) => ({
        id: currency.id,
        name: currency.currency,
        change: currency.change || 0,
        type: 'currency' as const,
        nickname: currency.nickname,
      })),
    ];

    if (allPerformers.length === 0) return null;

    return allPerformers.reduce((worst, current) =>
      current.change < worst.change ? current : worst
    );
  }

  openAddFavoriteDialog(): void {
    const dialogRef = this.dialog.open(AddFavoriteDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: {
        availableCurrencies: this.getUniqueCurrencies(),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si se añadió un favorito, recargar la lista
        console.log('✅ Favorito añadido:', result);
        this.loadFavorites();
      }
    });
  }

  editFavorite(favorite: FavoritePair): void {
    const dialogRef = this.dialog.open(EditPairDialogComponent, {
      width: '500px',
      data: { pair: favorite },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((updates) => {
      if (updates) {
        this.updateFavoriteOnServer(favorite.id, updates);
      }
    });
  }

  private updateFavoriteOnServer(id: string, updates: UpdatePairRequest): void {
    const payload = {
      nickname: updates.nickname,
    };

    this.http
      .put<UpdatePairResponse>(`${this.apiUrl}/favorites/${id}`, payload)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar el favorito en la lista local
            const index = this.favoritePairs.findIndex(
              (fav: FavoritePair) => fav.id === id
            );
            if (index !== -1) {
              this.favoritePairs[index] = {
                ...this.favoritePairs[index],
                nickname: updates.nickname,
              };
            }

            this.snackBar.open(
              response.message || 'Par actualizado correctamente',
              'Cerrar',
              {
                duration: 2000,
                panelClass: ['success-snackbar'],
              }
            );
          }
        },
        error: (error) => {
          console.error('Error al actualizar par:', error);
          this.snackBar.open(
            'Error al actualizar el par. Inténtalo de nuevo.',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  deleteFavorite(favorite: FavoritePair): void {
    if (!confirm(`¿Eliminar "${favorite.pair}" de favoritos?`)) return;

    this.http
      .delete(`${this.apiUrl}/favorites/${favorite.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.favoritePairs = this.favoritePairs.filter(
            (f) => f.id !== favorite.id
          );
          this.snackBar.open(
            `✅ ${favorite.pair} eliminado de favoritos`,
            'Cerrar',
            { duration: 2000, panelClass: ['success-snackbar'] }
          );
        },
        error: (error) => {
          console.error('❌ Error eliminando favorito:', error);
          this.snackBar.open('❌ Error al eliminar el favorito', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  // ========== MÉTODOS PARA DIVISAS FAVORITAS INDIVIDUALES ==========

  addFavoriteCurrency(currency: string, nickname?: string): void {
    const payload = {
      currency: currency.toUpperCase(),
      nickname: nickname || '',
      priority: 1,
    };

    this.http
      .post<{ message: string; favoriteCurrency: FavoriteCurrency }>(
        `${this.apiUrl}/favorite-currencies`,
        payload
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadFavoriteCurrencies(); // Recargar la lista
          this.snackBar.open(
            `✅ ${currency.toUpperCase()} añadida a favoritas`,
            'Cerrar',
            { duration: 2000, panelClass: ['success-snackbar'] }
          );
        },
        error: (error) => {
          console.error('❌ Error añadiendo divisa favorita:', error);
          const message =
            error.status === 409
              ? 'Esta divisa ya está en tus favoritas'
              : 'Error al añadir la divisa a favoritas';
          this.snackBar.open(`❌ ${message}`, 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  deleteFavoriteCurrency(favoriteCurrency: FavoriteCurrency): void {
    if (!confirm(`¿Eliminar "${favoriteCurrency.currency}" de favoritas?`))
      return;

    this.http
      .delete(`${this.apiUrl}/favorite-currencies/${favoriteCurrency.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.favoriteCurrencies = this.favoriteCurrencies.filter(
            (f) => f.id !== favoriteCurrency.id
          );
          // Recargar dropdown al eliminar divisa
          this.loadDropdownCurrencies();
          this.snackBar.open(
            `✅ ${favoriteCurrency.currency} eliminada de favoritas`,
            'Cerrar',
            { duration: 2000, panelClass: ['success-snackbar'] }
          );
        },
        error: (error) => {
          console.error('❌ Error eliminando divisa favorita:', error);
          this.snackBar.open(
            '❌ Error al eliminar la divisa favorita',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  updateFavoriteCurrency(
    favoriteCurrency: FavoriteCurrency,
    updates: Partial<FavoriteCurrency>
  ): void {
    this.http
      .put<{ message: string; favoriteCurrency: FavoriteCurrency }>(
        `${this.apiUrl}/favorite-currencies/${favoriteCurrency.id}`,
        updates
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Actualizar en la lista local
          const index = this.favoriteCurrencies.findIndex(
            (f) => f.id === favoriteCurrency.id
          );
          if (index !== -1) {
            this.favoriteCurrencies[index] = {
              ...this.favoriteCurrencies[index],
              ...updates,
            };
          }
          this.snackBar.open('✅ Divisa favorita actualizada', 'Cerrar', {
            duration: 2000,
            panelClass: ['success-snackbar'],
          });
        },
        error: (error) => {
          console.error('❌ Error actualizando divisa favorita:', error);
          this.snackBar.open(
            '❌ Error al actualizar la divisa favorita',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  /**
   * Debug: Comparar datos del backend vs BCE
   */
  private logDataComparison(
    item: FavoritePair | FavoriteCurrency,
    type: 'pair' | 'currency'
  ): void {
    if (type === 'pair') {
      const pair = item as FavoritePair;
      console.log(`🔍 Comparación de datos para par ${pair.pair}:`, {
        backend: {
          currentRate: pair.currentRate,
          change: pair.change,
        },
        bce: {
          currentRate: 'N/A', // Los pares no tienen rate directo del backend
          change: pair.change,
          trendStatus: pair.trendStatus,
          changeText: pair.changeText,
        },
      });
    } else {
      const currency = item as FavoriteCurrency;
      const backendRate = this.getCurrentRateFromBackend(currency);
      console.log(`🔍 Comparación de datos para divisa ${currency.currency}:`, {
        backend: {
          currentRate: backendRate,
          change: 'N/A', // Backend no proporciona change para divisas individuales
        },
        bce: {
          currentRate: currency.currentRate,
          change: currency.change,
          trendStatus: currency.trendStatus,
          changeText: currency.changeText,
        },
      });
    }
  }

  /**
   * Obtener rate del backend (método original)
   */
  private getCurrentRateFromBackend(
    favoriteCurrency: FavoriteCurrency
  ): number {
    const base = this.baseCurrency;
    const rateKey = `${base}_to_${favoriteCurrency.currency}`;
    const rate = favoriteCurrency.rates[rateKey];
    return typeof rate === 'number' ? rate : 0;
  }

  getCurrentRateForCurrency(
    favoriteCurrency: FavoriteCurrency,
    baseCurrency?: string
  ): number {
    // ✅ PRIORIDAD 1: Usar currentRate del BCE si está disponible
    if (favoriteCurrency.currentRate && favoriteCurrency.currentRate > 0) {
      return favoriteCurrency.currentRate;
    }

    // ✅ FALLBACK: Usar rates del backend como antes
    const base = baseCurrency || this.baseCurrency;
    const rateKey = `${base}_to_${favoriteCurrency.currency}`;
    const rate = favoriteCurrency.rates[rateKey];
    return typeof rate === 'number' ? rate : 0;
  }

  trackByFavoriteCurrency(
    index: number,
    favoriteCurrency: FavoriteCurrency
  ): string {
    return favoriteCurrency.id;
  }

  // ========== MÉTODOS ADICIONALES PARA DIVISAS FAVORITAS ==========

  openAddCurrencyDialog(): void {
    const dialogRef = this.dialog.open(AddCurrencyDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si se añadió una divisa favorita, recargar la lista y el dropdown
        console.log('✅ Divisa favorita añadida:', result);
        this.loadFavoriteCurrencies();
        this.loadDropdownCurrencies(); // Recargar dropdown optimizado
      }
    });
  }

  editFavoriteCurrency(currency: FavoriteCurrency): void {
    const dialogRef = this.dialog.open(EditCurrencyDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      data: {
        currency: currency,
      },
    });

    dialogRef.afterClosed().subscribe((updates) => {
      if (updates) {
        // Aplicar las actualizaciones usando el método existente
        this.updateFavoriteCurrency(currency, updates);
      }
    });
  }

  toggleDefaultCurrency(currency: FavoriteCurrency): void {
    const newDefaultValue = !currency.isDefault;
    this.updateFavoriteCurrency(currency, { isDefault: newDefaultValue });
  }

  useInQuickConversionCurrency(currency: FavoriteCurrency): void {
    // Si hay divisas favoritas, usar EUR como base
    this.quickConversionForm.patchValue({
      from: 'EUR',
      to: currency.currency,
    });

    // Scroll al panel de conversión
    document.querySelector('.conversion-panel')?.scrollIntoView({
      behavior: 'smooth',
    });

    this.snackBar.open(
      `📊 Usando EUR/${currency.currency} en conversión rápida`,
      'Cerrar',
      {
        duration: 2000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  getTotalFavorites(): number {
    return this.favoritePairs.length + this.favoriteCurrencies.length;
  }

  // Nuevas métricas valiosas
  getAverageChange(): number {
    const allItems = [
      ...this.favoritePairs.map((p) => p.change || 0),
      ...this.favoriteCurrencies.map((c) => c.change || 0),
    ];

    if (allItems.length === 0) return 0;
    return allItems.reduce((sum, change) => sum + change, 0) / allItems.length;
  }

  getPositiveChangesCount(): number {
    const allItems = [
      ...this.favoritePairs.map((p) => p.change || 0),
      ...this.favoriteCurrencies.map((c) => c.change || 0),
    ];
    return allItems.filter((change) => change > 0).length;
  }

  getVolatilityLevel(): 'Baja' | 'Media' | 'Alta' {
    const allChanges = [
      ...this.favoritePairs.map((p) => Math.abs(p.change || 0)),
      ...this.favoriteCurrencies.map((c) => Math.abs(c.change || 0)),
    ];

    if (allChanges.length === 0) return 'Baja';

    const avgVolatility =
      allChanges.reduce((sum, change) => sum + change, 0) / allChanges.length;

    if (avgVolatility < 0.5) return 'Baja';
    if (avgVolatility < 1.5) return 'Media';
    return 'Alta';
  }

  getMostActiveTime(): string {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 8 && hour < 17) return 'Mercado Europeo';
    if (hour >= 14 && hour < 23) return 'Mercado Americano';
    if (hour >= 23 || hour < 8) return 'Mercado Asiático';
    return 'Horario de Trading';
  }

  getMarketStatus(): { status: string; color: string; icon: string } {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend
    if (day === 0 || day === 6) {
      return { status: 'Mercado Cerrado', color: '#666', icon: 'schedule' };
    }

    // Weekday trading hours (simplified)
    if (hour >= 8 && hour < 17) {
      return {
        status: 'Mercado Activo',
        color: '#4caf50',
        icon: 'trending_up',
      };
    } else {
      return {
        status: 'Trading Limitado',
        color: '#ff9800',
        icon: 'access_time',
      };
    }
  }

  /**
   * Obtener la bandera de una moneda desde CURRENCY_FLAGS
   */
  getCurrencyFlag(code: string): string {
    return CURRENCY_FLAGS[code] || '🏳️'; // Fallback a bandera genérica
  }

  /**
   * Detectar si una moneda viene de Exchange (Frankfurter ~40) o Convert (Hardcoded 20)
   * ÚTIL: Para debugging y logging de fuentes de datos
   */
  private getCurrencySource(code: string): 'exchange' | 'convert' | 'unknown' {
    // Lista hardcodeada de /api/convert/currencies (20 monedas)
    const convertCurrencies = [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'CHF',
      'CAD',
      'AUD',
      'CNY',
      'MXN',
      'BRL',
      'KRW',
      'INR',
      'SEK',
      'NOK',
      'HKD',
      'SGD',
      'NZD',
      'ZAR',
      'TRY',
      'PLN',
    ];

    if (convertCurrencies.includes(code)) {
      return 'convert'; // Disponible en ambas fuentes
    } else if (this.allAvailableCurrencies.includes(code)) {
      return 'exchange'; // Solo disponible en Frankfurter
    } else {
      return 'unknown'; // No disponible en ninguna fuente conocida
    }
  }
}
