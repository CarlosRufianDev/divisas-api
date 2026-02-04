# 🔧 GUÍA DE REFACTOR - ANTES Y DESPUÉS

## 1️⃣ CENTRALIZAR VARIABLES SCSS

### ❌ ANTES (Duplicado en 5 Archivos)

```scss
// dashboard/styles/_variables.scss (300 líneas)
$warning-yellow: #fbbf24;
$info-blue: #3b82f6;
$success-green: #22c55e;
$error-red: #ef4444;
$primary-blue: #667eea;
$primary-purple: #764ba2;
// ... 10+ más

// login/styles/_variables.scss (200 líneas - DUPLICADO)
$warning-yellow: #fbbf24;
$info-blue: #3b82f6;
$success-green: #22c55e;
// ... REPITE TODO

// register/styles/_variables.scss (200 líneas - DUPLICADO)
$warning-yellow: #fbbf24;
$info-blue: #3b82f6;
// ... REPITE TODO
```

**Problema:** 1300 líneas para 150 líneas de información.

### ✅ DESPUÉS (Centralizado)

```scss
// styles/shared/_variables.scss (150 líneas - PUNTO ÚNICO DE VERDAD)
// ============================================================================
// COLOR SYSTEM
// ============================================================================
$colors: (
  'primary-blue': #667eea,
  'primary-purple': #764ba2,
  'info-blue': #3b82f6,
  'success-green': #22c55e,
  'warning-yellow': #fbbf24,
  'warning-orange': #f59e0b,
  'error-red': #ef4444,
  'slate-700': #374151,
  'slate-600': #4b5563,
  'slate-200': #e2e8f0,
  'slate-100': #f1f5f9,
  'neutral-800': #1f2937,
  'neutral-200': #ebebeb,
  'neutral-100': #f5f5f5,
  'glass-white': rgba(255, 255, 255, 0.9),
  'glass-dark': rgba(30, 41, 59, 0.6),
);

// ============================================================================
// SPACING SYSTEM
// ============================================================================
$spacing: (
  'xs': 0.25rem,
  'sm': 0.5rem,
  'md': 1rem,
  'lg': 1.5rem,
  'xl': 2rem,
  '2xl': 2.5rem,
  '3xl': 3rem,
);

// ============================================================================
// BREAKPOINTS
// ============================================================================
$breakpoints: (
  'sm': 480px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1200px,
);

// ============================================================================
// TYPOGRAPHY
// ============================================================================
$fonts: (
  'sans': (
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif,
  ),
  'serif': (
    'Poppins',
    sans-serif,
  ),
  'mono': (
    'JetBrains Mono',
    monospace,
  ),
);

$font-sizes: (
  'xs': 0.75rem,
  'sm': 0.875rem,
  'base': 1rem,
  'lg': 1.125rem,
  'xl': 1.25rem,
  '2xl': 1.5rem,
  '3xl': 1.875rem,
  '4xl': 2.25rem,
);

// ============================================================================
// SHADOWS
// ============================================================================
$shadows: (
  'sm': 0 4px 10px rgba(0, 0, 0, 0.1),
  'md': 0 8px 20px rgba(102, 126, 234, 0.3),
  'lg': 0 12px 40px rgba(31, 38, 135, 0.25),
  'xl': 0 20px 40px rgba(0, 0, 0, 0.15),
  'glass': 0 8px 32px rgba(31, 38, 135, 0.2),
  0 4px 16px rgba(0, 0, 0, 0.1),
);

// ============================================================================
// TRANSITIONS
// ============================================================================
$transitions: (
  'fast': 0.15s cubic-bezier(0.4, 0, 0.6, 1),
  'normal': 0.3s cubic-bezier(0.4, 0, 0.2, 1),
  'slow': 0.5s cubic-bezier(0.2, 0, 0.38, 0.9),
);

// ============================================================================
// BORDER RADIUS
// ============================================================================
$radius: (
  'sm': 8px,
  'md': 12px,
  'lg': 16px,
  'xl': 20px,
  'full': 9999px,
);

// ============================================================================
// Z-INDEX
// ============================================================================
$z-index: (
  'base': 1,
  'dropdown': 100,
  'modal': 1000,
  'tooltip': 1100,
);

// ============================================================================
// HELPER FUNCTION
// ============================================================================
@function color($name) {
  @return map-get($colors, $name);
}

@function spacing($name) {
  @return map-get($spacing, $name);
}

@function font-family($name) {
  @return map-get($fonts, $name);
}

@function font-size($name) {
  @return map-get($font-sizes, $name);
}

@function breakpoint($name) {
  @return map-get($breakpoints, $name);
}

@function shadow($name) {
  @return map-get($shadows, $name);
}

@function transition($name) {
  @return map-get($transitions, $name);
}

@function z($name) {
  @return map-get($z-index, $name);
}
```

