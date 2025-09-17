# DivisasPro - AI Coding Guidelines

## 🏗️ Architecture Overview

**Full-stack currency conversion platform** with real-time exchange rates, automated alerts, and professional trading features.

- **Backend**: Node.js/Express API with MongoDB (Mongoose ODM)
- **Frontend**: Angular 20 with standalone components + Angular Material
- **External API**: Frankfurter API for real exchange rates
- **Infrastructure**: JWT auth, automated cron jobs, email notifications

## 🎯 Key Development Patterns

### Backend Architecture

**Route Structure**: All API routes are prefixed with `/api/` and organized by feature:

```js
app.use('/api/auth', require('./routes/auth'));
app.use('/api/convert', require('./routes/convert'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/exchange', require('./routes/exchange'));
app.use('/api/calculator', require('./routes/calculator'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/favorite-currencies', require('./routes/favoriteCurrencies'));
app.use('/api/alert', require('./routes/alert'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/monedas', require('./routes/monedas'));
```

**Authentication Flow**: JWT-based with 2-hour expiration. All protected routes use:

```js
const requireAuth = require('../middleware/authMiddleware');
router.use(requireAuth); // Applies to all routes in this file
```

**Activity Logging**: Automatic user activity tracking via middleware:

```js
const { logConversion } = require('../middleware/activityLogger');
router.post('/convert', requireAuth, logConversion, convertController.convert);
```

**Validation Pattern**: Express-validator with custom middleware:

```js
const {
  registerValidator,
  loginValidator,
} = require('../validators/authValidator');
router.post('/register', registerValidator, handleValidation, register);
```

### Frontend Architecture

**Standalone Components**: All components use Angular 20 standalone architecture:

```ts
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
```

**Functional Guards & Interceptors**: Use new Angular functional approach:

```ts
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => { ... };

// auth.interceptor.ts
export const authInterceptorFn: HttpInterceptorFn = (req, next) => { ... };
```

**Material Module Pattern**: Centralized Material imports via `shared/material.module.ts`:

```ts
const MaterialComponents = [
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatSelectModule,
  MatToolbarModule,
  MatMenuModule,
  MatSnackBarModule,
  MatTableModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatTooltipModule,
  MatDividerModule,
  MatChipsModule,
  MatDialogModule,
  MatRadioModule,
  MatSlideToggleModule,
];
```

### Database Patterns

**Models with Business Logic**: Mongoose schemas include static methods:

```js
activityLogSchema.statics.createLog = function (userId, action, details = {}) {
  return this.create({ user: userId, action, details });
};
```

**Compound Indexes**: Critical for performance on large datasets:

```js
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, action: 1, createdAt: -1 });
```

## 🔄 Critical Workflows

### Development Commands

```cmd
# Backend development (Windows)
cd backend && npm run dev  # Starts nodemon for auto-reload

# Frontend development
cd frontend && ng serve   # Starts dev server on :4200

# Testing
cd backend && npm test    # Jest with MongoDB Memory Server
cd frontend && ng test    # Karma/Jasmine

# Linting (backend only)
cd backend && npm run lint      # Check code style
cd backend && npm run lint:fix  # Auto-fix issues
```

### External API Integration

- **Exchange Rates**: Uses Frankfurter API (`https://api.frankfurter.app/`) via `/api/exchange` routes
- **Currency List**: Dynamic currency fetching via `/api/exchange/currencies` (returns ~40 currencies)
- **Rate Limiting**: Auth routes have built-in rate limiting (5 attempts/15min)
- **Error Handling**: All external API calls wrapped in try-catch with fallbacks

### Automated Systems

**Cron Jobs** (loaded only in production via `process.env.NODE_ENV !== 'test'`):

- `alertJob.js`: Scheduled alerts (hourly) + critical alerts (every 15min)
- `cleanupJob.js`: Auto-cleanup of old conversions (daily at 2 AM)

**Email System**: Nodemailer with flexible SMTP transport for alert notifications

