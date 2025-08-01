import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MaterialModule } from '../../shared/material.module'; // ✅ USAR MaterialModule

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
      <div class="historial-header">
        <h1><mat-icon>history</mat-icon> Historial de Conversiones</h1>
        <p>Todas tus conversiones de divisas en un solo lugar</p>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>filter_list</mat-icon>
            Filtros
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
                  <mat-option value="">Todas</mat-option>
                  <mat-option
                    *ngFor="let currency of getFilteredFromCurrencies()"
                    [value]="currency.code"
                  >
                    {{ currency.flag }} {{ currency.code }} -
                    {{ currency.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Divisa destino</mat-label>
                <mat-select
                  formControlName="to"
                  (selectionChange)="onToFilterChange()"
                >
                  <mat-option value="">Todas</mat-option>
                  <mat-option
                    *ngFor="let currency of getFilteredToCurrencies()"
                    [value]="currency.code"
                  >
                    {{ currency.flag }} {{ currency.code }} -
                    {{ currency.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Cantidad mínima</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="minAmount"
                  min="0"
                />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Cantidad máxima</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="maxAmount"
                  min="0"
                />
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
              <button mat-button (click)="clearFilters()" [disabled]="loading">
                <mat-icon>clear</mat-icon>
                Limpiar Filtros
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Cargando historial...</p>
      </div>

      <!-- Sin datos -->
      <mat-card
        *ngIf="!loading && conversions.length === 0"
        class="empty-state"
      >
        <mat-card-content>
          <div class="empty-content">
            <mat-icon class="empty-icon">history</mat-icon>
            <h2>No hay conversiones</h2>
            <p>
              Aún no has realizado ninguna conversión. ¡Empieza a convertir
              divisas!
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
            <mat-icon>list</mat-icon>
            Conversiones ({{ pagination.total }} total)
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="conversions" class="history-table">
              <!-- Fecha -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
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
                <th mat-header-cell *matHeaderCellDef>Conversión</th>
                <td mat-cell *matCellDef="let conversion">
                  <div class="conversion-cell">
                    <span class="conversion-text">
                      {{ conversion.amount | number : '1.2-2' }}
                      {{ conversion.from }}
                      <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      {{ conversion.result | number : '1.2-2' }}
                      {{ conversion.to }}
                    </span>
                    <span class="rate"
                      >Tasa: {{ conversion.rate | number : '1.4-4' }}</span
                    >
                  </div>
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let conversion">
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteConversion(conversion._id)"
                    [disabled]="loading"
                    matTooltip="Eliminar conversión"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="primary"
                    (click)="repeatConversion(conversion)"
                    matTooltip="Repetir conversión"
                  >
                    <mat-icon>refresh</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
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
  `,
  styles: [
    `
      .historial-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .historial-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .historial-header h1 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 0 0 10px 0;
        color: #333;
      }

      .historial-header p {
        color: #666;
        margin: 0;
      }

      .filters-card {
        margin-bottom: 20px;
      }

      .filters-form {
        margin-top: 16px;
      }

      .filters-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }

      .filters-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .spacer {
        flex: 1 1 auto;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        gap: 16px;
      }

      .empty-state {
        margin: 20px 0;
      }

      .empty-content {
        text-align: center;
        padding: 40px 20px;
      }

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      .empty-content h2 {
        color: #666;
        margin: 16px 0 8px 0;
      }

      .empty-content p {
        color: #999;
        margin-bottom: 24px;
      }

      .history-table-card {
        margin: 20px 0;
      }

      .table-container {
        overflow-x: auto;
      }

      .history-table {
        width: 100%;
      }

      .date-cell {
        display: flex;
        flex-direction: column;
      }

      .date {
        font-weight: 500;
        color: #333;
      }

      .time {
        font-size: 12px;
        color: #666;
      }

      .conversion-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .conversion-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }

      .arrow-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #666;
      }

      .rate {
        font-size: 12px;
        color: #666;
      }

      @media (max-width: 768px) {
        .historial-container {
          padding: 10px;
        }

        .filters-row {
          grid-template-columns: 1fr;
        }

        .filters-actions {
          justify-content: center;
        }
      }
    `,
  ],
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
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      console.log('❌ Usuario no autenticado, redirigiendo...');

      // ✅ OPCIONAL: Mostrar toast
      this.snackBar.open(
        '🔒 Sesión expirada. Inicia sesión nuevamente.',
        'Cerrar',
        { duration: 3000 }
      );

      return;
    }

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
        },
      });
  }

  applyFilters(): void {
    const filters = this.filtersForm.value;
    // Limpiar campos vacíos
    Object.keys(filters).forEach((key) => {
      if (filters[key] === '' || filters[key] === null) {
        delete filters[key];
      }
    });

    this.pagination.page = 1; // Reset a primera página
    this.loadHistory(filters);
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.pagination.page = 1;
    this.loadHistory();
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
          },
          error: (error) => {
            console.error('❌ Error eliminando conversión:', error);
            this.loading = false;
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
          },
          error: (error) => {
            console.error('❌ Error eliminando historial:', error);
            this.loading = false;
          },
        });
    }
  }

  repeatConversion(conversion: ConversionHistory): void {
    // Navegar al dashboard con los valores precargados
    console.log('🔄 Repitiendo conversión:', conversion);
    // Implementar navegación con parámetros
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ✅ FILTRAR divisas para origen en filtros
  getFilteredFromCurrencies() {
    const selectedTo = this.filtersForm.get('to')?.value;
    return this.availableCurrencies.filter(
      (currency) => currency.code !== selectedTo
    );
  }

  // ✅ FILTRAR divisas para destino en filtros
  getFilteredToCurrencies() {
    const selectedFrom = this.filtersForm.get('from')?.value;
    return this.availableCurrencies.filter(
      (currency) => currency.code !== selectedFrom
    );
  }

  // ✅ EVENTO cuando cambia divisa origen en filtros
  onFromFilterChange(): void {
    const fromValue = this.filtersForm.get('from')?.value;
    const toValue = this.filtersForm.get('to')?.value;

    // Si ambas son iguales, resetear destino
    if (fromValue && fromValue === toValue) {
      this.filtersForm.patchValue({ to: '' });
    }
  }

  // ✅ EVENTO cuando cambia divisa destino en filtros
  onToFilterChange(): void {
    const fromValue = this.filtersForm.get('from')?.value;
    const toValue = this.filtersForm.get('to')?.value;

    // Si ambas son iguales, resetear origen
    if (toValue && toValue === fromValue) {
      this.filtersForm.patchValue({ from: '' });
    }
  }
}