### Uso en Componentes

```scss
// dashboard/dashboard.scss
@use '../../styles/shared/variables' as vars;

.converter-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border: 2px solid rgba(vars.color('warning-yellow'), 0.4);
  padding: vars.spacing('lg');
  border-radius: vars.radius('lg');
  box-shadow: vars.shadow('glass');
  transition: vars.transition('normal');

  .label {
    color: vars.color('warning-yellow');
    font-family: vars.font-family('sans');
    font-size: vars.font-size('sm');
  }

  @media (max-width: vars.breakpoint('md')) {
    padding: vars.spacing('md');
  }
}
```

**Resultado:** 1300 líneas → 150 líneas = **88% reducción**

---

## 2️⃣ CREAR MIXIN LIBRARY CENTRALIZADA

### ❌ ANTES (Duplicado en 3+ Archivos)

```scss
// dashboard/styles/_mixins.scss
@mixin glass-card() {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  border: 2px solid rgba(251, 191, 36, 0.4);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.12);
}

// favoritos/styles/_mixins.scss (DUPLICADO)
@mixin glass-card() {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  border: 2px solid rgba(251, 191, 36, 0.4);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.12);
}

// profile/styles/_mixins.scss (DUPLICADO)
@mixin glass-card() {
  // ... identical
}
```

**Problema:** Mismo mixin definido 3 veces.

### ✅ DESPUÉS (Centralizado)

```scss
// styles/shared/_mixins.scss (500 líneas)
@use 'variables' as vars;

// ============================================================================
// LAYOUT MIXINS
// ============================================================================

@mixin flex-center($direction: row, $gap: 0) {
  display: flex;
  flex-direction: $direction;
  justify-content: center;
  align-items: center;
  @if $gap > 0 {
    gap: $gap;
  }
}

@mixin flex-between($gap: 0) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @if $gap > 0 {
    gap: $gap;
  }
}

@mixin flex-column($gap: 1rem) {
  display: flex;
  flex-direction: column;
  gap: $gap;
}

@mixin flex-start($direction: row, $gap: 0) {
  display: flex;
  flex-direction: $direction;
  justify-content: flex-start;
  align-items: center;
  @if $gap > 0 {
    gap: $gap;
  }
}

// ============================================================================
// GLASS MORPHISM SYSTEM
// ============================================================================

@mixin glass-card($blur: 20px, $opacity: 0.1) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, $opacity) 0%,
    rgba(255, 255, 255, $opacity * 0.5) 100%
  );
  backdrop-filter: blur($blur);
  border: 2px solid rgba(vars.color('warning-yellow'), 0.4);
  border-radius: vars.radius('lg');
  box-shadow: vars.shadow('glass');
}

@mixin glass-card-dark($blur: 20px) {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.6) 0%,
    rgba(51, 65, 85, 0.5) 100%
  );
  backdrop-filter: blur($blur);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: vars.radius('lg');
}

@mixin glass-header($blur: 15px) {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e293b 25%,
    #334155 50%,
    #1e293b 75%,
    #0f172a 100%
  );
  backdrop-filter: blur($blur);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

// ============================================================================
// HOVER EFFECTS
// ============================================================================

@mixin hover-lift($translateY: -2px, $scale: 1.002) {
  transition: vars.transition('normal');

  &:hover {
    transform: translateY($translateY) scale($scale);
    box-shadow: vars.shadow('lg');
  }
}

@mixin hover-glow($color: vars.color('info-blue'), $intensity: 0.3) {
  transition: vars.transition('normal');

  &:hover {
    box-shadow:
      0 0 20px rgba($color, $intensity),
      vars.shadow('glass');
  }
}

@mixin hover-scale($scale: 1.05) {
  transition: vars.transition('normal');

  &:hover {
    transform: scale($scale);
  }
}

// ============================================================================
// BUTTON STYLES
// ============================================================================

@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: vars.spacing('xs');
  padding: vars.spacing('sm') vars.spacing('md');
  border: none;
  border-radius: vars.radius('md');
  font-weight: 600;
  font-family: vars.font-family('sans');
  cursor: pointer;
  transition: vars.transition('normal');
}

@mixin button-gradient($color1, $color2) {
  @include button-base;
  background: linear-gradient(135deg, $color1 0%, $color2 100%);
  color: white;

  &:hover:not([disabled]) {
    transform: translateY(-2px);
    box-shadow: 0 12px 25px rgba($color1, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

// ============================================================================
// FORM STYLES
// ============================================================================

@mixin input-field {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(vars.color('warning-yellow'), 0.4);
  border-radius: vars.radius('md');
  padding: vars.spacing('md');
  color: white;
  font-family: vars.font-family('mono');
  transition: vars.transition('normal');

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(vars.color('warning-yellow'), 0.6);
  }

  &:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: vars.color('warning-yellow');
    box-shadow: 0 0 0 3px rgba(vars.color('warning-yellow'), 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

@mixin media-sm {
  @media (max-width: vars.breakpoint('sm')) {
    @content;
  }
}

@mixin media-md {
  @media (max-width: vars.breakpoint('md')) {
    @content;
  }
}

@mixin media-lg {
  @media (max-width: vars.breakpoint('lg')) {
    @content;
  }
}

@mixin media-xl {
  @media (max-width: vars.breakpoint('xl')) {
    @content;
  }
}

// ============================================================================
// TEXT UTILITIES
// ============================================================================

@mixin text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin text-clamp($min, $ideal, $max) {
  font-size: clamp($min, $ideal, $max);
}

// ============================================================================
// ANIMATIONS
// ============================================================================

@mixin loading-dots {
  &::after {
    content: '';
    display: inline-block;
    width: 0;
    overflow: hidden;
    animation: dotPulse 1.5s infinite step-end;
  }
}

@mixin skeleton-loading {
  background: linear-gradient(
    90deg,
    vars.color('slate-200') 25%,
    vars.color('slate-100') 50%,
    vars.color('slate-200') 75%
  );
  background-size: 200px 100%;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
```

