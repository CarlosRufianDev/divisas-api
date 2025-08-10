# 🏦 DivisasPro - Plataforma Profesional de Divisas

> **Aplicación full-stack completa para gestión profesional de divisas con funcionalidades avanzadas de trading, alertas automáticas y análisis en tiempo real.**

---

## 🚀 **Características Principales**

### 💱 **Conversor Avanzado**

- **20 divisas globales** soportadas (USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, MXN, BRL, KRW, INR, SEK, NOK, HKD, SGD, NZD, ZAR, TRY, PLN)
- **Validaciones inteligentes** (previene conversiones EUR→EUR)
- **Selects inteligentes** (no permite divisas duplicadas)
- **Tipos de cambio en tiempo real** via Frankfurter API
- **Tabla interactiva** con 19 pares de divisas actualizados

### 📊 **Historial Profesional**

- **Filtros avanzados** por divisa origen/destino y rangos de cantidad
- **Filtros inteligentes** que previenen combinaciones inválidas
- **Paginación configurable** (5, 10, 20, 50 registros)
- **Gestión completa** (eliminar individual/masivo, repetir conversiones)
- **Búsqueda en tiempo real** con 11+ resultados totales

### ⭐ **Sistema de Favoritos**

- **Gestión de pares favoritos** con dialog avanzado
- **Conversión rápida** entre pares favoritos
- **Auto-actualización** cada 30 segundos
- **Indicadores visuales** de cambios (↑↓ con colores)
- **Analytics integrados** (mejores/peores performers)

### 🔔 **Alertas Automáticas**

- **Alertas programadas** (diarias, semanales)
- **Alertas por porcentaje** de cambio
- **Alertas por precio objetivo**
- **Notificaciones por email** automáticas
- **Cron jobs** para ejecución puntual

### 🔐 **Seguridad Empresarial**

- **Autenticación JWT** con roles (user/admin)
- **Guards avanzados** para rutas protegidas
- **Interceptors automáticos** para tokens
- **Manejo inteligente** de tokens expirados
- **Logout automático** en errores 401

### 📈 **Calculadora Profesional**

- **Conversión múltiple** (1 divisa → varias)
- **Conversión inversa** automática
- **Comparación de pares** en tiempo real
- **Tipos de cambio históricos** por fecha

### 📋 **Auditoría Completa**

- **Logging automático** de todas las acciones
- **Categorización de actividades** (auth, conversiones, alertas, favoritos)
- **Estadísticas de uso** con filtros por periodo
- **Metadata técnica** completa (IP, User-Agent, endpoints)

---

## 🏗️ **Arquitectura Técnica**

### **Frontend (Angular 20)**

```
📱 Standalone Components
🎨 Angular Material Design System
⚡ RxJS Reactive Programming
🔒 Functional Guards & Interceptors
📊 Real-time Data Updates
🎯 TypeScript Full Coverage
```

### **Backend (Node.js + Express)**

```
🚀 RESTful API Architecture
🔐 JWT Authentication System
📊 MongoDB + Mongoose ODM
📧 Automated Email System (Nodemailer)
⏰ Cron Jobs for Background Tasks
🛡️ Input Validation & Sanitization
```

### **Base de Datos (MongoDB)**

```
👤 Users (auth + roles)
💱 Conversions (complete history)
⭐ Favorites (currency pairs)
🔔 Alerts (automated notifications)
📋 ActivityLogs (full auditing)
🎯 FavoriteCurrencies (preferred currencies)
```

---

## ⚙️ **Instalación y Configuración**

### **1. Clonar el Repositorio**

```bash
git clone https://github.com/tuusuario/divisas-api.git
cd divisas-api
```

### **2. Backend Setup**

```bash
cd backend
npm install

# Configurar .env
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET=YOUR_SECURE_JWT_SECRET
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
API_URL=https://api.frankfurter.app/latest

# Iniciar servidor
npm start
# Servidor en http://localhost:3000
```

### **3. Frontend Setup**

```bash
cd frontend
npm install

# Iniciar aplicación
ng serve
# Aplicación en http://localhost:4200
```

---

## 🧪 **Testing y Desarrollo**

