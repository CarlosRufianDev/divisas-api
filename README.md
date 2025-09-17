# 💱 DivisasPro - Plataforma Profesional de Conversión de Divisas

> **� PROYECTO EN PRODUCCIÓN** - Aplicación full-stack enterprise para gestión profesional de divisas con funcionalidades avanzadas de trading, alertas automáticas y análisis técnico en tiempo real.

[![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Producci%C3%B3n-brightgreen.svg)](https://github.com/CarlosRufianDev/divisas-api)
[![Versión](https://img.shields.io/badge/Versión-1.0.0-blue.svg)](https://github.com/CarlosRufianDev/divisas-api)
[![Angular](https://img.shields.io/badge/Angular-20.1-red.svg)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green.svg)](https://mongodb.com/)

---

## 📋 **Resumen del Proyecto**

**DivisasPro** es una plataforma web profesional que permite gestionar conversiones de divisas con funcionalidades empresariales avanzadas. Diseñada para traders, empresas y usuarios que requieren herramientas robustas para el manejo de divisas internacionales con análisis técnico y alertas automatizadas.

### **🎯 Características Implementadas**

- ✅ **Sistema de autenticación JWT** (registro, login, gestión de perfiles)
- ✅ **Conversor dinámico ~40 divisas** (Frankfurter API + ExchangeRate API)
- ✅ **Dashboard interactivo** con análisis técnico real
- ✅ **Sistema dual de favoritos** (pares + divisas individuales)
- ✅ **Alertas automatizadas** (programadas, porcentaje, precio objetivo)
- ✅ **Historial avanzado** con filtros inteligentes
- ✅ **Calculadora profesional** (conversiones múltiples, comparaciones)
- ✅ **Análisis técnico completo** (RSI, SMA, volatilidad, recomendaciones IA)
- ✅ **Auditoría completa** (logs de actividad detallados)
- ✅ **Sistema de notificaciones** por email (SMTP configurable)
- ✅ **Cron jobs automatizados** (alertas + limpieza datos)

---

## 🚀 **Características Principales**

### 💱 **Conversor Dinámico Avanzado**

- **~40 divisas globales** dinámicamente cargadas desde Frankfurter API + ExchangeRate API
- **Frankfurter Base**: 31 divisas principales (USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, etc.)
- **Divisas adicionales**: ARS, COP, CLP, PEN, UYU, RUB, EGP, VND, KWD via ExchangeRate API
- **Modo limitado**: 8 divisas principales para usuarios no autenticados
- **Validaciones inteligentes** (previene conversiones EUR→EUR, manejo de pares duplicados)
- **Tipos de cambio en tiempo real** con actualización automática
- **Market ticker** con tendencias visuales (↑↓ con colores dinámicos)

### 📊 **Dashboard Profesional con Análisis Técnico**

- **4 secciones principales**: Conversor, Estadísticas, Favoritos, Rates Grid
- **Análisis técnico real**: RSI, SMA, volatilidad calculada
- **Recomendaciones IA**: Comprar/Vender/Mantener con nivel de confianza
- **Filtrado inteligente** de divisas para usuarios registrados
- **Glassmorphism UI** con efectos visuales avanzados
- **Responsive design** móvil-first con Angular Material 20

### 📈 **Sistema Dual de Favoritos**

- **Pares favoritos**: Gestión EUR/USD, GBP/USD con nicknames personalizados
- **Divisas favoritas**: Seguimiento individual USD, EUR con prioridades
- **Auto-actualización** cada 30 segundos con indicadores visuales
- **Analytics integrados**: Top performers, trending pairs
- **Conversión rápida** desde favoritos con un click

### 🔔 **Alertas Automatizadas Avanzadas**

- **Alertas programadas**: Cada X días a hora específica
- **Alertas por porcentaje**: ±X% cambio desde baseline
- **Alertas por precio objetivo**: Mayor/menor que valor target
- **Notificaciones email**: SMTP configurable (Gmail, Outlook, custom)
- **Cron jobs**: Hourly scheduled + 15-min critical alerts
- **Test de alertas**: Envío inmediato para verificar configuración

### 📊 **Historial Inteligente**

- **Filtros avanzados**: Por divisa origen/destino, rangos de cantidad
- **Filtros inteligentes**: Previenen combinaciones inválidas
- **Paginación dinámica**: 5, 10, 20, 50 registros por página
- **Gestión completa**: Eliminar individual/masivo, repetir conversiones
- **Búsqueda en tiempo real** con resultados instantáneos

### 🧮 **Calculadora Profesional Premium**

- **Conversión múltiple**: 1 divisa → múltiples destinos simultáneamente
- **Conversión inversa**: Automática con cálculos bidireccionales
- **Comparación de pares**: Side-by-side rate comparison
- **Análisis histórico**: Tendencias de X días con gráficos
- **Solo usuarios registrados**: Feature premium con validación

### � **Seguridad Enterprise**

- **JWT Authentication**: Tokens de 2 horas con auto-refresh
- **Functional Guards**: Angular 20 CanActivateFn
- **Interceptors automáticos**: Token injection + error handling
- **Auto-logout**: En tokens expirados (401) y acceso denegado (403)
- **Activity logging**: Tracking completo de acciones del usuario
- **Rate limiting**: 5 intentos login/15 minutos por IP

### 📋 **Sistema de Auditoría Completa**

- **Activity Logs**: 20+ tipos de acciones tracked
- **Filtros temporales**: Por días, acciones específicas
- **Estadísticas de uso**: Dashboards de actividad del usuario
- **Performance tracking**: Top pairs, volume de conversiones
- **Error logging**: Captura de errores con contexto detallado

---

---

## 🏗️ **Arquitectura del Sistema**

### **Frontend (Angular 20)**

```typescript
📱 Standalone Components Architecture (Angular 20)
🎨 Angular Material 20.1 Design System
⚡ RxJS 7.8 para programación reactiva
🔒 Functional Guards y Interceptors (CanActivateFn)
📊 Dashboard con análisis técnico en tiempo real
🎯 TypeScript 5.8 con tipado estricto
🎨 Glassmorphism UI con efectos visuales avanzados
```

### **Backend (Node.js + Express)**

```javascript
🚀 API RESTful con Express.js 4.19
🔐 JWT Authentication con tokens 2h (jsonwebtoken 9.0)
📊 MongoDB 7.6 + Mongoose ODM
📧 Sistema SMTP configurable (Nodemailer 7.0)
⏰ Cron jobs automatizados (node-cron 3.0)
🛡️ Validación y sanitización (express-validator 7.2)
📈 Rate limiting 5 intentos/15min
```

### **Base de Datos (MongoDB)**

```javascript
👤 Users - Sistema de usuarios y autenticación JWT
💱 Conversions - Historial completo con filtros avanzados
⭐ Favorites - Pares de divisas favoritos con nicknames
🎯 FavoriteCurrencies - Divisas individuales preferidas
🔔 Alerts - Sistema de alertas (programadas/porcentaje/objetivo)
📋 ActivityLogs - Auditoría completa (20+ tipos de acciones)
```

### **APIs Externas**

```javascript
🏛️ Frankfurter API - 31 divisas base (EUR, USD, GBP, etc.)
🚀 ExchangeRate API - 9 divisas adicionales (ARS, COP, CLP, etc.)
📊 Análisis técnico - RSI, SMA, volatilidad calculada
📈 Tendencias históricas - Hasta 30 días de datos
```

---

## 💱 **Divisas Soportadas (~40 Dinámicas)**

El sistema carga **dinámicamente** las divisas disponibles desde múltiples fuentes:

### **🏛️ Frankfurter API (Base: ~31 divisas)**

```
🇺🇸 USD - Dólar Estadounidense    🇪🇺 EUR - Euro Europeo
🇬🇧 GBP - Libra Esterlina         🇯🇵 JPY - Yen Japonés
🇨🇭 CHF - Franco Suizo            🇨🇦 CAD - Dólar Canadiense
🇦🇺 AUD - Dólar Australiano       🇨🇳 CNY - Yuan Chino
```

### **🌎 Mercados Emergentes (Frankfurter)**

```
🇲🇽 MXN - Peso Mexicano           🇧🇷 BRL - Real Brasileño
🇰🇷 KRW - Won Surcoreano          🇮🇳 INR - Rupia India
🇿🇦 ZAR - Rand Sudafricano        🇹🇷 TRY - Lira Turca
🇸🇪 SEK - Corona Sueca            🇳🇴 NOK - Corona Noruega
🇭🇰 HKD - Dólar de Hong Kong      🇸🇬 SGD - Dólar de Singapur
🇳🇿 NZD - Dólar Neozelandés       🇵🇱 PLN - Zloty Polaco
```

### **🚀 ExchangeRate API (Adicionales: 9 divisas)**

```
🇦🇷 ARS - Peso Argentino          🇨🇴 COP - Peso Colombiano
🇨🇱 CLP - Peso Chileno            🇵🇪 PEN - Sol Peruano
🇺🇾 UYU - Peso Uruguayo           🇷🇺 RUB - Rublo Ruso
🇪🇬 EGP - Libra Egipcia           🇻🇳 VND - Dong Vietnamita
🇰🇼 KWD - Dinar Kuwaití
```

### **⚡ Modo de Acceso**

- **👤 Usuarios no autenticados**: Solo 8 divisas principales (USD, EUR, JPY, GBP, CHF, CAD, AUD, CNY)
- **🔐 Usuarios autenticados**: ~40 divisas completas con todas las funcionalidades

---

## ⚙️ **Instalación y Configuración**

### **Prerrequisitos**

- Node.js 18+
- MongoDB 5.0+
- Angular CLI 20+

### **1. Clonar el Repositorio**

```bash
git clone https://github.com/tuusuario/divisas-api.git
cd divisas-api
```

### **2. Configurar Backend**

```bash
cd backend
npm install

# Crear archivo .env basado en .env.example
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
# Servidor en http://localhost:3000
```

### **3. Configurar Frontend**

```bash
cd frontend
npm install

# Iniciar aplicación
ng serve
# Aplicación en http://localhost:4200
```

### **4. Variables de Entorno Requeridas**

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/divisas-api

# Autenticación
JWT_SECRET=tu_secreto_super_seguro_aqui

# Email SMTP (configurable para Gmail, Outlook, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_app_gmail

# Configuración opcional
NODE_ENV=development
DISABLE_EMAIL=0
```

---

## 📡 **API Endpoints Principales**

### **🔐 Autenticación**

```http
POST /api/auth/register     # Registro de usuarios
POST /api/auth/login        # Login con JWT (2h válido)
DELETE /api/auth/me         # Eliminar cuenta propia
```

### **💱 Conversión**

```http
POST /api/convert/convert   # Conversión individual
GET  /api/convert/rates     # Obtener todos los tipos de cambio
GET  /api/convert/historial # Historial del usuario
GET  /api/convert/currencies # Lista de divisas estática (20)
```

### **🌍 Exchange (Dinámico)**

```http
GET /api/exchange/rates      # Tipos de cambio dinámicos (~31)
GET /api/exchange/currencies # Lista divisas dinámicas Frankfurter
```

### **⭐ Favoritos (Sistema Dual)**

```http
# Pares favoritos (EUR/USD, etc.)
GET  /api/favorites         # Listar pares favoritos
POST /api/favorites         # Añadir par favorito
PUT  /api/favorites/:id     # Actualizar nickname
DELETE /api/favorites/:id   # Eliminar par

# Divisas favoritas individuales
GET  /api/favorite-currencies      # Listar divisas favoritas
POST /api/favorite-currencies      # Añadir divisa favorita
PUT  /api/favorite-currencies/:id  # Actualizar prioridad
```

### **🔔 Alertas Automatizadas**

```http
GET  /api/alerts                 # Listar alertas del usuario
POST /api/alerts/scheduled       # Crear alerta programada
POST /api/alerts/percentage      # Crear alerta por porcentaje
POST /api/alerts/target          # Crear alerta precio objetivo
POST /api/alerts/:id/test        # Enviar test inmediato
DELETE /api/alerts/:id           # Eliminar alerta
```

### **🧮 Calculadora Premium**

```http
POST /api/calculator/multiple       # Conversión múltiple
POST /api/calculator/reverse        # Conversión inversa
POST /api/calculator/compare        # Comparar pares
POST /api/calculator/historical     # Análisis histórico
POST /api/calculator/technical-analysis # Análisis técnico IA
```

### **📊 Dashboard & Analytics**

```http
GET /api/dashboard           # Datos principales del dashboard
GET /api/dashboard/stats     # Estadísticas del usuario
GET /api/dashboard/trends    # Tendencias de favoritos
```

### **📋 Auditoría**

```http
GET /api/activity-logs       # Logs de actividad con filtros
GET /api/activity-logs/stats # Estadísticas de uso
GET /api/activity-logs/actions # Tipos de acciones disponibles
```

### **👤 Perfil**

```http
GET  /api/profile               # Datos del perfil
PUT  /api/profile/change-password  # Cambiar contraseña
PUT  /api/profile/change-email     # Cambiar email
PUT  /api/profile/change-username  # Cambiar nombre usuario
```

---

## 🧪 **Testing y Desarrollo**

### **🔧 Scripts de Desarrollo**

```bash
# Backend (Puerto 3000)
cd backend
npm run dev              # Desarrollo con nodemon
npm start               # Producción
npm test                # Tests con Jest + MongoDB Memory Server
npm run lint            # ESLint verificación
npm run lint:fix        # ESLint auto-fix

# Frontend (Puerto 4200)
cd frontend
ng serve                # Desarrollo
ng build                # Build producción
ng test                 # Tests con Karma/Jasmine
```

### **📊 Cobertura de Tests**

- ✅ **Backend**: Jest con MongoDB Memory Server para aislamiento
- ✅ **Frontend**: Karma/Jasmine con Angular Testing Library
- ✅ **Cobertura**: Reportes automáticos en `backend/coverage/`
- ✅ **CI/CD Ready**: Tests ejecutables en pipelines

### **🔍 Testing Backend Pattern**

```javascript
// Patrón de setup para tests (setupMongo.js)
const { MongoMemoryServer } = require('mongodb-memory-server');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
});
```

### **⚙️ Scripts de Mantenimiento**

```bash
# Limpieza manual de datos antiguos (>60 días)
node backend/scripts/test-borrado-antiguo.js

# Cron jobs automáticos en producción:
# - Limpieza diaria: 2:00 AM (cleanupJob.js)
# - Alertas programadas: cada hora (alertJob.js)
# - Alertas críticas: cada 15 minutos
```

---

## 🎯 **Casos de Uso Profesionales**

### **Para Traders**

- Monitoreo de pares favoritos en tiempo real
- Alertas automáticas por precio objetivo
- Historial completo para análisis
- Calculadora para operaciones múltiples

### **Para Empresas**

- Conversiones masivas para importaciones/exportaciones
- Alertas de variación para cobertura de riesgos
- Auditoría completa de operaciones
- Sistema de roles para equipos

### **Para Viajeros**

- Conversiones rápidas de divisas
- Favoritos para destinos frecuentes
- Historial de gastos por país
- Alertas para mejores tipos de cambio

---

## 🛡️ **Seguridad Implementada**

```
✅ Contraseñas encriptadas con BCrypt (10 rounds)
✅ JWT con expiración automática (24h)
✅ Validación exhaustiva de inputs
✅ Sanitización de datos
✅ Variables sensibles en .env
✅ CORS configurado correctamente
✅ Rate limiting en endpoints críticos
✅ Logging de seguridad automático
✅ Middleware de autenticación robusto
```

---

## 📈 **Performance y Optimización**

- **Frontend**: Angular 20 con Standalone Components
- **Backend**: Node.js con clustering habilitado
- **Base de datos**: MongoDB con índices optimizados

## 🚀 **Características Técnicas Destacadas**

### **⚡ Performance & Escalabilidad**

- **Debounced API calls**: 300-500ms para evitar spam de requests
- **Smart caching**: Prevención de llamadas concurrentes duplicadas
- **Compound indexes**: Optimización MongoDB para grandes datasets
- **Rate limiting**: 5 intentos login/15min por IP
- **Auto-cleanup**: Datos antiguos eliminados automáticamente (60+ días)

### **🎨 UX/UI Avanzado**

- **Glassmorphism Design**: Efectos visuales modernos con blur/gradients
- **Responsive Mobile-First**: Optimizado para todos los dispositivos
- **Material 3 Design**: Sistema de diseño consistente
- **Staggered Animations**: Animaciones secuenciales de entrada
- **Live Indicators**: Tendencias visuales (↑↓) con colores dinámicos

### **🔒 Seguridad Enterprise**

- **JWT 2h expiration**: Tokens automáticamente renovables
- **Functional Guards**: Protección de rutas con Angular 20
- **SMTP Configurable**: Soporte Gmail, Outlook, servidores custom
- **Input Validation**: Express-validator en todas las entradas
- **Error Handling**: Captura global con logging detallado

### **📊 Business Intelligence**

- **20+ Activity Types**: Tracking granular de acciones usuario
- **Real Technical Analysis**: RSI, SMA, volatilidad con datos reales
- **AI Recommendations**: Sugerencias Comprar/Vender/Mantener
- **Performance Analytics**: Top pairs, volume trends, user patterns
- **Historical Data**: Hasta 30 días de análisis técnico

---

## � **Comandos Desarrollo Rápido**

### **🚀 Inicio Rápido (Windows)**

```cmd
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && ng serve

# URLs de acceso:
# Frontend: http://localhost:4200
# Backend API: http://localhost:3000
# Health Check: http://localhost:3000/health
```

### **📦 Dependencias Clave**

```json
{
  "backend": {
    "express": "4.19.2",
    "mongoose": "7.6.0",
    "jsonwebtoken": "9.0.2",
    "nodemailer": "7.0.5",
    "axios": "1.10.0",
    "node-cron": "3.0.3"
  },
  "frontend": {
    "@angular/core": "20.1.0",
    "@angular/material": "20.1.5",
    "rxjs": "7.8.0",
    "typescript": "5.8.2"
  }
}
```

---

## 🌟 **Estado del Proyecto**

### **✅ Funcionalidades en Producción**

- [x] **Sistema de autenticación JWT** completo con roles
- [x] **Conversor dinámico ~40 divisas** (Frankfurter + ExchangeRate APIs)
- [x] **Dashboard profesional** con análisis técnico IA
- [x] **Sistema dual de favoritos** (pares + divisas individuales)
- [x] **Alertas automatizadas** (programadas/porcentaje/objetivo)
- [x] **Historial inteligente** con filtros avanzados
- [x] **Calculadora premium** (multi-conversión, análisis histórico)
- [x] **Auditoría completa** (20+ tipos de activity logs)
- [x] **Cron jobs** automatizados (alertas + limpieza)
- [x] **SMTP configurable** para notificaciones
- [x] **Tests unitarios** con MongoDB Memory Server

### **🎯 Arquitectura Enterprise Ready**

- **Backend**: Node.js + Express + MongoDB (escalable horizontalmente)
- **Frontend**: Angular 20 standalone + Material 3 (PWA ready)
- **APIs**: Rate limiting, validation, error handling enterprise
- **Database**: Compound indexes, cleanup automático, optimización queries
- **Security**: JWT 2h, functional guards, input validation, CORS
- **Monitoring**: Activity logs, performance tracking, error capturing

---

## 👨‍💻 **Sobre el Desarrollo**

**DivisasPro** ha sido desarrollado siguiendo **best practices** de la industria:

- **Clean Architecture**: Separación clara frontend/backend con APIs RESTful
- **Modern Stack**: Angular 20 + Node.js con las últimas funcionalidades
- **Security First**: JWT authentication, input validation, rate limiting
- **Performance Optimized**: Debouncing, caching, database optimization
- **Enterprise Ready**: Activity logging, automated cleanup, error handling
- **Mobile First**: Responsive design con glassmorphism effects

### **� Deployment Ready**

- Variables de entorno configurables
- Health check endpoints
- Error handling robusto
- Logs estructurados
- Tests automatizados
- Docker compatibility preparado

---

**💡 DivisasPro - La plataforma profesional de divisas que combina tecnología moderna con análisis financiero avanzado.**

- [ ] Optimización de performance
- [ ] Mejoras en la UI/UX
- [ ] Tests adicionales
- [ ] Documentación extendida
- [ ] Refactoring de componentes

### **📋 Próximas Funcionalidades**

- [ ] Gráficos de tendencias históricas
- [ ] Dashboard de analytics avanzado
- [ ] Soporte para criptomonedas
- [ ] Aplicación móvil
- [ ] Notificaciones push
- [ ] Bot de Telegram/Discord
- [ ] Modo offline
- [ ] Exportación de datos (CSV, PDF)

---

## 🤝 **Contribuciones**

> **⚠️ Nota**: Este proyecto está en desarrollo activo. Las contribuciones son bienvenidas pero ten en cuenta que la estructura puede cambiar.

```bash
# Fork del proyecto
git fork https://github.com/tuusuario/divisas-api

# Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# Seguir conventional commits
git commit -m "feat: añadir nueva funcionalidad"

# Push y Pull Request
git push origin feature/nueva-funcionalidad
```

---

## 📞 **Soporte y Contacto**

- **📧 Email**: carlosrufiandev@gmail.com
- **🐛 Issues**: [GitHub Issues](https://github.com/tuusuario/divisas-api/issues)
- **📖 Documentación**: En desarrollo
- **💬 Discusiones**: [GitHub Discussions](https://github.com/tuusuario/divisas-api/discussions)

---

## 🙏 **Créditos**

- **Frankfurter API** - Datos de divisas en tiempo real
- **Angular Team** - Framework frontend
- **MongoDB** - Base de datos
- **Nodemailer** - Sistema de emails
- **Material Design** - Componentes UI

---

## 📝 **Licencia**

MIT License - Ver archivo [LICENSE](LICENSE) para más detalles.

---

> **⚠️ AVISO IMPORTANTE**: Esta aplicación está en desarrollo activo. Algunas funcionalidades pueden estar incompletas o sujetas a cambios. No recomendado para uso en producción sin testing exhaustivo.

---

**🏆 Desarrollado con ❤️ por Carlos Tobias Rufian Salmeron**  
**⭐ Si te gusta el proyecto, ¡dale una estrella en GitHub!**

---

_Última actualización: Septiembre 2025_
