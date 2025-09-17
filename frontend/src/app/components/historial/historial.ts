import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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

interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  templateUrl: './historial.html',
  styleUrl: './historial.scss',
})
export class Historial implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ✅ USANDO INJECT EN LUGAR DE CONSTRUCTOR INJECTION
  private historyService = inject(HistoryService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

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

  constructor() {
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

  onPageChange(event: PageEvent): void {
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