### Uso en Componentes

```scss
// dashboard/dashboard.scss
@use '../../styles/shared/variables' as vars;
@use '../../styles/shared/mixins' as mix;

.converter-card {
  @include mix.glass-card(20px, 0.1);
  @include mix.hover-lift(-4px, 1.02);

  .label {
    color: vars.color('warning-yellow');
    font-family: vars.font-family('sans');
  }

  input {
    @include mix.input-field;
  }

  @include mix.media-md {
    padding: vars.spacing('md');
  }
}
```

**Resultado:** Mixins duplicados → mixins únicos = **100% reducción de duplicación**

---

## 3️⃣ ELIMINAR ANIMACIONES DUPLICADAS

### ❌ ANTES (Definidas en 4 Archivos)

```scss
// dashboard/styles/_animations.scss
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// favoritos/styles/_animations.scss (DUPLICADO)
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// profile/styles/_animations.scss (DUPLICADO)
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// styles/shared/_animations.scss (DUPLICADO)
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Problema:** Mismo keyframe definido 4 veces.

### ✅ DESPUÉS (Centralizado en 1 Archivo)

```scss
// styles/shared/_animations.scss (PUNTO ÚNICO DE VERDAD)
// ============================================================================
// ENTRY ANIMATIONS
// ============================================================================

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// ============================================================================
// PULSE & GLOW EFFECTS
// ============================================================================