```js
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
```

Email can be disabled via `DISABLE_EMAIL=1` environment variable.

## 💡 Development Best Practices

### Component Communication

- **Services**: Use RxJS BehaviorSubject for state management
- **Auto-refresh**: Most components implement 30-second intervals with proper cleanup
- **Error Handling**: Interceptor handles 401 (logout) and 403 (access denied) globally

### Styling Conventions

- **SCSS Architecture**: Component-specific stylesheets with mixins in `styles/` folders
- **Material Theming**: Uses Material 3 design system with custom Azure/Blue palette
- **Responsive Design**: Mobile-first approach with glassmorphism effects

**Dashboard SCSS Pattern** (applied to historial and will be extended to all sections):

```scss
// Component structure following dashboard pattern
@use './styles/variables' as vars;
@use './styles/mixins' as mix;
@use './styles/animations' as anim;

// Typography imports (consistent across sections)
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

**Key SCSS Variables** (from `styles/_variables.scss`):

```scss
// Color system
$primary-blue: #667eea;
$primary-purple: #764ba2;
$info-blue: #3b82f6;
$warning-yellow: #fbbf24;

// Glassmorphism backgrounds
$glass-white: rgba(255, 255, 255, 0.9);
$glass-dark: rgba(30, 41, 59, 0.6);

// Gradients (header pattern)
$gradient-primary: linear-gradient(
  135deg,
  #0f172a 0%,
  #1e293b 25%,
  #334155 50%,
  #1e293b 75%,
  #0f172a 100%
);

// Spacing system
$spacing-xs: 0.25rem; // 4px
$spacing-sm: 0.5rem; // 8px
$spacing-md: 1rem; // 16px
$spacing-lg: 1.5rem; // 24px
$spacing-xl: 2rem; // 32px
```

**Reusable Mixins** (from `styles/_mixins.scss`):

```scss
// Layout mixins
@mixin flex-center($direction: row, $gap: 0) {
  /* centers content */
}
@mixin glass-card() {
  /* glassmorphism card effect */
}
@mixin hover-lift($translateY: -2px, $scale: 1.002) {
  /* interactive hover */
}

// Button system
@mixin button-base() {
  /* standard button styling */
}
@mixin button-gradient($color1, $color2) {
  /* gradient buttons */
}

// Form inputs
@mixin input-field() {
  /* Material form field styling */
}
```

**Standard Header Pattern** (used in dashboard and historial):

```scss
.section-header {
  background: $gradient-primary;
  color: white;
  padding: 2.5rem 2rem 2rem;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  // Background pattern with radial gradients
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 20% 50%,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    );
    pointer-events: none;
  }
}
```

### Testing Strategy

- **Backend**: Jest with MongoDB Memory Server for isolated database tests
- **Frontend**: Karma/Jasmine with Angular Testing Library patterns
- **Coverage**: Jest generates coverage reports in `backend/coverage/`

**Test Environment Setup** (MongoDB Memory Server):

```js
// tests/setupMongo.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});
```

**Test Command Pattern**:

```cmd
# Backend tests with coverage
cd backend && npm test

# Run specific test file
cd backend && npx jest auth.spec.js

# Frontend tests
cd frontend && ng test
```

### Environment Configuration

**Required .env variables**:

```env
MONGODB_URI=mongodb://localhost:27017/divisas-api
JWT_SECRET=your_secure_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NODE_ENV=development
DISABLE_EMAIL=0
```

## 🚨 Common Gotchas

1. **Currency Pairs**: Always validate against the **40 supported currencies** (dinamically fetched from Frankfurter API via `/api/exchange/currencies`)
2. **JWT Expiration**: Frontend auto-logout on 401 responses via interceptor
3. **Cron Jobs**: Disabled in test environment to prevent side effects
4. **Rate Limits**: Frankfurter API has limits; implement appropriate caching
5. **Activity Logging**: Only logs for authenticated users; non-blocking async operations

## 📦 Key Dependencies

- **Backend**: express, mongoose, bcryptjs, jsonwebtoken, node-cron, nodemailer, axios
- **Frontend**: @angular/core v20, @angular/material, rxjs, @fortawesome/fontawesome-free
- **Testing**: jest, supertest, mongodb-memory-server, karma, jasmine

## 🔧 Development Environment Setup

**Required Environment Variables** (create `.env` in `/backend/`):

```env
MONGODB_URI=mongodb://localhost:27017/divisas-api
JWT_SECRET=your_secure_secret_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password
NODE_ENV=development
DISABLE_EMAIL=0
```

**Windows Development Setup**:

```cmd
# Clone and setup
git clone <repo-url>
cd divisas-api

# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
ng serve
```

**Port Configuration**: Backend runs on `:3000`, Frontend on `:4200`

## 🚨 Critical Project-Specific Patterns

### Supported Currencies

Always validate against exactly **40 supported currencies** (dinamically fetched from Frankfurter API via `/api/exchange/currencies`):
Dynamic list includes: `USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, MXN, BRL, KRW, INR, SEK, NOK, HKD, SGD, NZD, ZAR, TRY, PLN` + 20 more

**Non-authenticated users** only see: `USD, EUR, JPY, GBP, CHF, CAD, AUD, CNY` (LIMITED_CURRENCIES)

### JWT Token Management

- **Expiration**: 2 hours (configurable in auth controller)
- **Auto-logout**: Frontend interceptor handles 401 responses automatically
- **Storage**: localStorage in frontend, sent as `Bearer ${token}` header

### Activity Logging Pattern

All user actions should be logged via middleware:

```js
const { logConversion } = require('../middleware/activityLogger');
router.post('/convert', requireAuth, logConversion, controller.method);
```

### Angular Functional Architecture

- **Guards**: Use `CanActivateFn` functional guards instead of class-based
- **Interceptors**: Use `HttpInterceptorFn` functional interceptors
- **Locale**: Spanish (`es-ES`) configured globally

### Database Performance

Critical compound indexes for large datasets:

```js
// Example from ActivityLog model
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, action: 1, createdAt: -1 });
```

When implementing new features, follow the established patterns: use middleware for cross-cutting concerns, implement proper error handling, add activity logging for user actions, and ensure responsive design with Material components.

## 🎨 SCSS Architecture Guidelines

### Component Style Structure

Each component follows the **Dashboard SCSS Pattern** (already applied in historial):

```scss
// Required structure for all components
Component-name/
  ├── component-name.scss           // Main component styles
  └── styles/                       // Style modules folder
      ├── _variables.scss           // Component-specific variables
      ├── _mixins.scss              // Reusable mixins
      ├── _animations.scss          // Component animations
      └── section-specific.scss     // Additional style modules
```

### Standard Typography Stack

All components must include these font imports:

```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

**Font Usage Guidelines:**

- **Inter**: Main UI text, buttons, labels (modern, clean)
- **Poppins**: Headlines, taglines, marketing text (friendly, rounded)
- **JetBrains Mono**: Code, numbers, technical data (monospace, precise)

### Glassmorphism Design System

**Header Pattern** (consistent across all sections):

```scss
.section-header {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e293b 25%,
    #334155 50%,
    #1e293b 75%,
    #0f172a 100%
  );
  color: white;
  padding: 2.5rem 2rem 2rem;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  // Subtle background pattern
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 20% 50%,
        rgba(59, 130, 246, 0.1) 0%,
        transparent 50%
      ), radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent
          50%);
    pointer-events: none;
  }
}
```

**Card Pattern** (for content sections):

```scss
.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.25), 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}
```

### Animation Standards

**Required animations** (from `_animations.scss`):

```scss
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
```

**Component Entry Animation:**

```scss
.component-container {
  animation: fadeIn 0.3s ease-out;
}
```

### Responsive Design Rules

**Mobile-first breakpoints:**

