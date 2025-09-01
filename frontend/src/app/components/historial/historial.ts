import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MaterialModule } from '../../shared/material.module';

import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import {
  ConversionHistory,
  HistoryFilters,
  HistoryService,
} from '../../services/history';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  template: `
    <div class="historial-container">
      <div class="content-wrapper">
        <div class="historial-header">
          <h1><mat-icon>history</mat-icon> Historial de Conversiones</h1>
          <p>Todas tus conversiones de divisas en un solo lugar</p>
        </div>

        <!-- Filtros -->
        <mat-card class="filters-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>filter_list</mat-icon>
              Filtros de Búsqueda
            </mat-card-title>
            <div class="spacer"></div>
            <button
              mat-button
              color="warn"
              (click)="clearAllHistory()"
              [disabled]="loading || conversions.length === 0"
            >
              <mat-icon>delete_sweep</mat-icon>
              Limpiar Todo
            </button>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="filtersForm" class="filters-form">
              <div class="filters-row">
                <mat-form-field appearance="outline">
                  <mat-label>Divisa origen</mat-label>
                  <mat-select
                    formControlName="from"
                    (selectionChange)="onFromFilterChange()"
                  >
                    <mat-option value="">Todas las divisas</mat-option>
                    <mat-option
                      *ngFor="let currency of getFilteredFromCurrencies()"
                      [value]="currency.code"
                    >
                      {{ currency.flag }} {{ currency.code }} -
                      {{ currency.name }}
                    </mat-option>
                  </mat-select>
                  <mat-icon matSuffix>currency_exchange</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Divisa destino</mat-label>
                  <mat-select
                    formControlName="to"
                    (selectionChange)="onToFilterChange()"
                  >
                    <mat-option value="">Todas las divisas</mat-option>
                    <mat-option
                      *ngFor="let currency of getFilteredToCurrencies()"
                      [value]="currency.code"
                    >
                      {{ currency.flag }} {{ currency.code }} -
                      {{ currency.name }}
                    </mat-option>
                  </mat-select>
                  <mat-icon matSuffix>currency_exchange</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Cantidad mínima</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="minAmount"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <mat-icon matSuffix>trending_up</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Cantidad máxima</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="maxAmount"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <mat-icon matSuffix>trending_down</mat-icon>
                </mat-form-field>
              </div>

              <div class="filters-actions">
                <button
                  mat-raised-button
                  color="primary"
                  (click)="applyFilters()"
                  [disabled]="loading"
                >
                  <mat-icon>search</mat-icon>
                  Aplicar Filtros
                </button>
                <button
                  mat-button
                  (click)="clearFilters()"
                  [disabled]="loading"
                >
                  <mat-icon>clear</mat-icon>
                  Limpiar Filtros
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Loading -->
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <p>Cargando historial de conversiones...</p>
        </div>

        <!-- Sin datos -->
        <mat-card
          *ngIf="!loading && conversions.length === 0"
          class="empty-state"
        >
          <mat-card-content>
            <div class="empty-content">
              <mat-icon class="empty-icon">history</mat-icon>
              <h2>No hay conversiones registradas</h2>
              <p>
                Aún no has realizado ninguna conversión de divisas.<br />
                ¡Empieza a convertir para ver tu historial aquí!
              </p>
              <button mat-raised-button color="primary" routerLink="/dashboard">
                <mat-icon>currency_exchange</mat-icon>
                Ir al Conversor
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tabla de historial -->
        <mat-card
          *ngIf="!loading && conversions.length > 0"
          class="history-table-card"
        >
          <mat-card-header>
            <mat-card-title>
              <mat-icon>list_alt</mat-icon>
              Historial de Conversiones ({{ pagination.total }} total)
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="conversions" class="history-table">
                <!-- Fecha -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon>schedule</mat-icon> Fecha y Hora
                  </th>
                  <td mat-cell *matCellDef="let conversion">
                    <div class="date-cell">
                      <span class="date">{{
                        formatDate(conversion.createdAt)
                      }}</span>
                      <span class="time">{{
                        formatTime(conversion.createdAt)
                      }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Conversión -->
                <ng-container matColumnDef="conversion">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon>swap_horiz</mat-icon> Conversión Realizada
                  </th>
                  <td mat-cell *matCellDef="let conversion">
                    <div class="conversion-cell">
                      <span class="conversion-text">
                        {{ conversion.amount | number : '1.2-2' }}
                        {{ conversion.from }}
                        <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                        {{ conversion.result | number : '1.2-2' }}
                        {{ conversion.to }}
                      </span>
                      <span class="rate">
                        Tasa aplicada: {{ conversion.rate | number : '1.4-4' }}
                      </span>
                    </div>
                  </td>
                </ng-container>

                <!-- Acciones -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-icon>settings</mat-icon> Acciones
                  </th>
                  <td mat-cell *matCellDef="let conversion">
                    <button
                      mat-icon-button
                      color="primary"
                      (click)="repeatConversion(conversion)"
                      matTooltip="Repetir esta conversión"
                      matTooltipPosition="above"
                    >
                      <mat-icon>refresh</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="deleteConversion(conversion._id)"
                      [disabled]="loading"
                      matTooltip="Eliminar conversión"
                      matTooltipPosition="above"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                ></tr>
              </table>
            </div>

            <!-- Paginación -->
            <mat-paginator
              [length]="pagination.total"
              [pageSize]="pagination.limit"
              [pageIndex]="pagination.page - 1"
              [pageSizeOptions]="[5, 10, 20, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            >
            </mat-paginator>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrl: './historial.scss', // ✅ USAR ARCHIVO SCSS EXTERNO
})
export class Historial implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filtersForm: FormGroup;
  conversions: ConversionHistory[] = [];
  loading = false;
  displayedColumns = ['date', 'conversion', 'actions'];

  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    count: 0,
  };

  // ✅ MISMA LISTA QUE EL DASHBOARD (31 monedas)
  availableCurrencies = [
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
    // ✅ NUEVAS MONEDAS:
    { code: 'BGN', name: 'Lev Búlgaro', flag: '🇧🇬' },
    { code: 'CZK', name: 'Corona Checa', flag: '🇨🇿' },
    { code: 'DKK', name: 'Corona Danesa', flag: '🇩🇰' },
    { code: 'HUF', name: 'Florín Húngaro', flag: '🇭🇺' },
    { code: 'IDR', name: 'Rupia Indonesia', flag: '🇮🇩' },
    { code: 'ILS', name: 'Shekel Israelí', flag: '🇮🇱' },
    { code: 'ISK', name: 'Corona Islandesa', flag: '🇮🇸' },
    { code: 'MYR', name: 'Ringgit Malayo', flag: '🇲🇾' },
    { code: 'PHP', name: 'Peso Filipino', flag: '🇵🇭' },
    { code: 'RON', name: 'Leu Rumano', flag: '🇷🇴' },
    { code: 'THB', name: 'Baht Tailandés', flag: '🇹🇭' },
  ];

  constructor(
    private historyService: HistoryService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filtersForm = this.fb.group({
      from: [''],
      to: [''],
      minAmount: [''],
      maxAmount: [''],
    });
  }

  ngOnInit(): void {
    console.log('🔍 Iniciando componente Historial');
    console.log('🔍 Usuario autenticado:', this.authService.isAuthenticated());
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory(filters?: HistoryFilters): void {
    this.loading = true;

    const searchFilters = {
      ...filters,
      page: this.pagination.page,
      limit: this.pagination.limit,
    };

    console.log('📊 Cargando historial con filtros:', searchFilters);

    this.historyService
      .getHistory(searchFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Historial cargado:', response);
          this.conversions = response.results;
          this.pagination = {
            page: response.page,
            limit: response.limit,
            total: response.total,
            count: response.count,
          };
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando historial:', error);
          this.loading = false;

          this.snackBar.open(
            'Error al cargar el historial. Inténtalo de nuevo.',
            'Cerrar',
            { duration: 4000, panelClass: ['error-snackbar'] }
          );
        },
      });
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    Object.keys(filters).forEach((key) => {
      if (filters[key] === '' || filters[key] === null) {
        delete filters[key];
      }
    });

    this.pagination.page = 1;
    this.loadHistory(filters);

    this.snackBar.open('Filtros aplicados correctamente', 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.pagination.page = 1;
    this.loadHistory();

    this.snackBar.open('Filtros limpiados', 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
  }

  onPageChange(event: any): void {
    this.pagination.page = event.pageIndex + 1;
    this.pagination.limit = event.pageSize;
    this.loadHistory(this.filtersForm.value);
  }

  deleteConversion(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta conversión?')) {
      this.loading = true;

      this.historyService
        .deleteConversion(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('🗑️ Conversión eliminada');
            this.loadHistory(this.filtersForm.value);

            this.snackBar.open('Conversión eliminada correctamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          },
          error: (error) => {
            console.error('❌ Error eliminando conversión:', error);
            this.loading = false;

            this.snackBar.open('Error al eliminar la conversión', 'Cerrar', {
              duration: 4000,
              panelClass: ['error-snackbar'],
            });
          },
        });
    }
  }

  clearAllHistory(): void {
    if (
      confirm(
        '¿Estás seguro de que quieres eliminar TODO tu historial? Esta acción no se puede deshacer.'
      )
    ) {
      this.loading = true;

      this.historyService
        .deleteAllHistory()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('🗑️ Historial completo eliminado');
            this.conversions = [];
            this.pagination.total = 0;
            this.pagination.count = 0;
            this.loading = false;

            this.snackBar.open('Historial completamente limpiado', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
          },
          error: (error) => {
            console.error('❌ Error eliminando historial:', error);
            this.loading = false;

            this.snackBar.open('Error al limpiar el historial', 'Cerrar', {
              duration: 4000,
              panelClass: ['error-snackbar'],
            });
          },
        });
    }
  }

  repeatConversion(conversion: ConversionHistory): void {
    console.log('🔄 Repitiendo conversión:', conversion);

    this.snackBar.open(
      `Redirígiendo al conversor: ${conversion.amount} ${conversion.from} → ${conversion.to}`,
      'Cerrar',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );

    // TODO: Implementar navegación con parámetros al dashboard
    // this.router.navigate(['/dashboard'], {
    //   queryParams: {
    //     from: conversion.from,
    //     to: conversion.to,
    //     amount: conversion.amount
    //   }
    // });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getFilteredFromCurrencies() {
    const selectedTo = this.filtersForm.get('to')?.value;
    return this.availableCurrencies.filter(
      (currency) => currency.code !== selectedTo
    );
  }

  getFilteredToCurrencies() {
    const selectedFrom = this.filtersForm.get('from')?.value;
    return this.availableCurrencies.filter(
      (currency) => currency.code !== selectedFrom
    );
  }

  onFromFilterChange(): void {
    const fromValue = this.filtersForm.get('from')?.value;
    const toValue = this.filtersForm.get('to')?.value;

    if (fromValue && fromValue === toValue) {
      this.filtersForm.patchValue({ to: '' });
    }
  }

  onToFilterChange(): void {
    const fromValue = this.filtersForm.get('from')?.value;
    const toValue = this.filtersForm.get('to')?.value;

    if (toValue && toValue === fromValue) {
      this.filtersForm.patchValue({ from: '' });
    }
  }
}