@keyframes gemPulse {
  0%,
  100% {
    filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.3));
  }
  50% {
    filter: drop-shadow(0 6px 12px rgba(251, 191, 36, 0.5));
    transform: scale(1.02);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// ============================================================================
// LOADING STATES
// ============================================================================

@keyframes skeletonPulse {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

@keyframes dotPulse {
  0%,
  20% {
    color: rgba(0, 0, 0, 0);
    text-shadow:
      0.25em 0 0 rgba(0, 0, 0, 0),
      0.5em 0 0 rgba(0, 0, 0, 0);
  }
  40% {
    color: rgba(0, 0, 0, 0);
    text-shadow:
      0.25em 0 0 rgba(0, 0, 0, 0.2),
      0.5em 0 0 rgba(0, 0, 0, 0);
  }
  60% {
    text-shadow:
      0.25em 0 0 rgba(0, 0, 0, 0.2),
      0.5em 0 0 rgba(0, 0, 0, 0.2);
  }
  80%,
  100% {
    text-shadow:
      0.25em 0 0 rgba(0, 0, 0, 0.2),
      0.5em 0 0 rgba(0, 0, 0, 0.2);
  }
}

// ============================================================================
// UTILITY CLASSES (APLICAR GLOBALMENTE)
// ============================================================================

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.5s ease-out forwards;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-bounce {
  animation: bounce 2s ease-in-out infinite;
}
```

### Uso en HTML

```html
<!-- Aplicar clases directamente -->
<div class="animate-fade-in">Fade in effect</div>
<div class="animate-bounce">Bouncing element</div>

<!-- O en SCSS -->
<style>
  .my-element {
    animation: fadeIn 0.5s ease-out;
  }
</style>
```

### Importar en styles.scss (Global)

```scss
// styles/styles.scss
@use 'shared/animations'; // Carga una sola vez, disponible en todo
```

**Resultado:** 4 archivos → 1 archivo = **75% reducción de duplicación**

---

## 4️⃣ ESTANDARIZAR BREAKPOINTS

### ❌ ANTES (5 Breakpoints Inconsistentes)

```scss
// En dashboard.converter.scss
@media (max-width: 1200px) { ... }
@media (max-width: 1024px) { ... }
@media (max-width: 968px) { ... }
@media (max-width: 768px) { ... }
@media (max-width: 480px) { ... }

// En login.scss
@media (max-width: 768px) { ... }

// En register.scss
@media (max-width: 480px) { ... }

// En profile.component.scss
@media (max-width: 1024px) { ... }
```

**Problema:** Diferentes breakpoints en diferentes archivos.

### ✅ DESPUÉS (Estandarizado con Mixins)

```scss
// styles/shared/_variables.scss
$breakpoints: (
  'sm': 480px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1200px,
);

// styles/shared/_mixins.scss
@mixin media($breakpoint) {
  $value: map-get($breakpoints, $breakpoint);
  @if $value {
    @media (max-width: $value) {
      @content;
    }
  } @else {
    @warn "Unknown breakpoint: #{$breakpoint}";
  }
}

// Usage in components
@include media('md') {
  padding: 1rem;
}

@include media('lg') {
  grid-template-columns: 1fr 1fr;
}

@include media('xl') {
  gap: 2rem;
}
```

**Resultado:** 5 breakpoints inconsistentes → 4 breakpoints estandarizados

---

## 5️⃣ OPTIMIZAR GLASSMORPHISM PARA MOBILE

### ❌ ANTES (Sin Optimización)

```scss
.glass-card {
  backdrop-filter: blur(20px); // ← GPU intensive en mobile
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    // ← No hay cambios, mismo blur en mobile
    padding: 1rem;
  }
}
```

**Problema:** `blur(20px)` en dispositivos mobile = batería baja, jank.

### ✅ DESPUÉS (Optimizado)

```scss
@use '../../styles/shared/variables' as vars;
@use '../../styles/shared/mixins' as mix;

.glass-card {
  backdrop-filter: blur(20px);
  box-shadow: vars.shadow('glass');
  transition: vars.transition('normal');

  // Reducir blur en tablets
  @include mix.media-lg {
    backdrop-filter: blur(15px);
  }

  // Reducir más en mobile
  @include mix.media-md {
    backdrop-filter: blur(10px);
  }

  // Respetar preferencias de usuario
  @media (prefers-reduced-motion: reduce) {
    backdrop-filter: none;
    animation: none !important;
  }

  // Fallback para navegadores sin soporte
  @supports not (backdrop-filter: blur(10px)) {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

**Resultado:** Performance mejorado en mobile, respeta preferencias de usuario

---

## 📊 RESUMEN DE CAMBIOS

| Tarea        | Antes          | Después          | Reducción | ROI      |
| ------------ | -------------- | ---------------- | --------- | -------- |
| Variables    | 1300 líneas    | 150 líneas       | 88%       | Alto     |
| Mixins       | 450×3          | 500              | 67%       | Alto     |
| Animaciones  | 200×4          | 200              | 75%       | Alto     |
| Breakpoints  | Inconsistentes | 4 estandarizados | ∞         | Moderado |
| Glasmorphism | Sin optimizar  | Optimizado       | -         | Moderado |

**Total Estimado de Esfuerzo:** 26 horas
**Total de Reducción de Duplicación:** 80%+

---

## 🚀 PLAN DE IMPLEMENTACIÓN

```
SEMANA 1
├─ Lunes:   Crear styles/shared/_variables.scss
├─ Martes:  Crear styles/shared/_mixins.scss
├─ Miércoles: Crear styles/shared/_animations.scss
├─ Jueves:  Actualizar dashboard/ para usar shared
└─ Viernes: Testing

SEMANA 2
├─ Lunes:   Actualizar favoritos/
├─ Martes:  Actualizar login/
├─ Miércoles: Actualizar register/
├─ Jueves:  Actualizar profile/
└─ Viernes: Testing + QA

SEMANA 3
├─ Lunes:   Optimizar glasmorphism
├─ Martes:  Agregar @media(prefers-reduced-motion)
├─ Miércoles: Auditar bundle
├─ Jueves:  Documentación
└─ Viernes: Merge a main
```

---

## ✅ CHECKLIST DE VALIDACIÓN

```
□ Variables centralizadas funcionan en todos los componentes
□ Todos los colores usan vars.color()
□ Todos los espacios usan vars.spacing()
□ Todos los breakpoints usan mixins
□ Animaciones cargadas una sola vez
□ No hay ::ng-deep excepto en Material overrides
□ !important reducido a < 50 por archivo
□ Glasmorphism optimizado para mobile
□ Tests pasan
□ Bundle size reducido 20%+
□ Documentación actualizada
```
