import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { interval, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth';
import { MaterialModule } from '../../shared/material.module';
import { AddFavoriteDialogComponent } from './add-favorite-dialog.component';

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
}

interface QuickConversion {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
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
        <p class="subtitle">
          Gestiona y monitorea tus pares favoritos en tiempo real
        </p>

        <!-- Auto-refresh indicator -->
        <div class="refresh-indicator" *ngIf="autoRefresh">
          <mat-icon [class.spinning]="loading">refresh</mat-icon>
          <span>Actualizando cada 30s</span>
          <button
            mat-icon-button
            (click)="toggleAutoRefresh()"
            matTooltip="Pausar auto-actualización"
          >
            <mat-icon>pause</mat-icon>
          </button>
        </div>
        <div class="refresh-indicator" *ngIf="!autoRefresh">
          <mat-icon>pause</mat-icon>
          <span>Auto-actualización pausada</span>
          <button
            mat-icon-button
            (click)="toggleAutoRefresh()"
            matTooltip="Reanudar auto-actualización"
          >
            <mat-icon>play_arrow</mat-icon>
          </button>
        </div>
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
                <span>{{ formatPercentageChange(favorite.change || 0) }}</span>
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
                  *ngFor="let currency of getUniqueCurrencies()"
                  [value]="currency"
                >
                  {{ currency }}
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
                  {{ currency }}
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
      <div class="summary-row" *ngIf="favoritePairs.length > 0">
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
              <span class="performer-pair">{{ getBestPerformer()?.pair }}</span>
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
              <span class="performer-pair">{{
                getWorstPerformer()?.pair
              }}</span>
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
              <span class="total-count">{{ favoritePairs.length }}</span>
              <span class="total-label">pares monitoreados</span>
            </div>
            <p class="total-description">
              Gestiona todos tus favoritos desde aquí
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
  private refreshInterval$ = interval(30000); // 30 segundos

  loading = false;
  autoRefresh = true;
  favoritePairs: FavoritePair[] = [];
  quickConversionForm: FormGroup;
  quickConversionLoading = false;
  quickConversionResult: QuickConversion | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.quickConversionForm = this.fb.group({
      amount: [1000, [Validators.required, Validators.min(0.01)]],
      from: ['', Validators.required],
      to: ['', Validators.required],
    });
  }

  ngOnInit(): void {
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
    this.loadFavorites();
    this.setupAutoRefresh();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupAutoRefresh(): void {
    this.refreshInterval$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.autoRefresh && !this.loading) {
        this.loadFavorites(true); // Silent refresh
      }
    });
  }

  setupFormSubscriptions(): void {
    // Auto-calculate cuando cambian los valores
    this.quickConversionForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateQuickConversion();
      });
  }

  loadFavorites(silent = false): void {
    if (!silent) this.loading = true;

    this.http
      .get<{ count: number; favorites: FavoritePair[] }>(
        `${this.apiUrl}/favorites`
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Calcular cambios comparando con datos anteriores
          const newFavorites = response.favorites.map((newFav) => {
            const oldFav = this.favoritePairs.find(
              (old) => old.id === newFav.id
            );
            return {
              ...newFav,
              change: oldFav
                ? this.calculateChange(oldFav.currentRate, newFav.currentRate)
                : 0,
              previousRate: oldFav?.currentRate,
            };
          });

          this.favoritePairs = newFavorites;
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

  calculateChange(oldRate: number, newRate: number): number {
    if (!oldRate || !newRate) return 0;
    return ((newRate - oldRate) / oldRate) * 100;
  }

  formatPercentageChange(change: number): string {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    const message = this.autoRefresh
      ? '✅ Auto-actualización activada'
      : '⏸️ Auto-actualización pausada';

    this.snackBar.open(message, 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }

  trackByFavorite(index: number, favorite: FavoritePair): string {
    return favorite.id;
  }

  getUniqueCurrencies(): string[] {
    const currencies = new Set<string>();
    this.favoritePairs.forEach((fav) => {
      currencies.add(fav.from);
      currencies.add(fav.to);
    });
    return Array.from(currencies).sort();
  }

  getFilteredToCurrencies(): string[] {
    const fromCurrency = this.quickConversionForm.get('from')?.value;
    return this.getUniqueCurrencies().filter(
      (currency) => currency !== fromCurrency
    );
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
      .post<any>(`${this.apiUrl}/convert`, payload)
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

  getBestPerformer(): FavoritePair | null {
    if (this.favoritePairs.length === 0) return null;

    return this.favoritePairs.reduce((best, current) =>
      (current.change || 0) > (best.change || 0) ? current : best
    );
  }

  getWorstPerformer(): FavoritePair | null {
    if (this.favoritePairs.length === 0) return null;

    return this.favoritePairs.reduce((worst, current) =>
      (current.change || 0) < (worst.change || 0) ? current : worst
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
    // TODO: Implementar dialog para editar nickname
    this.snackBar.open(`🚧 Editar "${favorite.pair}" próximamente`, 'Cerrar', {
      duration: 2000,
      panelClass: ['warning-snackbar'],
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
}