### **Endpoints de Prueba**

```http
### Autenticación
POST http://localhost:3000/api/auth/register
POST http://localhost:3000/api/auth/login

### Conversiones
POST http://localhost:3000/api/convert
GET http://localhost:3000/api/historial

### Tipos de Cambio
GET http://localhost:3000/api/exchange/rates?base=USD

### Favoritos
GET http://localhost:3000/api/favorites
POST http://localhost:3000/api/favorites

### Alertas
GET http://localhost:3000/api/alerts
POST http://localhost:3000/api/alerts/percentage

### Calculadora
POST http://localhost:3000/api/calculator/multiple
POST http://localhost:3000/api/calculator/compare
```

### **Scripts de Mantenimiento**

```bash
# Limpieza manual de datos antiguos
node scripts/test-borrado-antiguo.js

# Los cron jobs se ejecutan automáticamente:
# - Limpieza diaria: 2:00 AM
# - Alertas: 8:00 AM
```

---

## 📊 **Divisas Soportadas (20 Globales)**

### **Principales**

```
🇺🇸 USD - Dólar Estadounidense
🇪🇺 EUR - Euro
🇬🇧 GBP - Libra Esterlina
🇯🇵 JPY - Yen Japonés
🇨🇭 CHF - Franco Suizo
🇨🇦 CAD - Dólar Canadiense
🇦🇺 AUD - Dólar Australiano
🇨🇳 CNY - Yuan Chino
```

### **Mercados Emergentes**

```
🇲🇽 MXN - Peso Mexicano
🇧🇷 BRL - Real Brasileño
🇰🇷 KRW - Won Surcoreano
🇮🇳 INR - Rupia India
```

### **Regionales**

```
🇸🇪 SEK - Corona Sueca
🇳🇴 NOK - Corona Noruega
🇭🇰 HKD - Dólar de Hong Kong
🇸🇬 SGD - Dólar de Singapur
🇳🇿 NZD - Dólar Neozelandés
🇿🇦 ZAR - Rand Sudafricano
🇹🇷 TRY - Lira Turca
🇵🇱 PLN - Zloty Polaco
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

## 🛡️ **Seguridad y Buenas Prácticas**

```
✅ Contraseñas encriptadas con BCrypt
✅ JWT con expiración automática
✅ Validación exhaustiva de inputs
✅ Rate limiting en endpoints críticos
✅ Sanitización de datos
✅ Variables sensibles en .env
✅ CORS configurado correctamente
✅ Logging de seguridad automático
```

---

## 🚀 **Próximas Funcionalidades**

```
🔄 Gráficos de tendencias históricas
📈 Dashboard de analytics avanzado
🌍 Más divisas (criptomonedas)
📱 App móvil React Native
🔔 Notificaciones push
🤖 Bot de Telegram/Discord
```

---

## 📈 **Performance**

```
⚡ Frontend: Angular 20 + Standalone Components
⚡ Backend: Node.js con clustering
⚡ Base de datos: MongoDB con índices optimizados
⚡ Cache: Tipos de cambio cacheados (30 segundos)
⚡ API: Frankfurter (99.9% uptime)
```

---

## 🤝 **Contribuciones**

```bash
# Fork del proyecto
# Crear rama feature
git checkout -b feature/nueva-funcionalidad

# Commit con formato conventional
git commit -m "feat: añadir conversión a criptomonedas"

# Push y Pull Request
git push origin feature/nueva-funcionalidad
```

---

## 📝 **Licencia**

MIT License - Ver archivo LICENSE para detalles

---

## 🙏 **Créditos**

- **Frankfurter API** - Datos de divisas en tiempo real
- **Angular Team** - Framework frontend
- **MongoDB** - Base de datos
- **Nodemailer** - Sistema de emails
- **Material Design** - Componentes UI

---

> **🏆 Aplicación desarrollada con fines educativos y profesionales**  
> **⭐ Si te gusta el proyecto, dale una estrella en GitHub!**

---

**Desarrollado con ❤️ por Carlos Tobias Rufian Salmeron**  
**📧 Contacto: carlosrufiandev@gmail.com**  
**🌐 Portfolio: tuportfolio.com**