```scss
// Mixins for responsive design
@mixin mobile-only {
  @media (max-width: 768px) {
    @content;
  }
}
@mixin tablet-up {
  @media (min-width: 769px) {
    @content;
  }
}
@mixin desktop-up {
  @media (min-width: 1024px) {
    @content;
  }
}
```

**Typography scaling with clamp():**

```scss
.main-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  letter-spacing: -0.05em;
}
```

## 🏗️ Dashboard Architecture Deep Dive

### Component File Structure & Interaction

The Dashboard follows a **modular SCSS architecture** with specialized files for different UI sections:

```
dashboard/
├── dashboard.ts           // Main component logic (1124 lines)
├── dashboard.html         // Template with 4 major sections
├── dashboard.scss         // Main styles + imports (1075 lines)
└── styles/
    ├── _variables.scss    // Color system, spacing, gradients
    ├── _mixins.scss       // Reusable layout & styling functions
    ├── _animations.scss   // Keyframe animations & transitions
    ├── dashboard.rates-section.scss    // Exchange rates grid (2589 lines)
    └── dashboard.converter-result.scss // Conversion logic styles
```

### 🔄 Data Flow & Component Interaction

**1. Initialization Chain** (`ngOnInit`):

```typescript
async ngOnInit() {
  // 1. Determine operation mode (authenticated vs limited)
  this.isLimitedMode = !this.authService.isAuthenticated();

  // 2. Load appropriate currency set
  if (this.isLimitedMode) {
    this.limitedCurrencies = LIMITED_CURRENCIES; // 8 currencies
  } else {
    await this.cargarDivisas(); // Dynamic 40 currencies from Frankfurter
  }

  // 3. Load exchange rates + user data
  await this.cargarTiposCambioReales();
  await this.cargarDatosUsuario(); // Analytics & favorites
}
```

**2. Reactive Form System** (Currency/Amount Changes):

```typescript
// Debounced form controls with smart validation
this.monedaOrigen.valueChanges
  .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
  .subscribe(() => this.resetResultado());

// Auto-conversion on amount change
this.cantidad.valueChanges
  .pipe(debounceTime(500), distinctUntilChanged())
  .subscribe(() => this.autoConvert());
```

**3. Real-Time Data Integration**:

```typescript
// Exchange rates from Frankfurter API
async cargarTiposCambioReales() {
  const response = await this.divisasService.getExchangeRates(base);
  this.tiposCambio = this.processRatesWithTrends(response.data.rates);
  this.ultimaActualizacion = this.formatDate(response.data.date);
}

// Market ticker with live updates
cargarTickerRealTime() {
  this.tickerPairs.forEach(async pair => {
    const rate = await this.getLatestRate(pair.from, pair.to);
    this.actualizarTickerItem(pair.pair, rate, trend);
  });
}
```

### 📊 Advanced UI Patterns

**1. Glassmorphism Card System** (`.rates-section-improved`):

```scss
// Multi-layer background with blur effects
background: linear-gradient(
  135deg,
  rgba(30, 41, 59, 0.6) 0%,
  rgba(51, 65, 85, 0.5) 25%,
  rgba(75, 85, 99, 0.4) 50%,
  rgba(55, 65, 81, 0.5) 75%,
  rgba(31, 41, 55, 0.6) 100%
);
backdrop-filter: blur(15px);

// Subtle gradient overlays for depth
&::before {
  background: radial-gradient(
      circle at 20% 50%,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    ), radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent
        50%);
}
```

**2. Responsive Grid System** (Exchange Rates):

```scss
.rates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;

  // Mobile optimization
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

**3. Interactive Rate Cards** with Technical Analysis:

```scss
.rate-card {
  // Glassmorphism with hover effects
  @include glass-card();
  @include hover-lift(-4px, 1.005);

  // Color-coded trends
  &.trend-up {
    border-left: 4px solid #10b981;
  }
  &.trend-down {
    border-left: 4px solid #ef4444;
  }
  &.trend-neutral {
    border-left: 4px solid #6b7280;
  }
}
```

### 🎯 Smart State Management

**1. Loading States Optimization**:

```typescript
private loadingStates = {
  rates: false,
  trends: false,
  analysis: false,
};

