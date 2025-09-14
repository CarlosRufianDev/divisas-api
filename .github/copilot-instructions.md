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
const MaterialComponents = [MatButtonModule, MatCardModule, ...];
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

- **Exchange Rates**: Uses Frankfurter API (`https://api.frankfurter.app/`)
- **Rate Limiting**: Auth routes have built-in rate limiting (5 attempts/15min)
- **Error Handling**: All external API calls wrapped in try-catch with fallbacks

### Automated Systems

**Cron Jobs** (loaded only in production via `process.env.NODE_ENV !== 'test'`):

- `alertJob.js`: Scheduled alerts (hourly) + critical alerts (every 15min)
- `cleanupJob.js`: Auto-cleanup of old conversions (daily at 2 AM)

**Email System**: Nodemailer with Gmail transport for alert notifications

```js
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});
```

## 💡 Development Best Practices

### Component Communication

- **Services**: Use RxJS BehaviorSubject for state management
- **Auto-refresh**: Most components implement 30-second intervals with proper cleanup
- **Error Handling**: Interceptor handles 401 (logout) and 403 (access denied) globally

### Styling Conventions

- **SCSS Architecture**: Component-specific stylesheets with mixins in `styles/` folders
- **Material Theming**: Uses Material 3 design system with custom Azure/Blue palette
- **Responsive Design**: Mobile-first approach with glassmorphism effects

### Testing Strategy

- **Backend**: Jest with MongoDB Memory Server for isolated database tests
- **Frontend**: Karma/Jasmine with Angular Testing Library patterns
- **Coverage**: Jest generates coverage reports in `backend/coverage/`

### Environment Configuration

**Required .env variables**:

```env
MONGODB_URI=mongodb://localhost:27017/divisas-api
JWT_SECRET=your_secure_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🚨 Common Gotchas

1. **Currency Pairs**: Always validate against the 20 supported currencies (USD, EUR, GBP, etc.)
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
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
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

Always validate against exactly **20 supported currencies**:
`USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, MXN, BRL, KRW, INR, SEK, NOK, HKD, SGD, NZD, ZAR, TRY, PLN`

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
