import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Alert, AlertasService } from '../../services/alertas'; // ✅ USAR TU SERVICE
import { AuthService } from '../../services/auth';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './alertas.html',
  styleUrl: './alertas.scss',
})
export class Alertas implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  alerts: Alert[] = [];
  loading = false;
  saving = false;
  alertForm: FormGroup;
  currentUser: any;

  // Configuraciones
  alertTypes = [
    {
      value: 'scheduled',
      label: 'Programada',
      icon: 'schedule',
      description: 'Cada X días a una hora específica',
    },
    {
      value: 'percentage',
      label: 'Por Porcentaje',
      icon: 'trending_up',
      description: 'Cuando cambie un % específico',
    },
    {
      value: 'target',
      label: 'Precio Objetivo',
      icon: 'gps_fixed',
      description: 'Cuando llegue a un precio específico',
    },
  ];

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
    private alertasService: AlertasService, // ✅ USAR TU SERVICE
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.alertForm = this.fb.group({
      alertType: ['percentage', Validators.required],
      from: ['USD', Validators.required],
      to: ['EUR', Validators.required],
      email: ['', [Validators.required, Validators.email]],

      // Para alertas programadas
      intervalDays: [7, [Validators.min(1), Validators.max(365)]],
      hour: [8, [Validators.min(0), Validators.max(23)]],

      // Para alertas por porcentaje
      percentageThreshold: [2, [Validators.min(0.1), Validators.max(50)]],
      percentageDirection: ['both'],

      // Para alertas por precio objetivo
      targetRate: [1.2, [Validators.min(0.0001)]],
      targetDirection: ['above'],
    });
  }

  ngOnInit(): void {
    console.log('🔔 Iniciando componente de alertas...');

    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.email) {
      this.alertForm.patchValue({ email: this.currentUser.email });
      console.log('✅ Email del usuario configurado:', this.currentUser.email);
    }

    this.loadAlerts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAlerts(): void {
    console.log('🔍 Cargando alertas...');
    this.loading = true;

    this.alertasService
      .getAlertas() // ✅ USAR TU SERVICE
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alerts) => {
          console.log('✅ Alertas cargadas:', alerts);
          this.alerts = alerts;
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando alertas:', error);
          this.loading = false;
          this.snackBar.open('❌ Error al cargar las alertas', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  createAlert(): void {
    if (this.alertForm.invalid) {
      this.snackBar.open(
        '❌ Por favor completa los campos requeridos',
        'Cerrar',
        { duration: 3000 }
      );
      return;
    }

    const formData = this.alertForm.value;
    const alertType = formData.alertType;

    console.log('📝 Creando alerta:', { alertType, formData });
    this.saving = true;

    let createRequest;

    switch (alertType) {
      case 'scheduled':
        createRequest = this.alertasService.createScheduledAlert({
          from: formData.from,
          to: formData.to,
          email: formData.email,
          intervalDays: formData.intervalDays,
          hour: formData.hour,
        });
        break;

      case 'percentage':
        createRequest = this.alertasService.createPercentageAlert({
          from: formData.from,
          to: formData.to,
          email: formData.email,
          percentageThreshold: formData.percentageThreshold,
          percentageDirection: formData.percentageDirection,
        });
        break;

      case 'target':
        createRequest = this.alertasService.createTargetAlert({
          from: formData.from,
          to: formData.to,
          email: formData.email,
          targetRate: formData.targetRate,
          targetDirection: formData.targetDirection,
        });
        break;

      default:
        this.saving = false;
        return;
    }

    createRequest.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('✅ Alerta creada:', response);
        this.saving = false;
        this.snackBar.open('✅ Alerta creada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.loadAlerts(); // Recargar lista
      },
      error: (error) => {
        console.error('❌ Error creando alerta:', error);
        this.saving = false;
        this.snackBar.open('❌ Error al crear la alerta', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  toggleAlert(alert: Alert): void {
    console.log('🔄 Cambiando estado de alerta:', alert._id, !alert.isActive);

    this.alertasService
      .toggleAlert(alert._id!, !alert.isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert.isActive = !alert.isActive;
          this.snackBar.open(
            `✅ Alerta ${alert.isActive ? 'activada' : 'desactivada'}`,
            'Cerrar',
            { duration: 2000 }
          );
        },
        error: (error) => {
          console.error('❌ Error actualizando alerta:', error);
          this.snackBar.open('❌ Error al actualizar la alerta', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  deleteAlert(alert: Alert): void {
    if (
      !confirm(`¿Estás seguro de eliminar la alerta ${alert.from}/${alert.to}?`)
    ) {
      return;
    }

    console.log('🗑️ Eliminando alerta:', alert._id);

    this.alertasService
      .deleteAlert(alert._id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ Alerta eliminada exitosamente', 'Cerrar', {
            duration: 2000,
          });
          this.loadAlerts(); // Recargar lista
        },
        error: (error) => {
          console.error('❌ Error eliminando alerta:', error);
          this.snackBar.open('❌ Error al eliminar la alerta', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  // ✅ MÉTODOS AUXILIARES:

  getAlertDescription(alert: Alert): string {
    switch (alert.alertType) {
      case 'scheduled':
        return `Cada ${alert.intervalDays} días a las ${alert.hour}:00`;
      case 'percentage':
        const direction =
          alert.percentageDirection === 'up'
            ? 'suba'
            : alert.percentageDirection === 'down'
            ? 'baje'
            : 'cambie';
        return `Cuando ${direction} ${alert.percentageThreshold}%`;
      case 'target':
        const operator =
          alert.targetDirection === 'above'
            ? '>'
            : alert.targetDirection === 'below'
            ? '<'
            : '=';
        return `Cuando ${operator} ${alert.targetRate}`;
      default:
        return 'Alerta personalizada';
    }
  }

  getCurrencyFlag(code: string): string {
    const currency = this.availableCurrencies.find((c) => c.code === code);
    return currency?.flag || '🏳️';
  }

  getFilteredToCurrencies() {
    const selectedFrom = this.alertForm.get('from')?.value;
    return this.availableCurrencies.filter(
      (currency) => currency.code !== selectedFrom
    );
  }

  onFromCurrencyChange(): void {
    const fromValue = this.alertForm.get('from')?.value;
    const toValue = this.alertForm.get('to')?.value;

    if (fromValue && fromValue === toValue) {
      this.alertForm.patchValue({ to: '' });
    }
  }

  // ✅ MÉTODOS ADICIONALES:

  testAlert(alert: Alert): void {
    console.log('🧪 Probando alerta:', alert._id);

    this.alertasService
      .testAlert(alert._id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Test de alerta enviado:', response);
          this.snackBar.open('✅ Email de prueba enviado', 'Cerrar', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('❌ Error en test de alerta:', error);
          this.snackBar.open('❌ Error al enviar test', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  isFormValid(): boolean {
    const alertType = this.alertForm.get('alertType')?.value;

    // ✅ Verificar que el form no sea nulo
    if (!this.alertForm) return false;

    // ✅ Validación robusta de campos comunes
    const fromControl = this.alertForm.get('from');
    const toControl = this.alertForm.get('to');
    const emailControl = this.alertForm.get('email');

    const commonValid =
      fromControl?.valid === true &&
      toControl?.valid === true &&
      emailControl?.valid === true;

    if (!commonValid) return false;

    // ✅ Validación específica por tipo
    switch (alertType) {
      case 'scheduled':
        const intervalControl = this.alertForm.get('intervalDays');
        const hourControl = this.alertForm.get('hour');
        return intervalControl?.valid === true && hourControl?.valid === true;

      case 'percentage':
        const thresholdControl = this.alertForm.get('percentageThreshold');
        return thresholdControl?.valid === true;

      case 'target':
        const targetControl = this.alertForm.get('targetRate');
        return targetControl?.valid === true;

      default:
        return false;
    }
  }

  // AÑADIR estos métodos al final del component:

  getActiveAlertsCount(): number {
    return this.alerts.filter((alert) => alert.isActive).length;
  }

  getAlertTypeIcon(alertType: string): string {
    const type = this.alertTypes.find((t) => t.value === alertType);
    return type?.icon || 'notifications';
  }

  getAlertTypeLabel(alertType: string): string {
    const type = this.alertTypes.find((t) => t.value === alertType);
    return type?.label || 'Personalizada';
  }

  trackByAlertId(index: number, alert: Alert): string {
    return alert._id || index.toString();
  }
}