// Prevent concurrent API calls
async cargarTiposCambioReales() {
  if (this.loadingStates.rates) return;
  this.loadingStates.rates = true;
  // ... API call logic
  this.loadingStates.rates = false;
}
```

**2. Currency Filtering** (Authenticated Users):

```typescript
this.currencyFilter.valueChanges
  .pipe(debounceTime(300), distinctUntilChanged())
  .subscribe((filterValue) => {
    if (!filterValue.trim()) {
      this.filteredTiposCambio = [...this.tiposCambio];
    } else {
      this.filteredTiposCambio = this.tiposCambio.filter(
        (rate) =>
          this.normalizeText(rate.currency).includes(
            this.normalizeText(filterValue)
          ) ||
          this.normalizeText(rate.name).includes(
            this.normalizeText(filterValue)
          )
      );
    }
  });
```

**3. Modal System** with Premium Features:

```typescript
// Technical analysis modal (authenticated users)
async verDetalle(currencyCode: string) {
  this.selectedCurrency = this.findCurrencyData(currencyCode);
  this.showCurrencyDetail = true;

  if (this.isAuthenticated) {
    await this.cargarAnalisisTecnico(currencyCode);
  }
}

// Premium upgrade modal (non-authenticated)
handleDetalles(currencyCode: string) {
  if (!this.isAuthenticated) {
    this.showPremiumModal = true;
    this.premiumCurrency = currencyCode;
  }
}
```

### 🎨 SCSS Modular System

**1. Variables Architecture** (`_variables.scss`):

```scss
// Systematic color palette with transparency variants
$info-blue: #3b82f6;
$info-blue-03: rgba(59, 130, 246, 0.03);
$info-blue-10: rgba(59, 130, 246, 0.1);
$info-blue-20: rgba(59, 130, 246, 0.2);
// ... up to 60% opacity

// Gradient system for headers
$gradient-primary: linear-gradient(
  135deg,
  #0f172a 0%,
  #1e293b 25%,
  #334155 50%,
  #1e293b 75%,
  #0f172a 100%
);
```

**2. Mixin Library** (`_mixins.scss`):

```scss
@mixin glass-card() {
  background: vars.$glass-white;
  backdrop-filter: blur(10px);
  border-radius: vars.$radius-md;
  box-shadow: vars.$shadow-md;
  border: 1px solid rgba(226, 232, 240, 0.6);
  transition: vars.$transition-normal;
}

@mixin rate-card-trend($color) {
  border-left: 4px solid #{$color};
  background: linear-gradient(
    135deg,
    rgba($color, 0.45) 0%,
    rgba($color, 0.5) 50%,
    rgba($color, 0.4) 100%
  ) !important;
}
```

**3. Animation System** (`_animations.scss`):

```scss
// Staggered component entry
.content-wrapper > * {
  animation: fadeInUp 0.6s ease forwards;

  &:nth-child(1) {
    animation-delay: 0.1s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
  &:nth-child(4) {
    animation-delay: 0.4s;
  }
}
```

### 🔧 Performance Optimizations

**1. Debounced API Calls**:

- Form changes: 300-500ms debounce
- Currency filtering: 300ms debounce
- Base currency changes: 500ms debounce

**2. Smart Data Loading**:

- Concurrent loading prevention with `loadingStates`
- Selective data loading based on authentication
- Cached currency list to avoid repeated API calls

**3. Responsive Design Strategy**:

- Mobile-first approach with progressive enhancement
- `clamp()` for fluid typography scaling
- Grid systems that adapt to screen size
- Touch-optimized interactions on mobile

This architecture demonstrates **enterprise-level patterns**: modular SCSS organization, sophisticated state management, performance optimization, and responsive design that scales from mobile to desktop.
