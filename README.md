# 💱 DivisasPro - API Profesional de Conversión de Divisas

> **🚧 PROYECTO EN DESARROLLO ACTIVO** - Aplicación full-stack para gestión profesional de divisas con funcionalidades avanzadas de trading, alertas automáticas y análisis en tiempo real.

[![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow.svg)](https://github.com/tuusuario/divisas-api)
[![Versión](https://img.shields.io/badge/Versión-1.0.0--beta-blue.svg)](https://github.com/tuusuario/divisas-api)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-green.svg)](LICENSE)

---

## 📋 **Resumen del Proyecto**

**DivisasPro** es una aplicación web profesional que permite gestionar conversiones de divisas con funcionalidades empresariales avanzadas. La plataforma está diseñada para traders, empresas y usuarios que necesitan herramientas robustas para el manejo de divisas internacionales.

### **🎯 Características Implementadas**

- ✅ **Sistema de autenticación completo** (registro, login, roles)
- ✅ **Conversor de divisas en tiempo real** (20 divisas globales)
- ✅ **Gestión de favoritos** con actualización automática
- ✅ **Sistema de alertas** (precio, porcentaje, programadas)
- ✅ **Historial completo** con filtros avanzados
- ✅ **Calculadora profesional** (conversiones múltiples)
- ✅ **Dashboard administrativo** con estadísticas
- ✅ **Auditoría completa** (logs de actividad)
- ✅ **Sistema de notificaciones** por email
- ✅ **API RESTful completa** con documentación

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

## 🏗️ **Arquitectura del Sistema**

### **Frontend (Angular 20)**

```typescript
📱 Standalone Components Architecture
🎨 Angular Material Design System
⚡ RxJS para programación reactiva
🔒 Guards y interceptors funcionales
📊 Actualizaciones en tiempo real
🎯 TypeScript con tipado estricto
```

### **Backend (Node.js + Express)**

```javascript
🚀 API RESTful con Express.js
🔐 Autenticación JWT con roles
📊 MongoDB + Mongoose ODM
📧 Sistema de emails (Nodemailer)
⏰ Cron jobs para tareas automáticas
🛡️ Validación y sanitización de datos
```

### **Base de Datos (MongoDB)**

```javascript
👤 Users - Sistema de usuarios y roles
💱 Conversions - Historial completo de conversiones
⭐ Favorites - Pares de divisas favoritos
🔔 Alerts - Alertas automatizadas
📋 ActivityLogs - Auditoría completa
🎯 FavoriteCurrencies - Divisas preferidas
```

---

## 💱 **Divisas Soportadas (20 Globales)**

### **Divisas Principales**

```
🇺🇸 USD - Dólar Estadounidense    🇪🇺 EUR - Euro
🇬🇧 GBP - Libra Esterlina         🇯🇵 JPY - Yen Japonés
🇨🇭 CHF - Franco Suizo            🇨🇦 CAD - Dólar Canadiense
🇦🇺 AUD - Dólar Australiano       🇨🇳 CNY - Yuan Chino
```

### **Mercados Emergentes**

```
🇲🇽 MXN - Peso Mexicano           🇧🇷 BRL - Real Brasileño
🇰🇷 KRW - Won Surcoreano          🇮🇳 INR - Rupia India
🇿🇦 ZAR - Rand Sudafricano        🇹🇷 TRY - Lira Turca
```

### **Divisas Regionales**

```
🇸🇪 SEK - Corona Sueca            🇳🇴 NOK - Corona Noruega
🇭🇰 HKD - Dólar de Hong Kong      🇸🇬 SGD - Dólar de Singapur
🇳🇿 NZD - Dólar Neozelandés       🇵🇱 PLN - Zloty Polaco
```

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
MONGODB_URI=mongodb://localhost:27017/divisas-api
JWT_SECRET=tu_clave_secreta_muy_segura
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
API_URL=https://api.frankfurter.app/latest
```

---

## 📡 **API Endpoints Principales**

### **Autenticación**

```http
POST /api/auth/register     # Registro de usuarios
POST /api/auth/login        # Inicio de sesión
GET  /api/auth/profile      # Perfil del usuario
```

### **Conversiones**

```http
POST /api/convert           # Nueva conversión
GET  /api/historial         # Historial con filtros
DELETE /api/historial/:id   # Eliminar conversión
```

### **Tipos de Cambio**

```http
GET /api/exchange/rates     # Tasas actuales
GET /api/exchange/rates/:base # Tasas base específica
```

### **Favoritos**

```http
GET  /api/favorites         # Obtener favoritos
POST /api/favorites         # Crear favorito
DELETE /api/favorites/:id   # Eliminar favorito
```

### **Alertas**

```http
GET  /api/alerts           # Obtener alertas
POST /api/alerts/percentage # Crear alerta porcentual
POST /api/alerts/target    # Crear alerta objetivo
```

### **Calculadora**

```http
POST /api/calculator/multiple # Conversión múltiple
POST /api/calculator/compare  # Comparación de pares
```

---

## 🧪 **Testing y Calidad**

### **Cobertura de Tests**

- ✅ Tests unitarios para servicios principales
- ✅ Tests de integración para API
- ✅ Cobertura de código documentada
- ✅ Validación de endpoints críticos

### **Scripts de Testing**

```bash
# Backend
cd backend
npm test              # Ejecutar tests
npm run test:coverage # Cobertura de código

# Frontend
cd frontend
ng test               # Tests unitarios
ng e2e                # Tests end-to-end
```

### **Scripts de Mantenimiento**

```bash
# Limpieza manual de datos antiguos
node scripts/test-borrado-antiguo.js

# Cron jobs automáticos:
# - Limpieza diaria: 2:00 AM
# - Verificación de alertas: 8:00 AM
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
- **Cache**: Tipos de cambio cacheados (30 segundos)
- **API Externa**: Frankfurter API (99.9% uptime)

---

## 🚧 **Estado Actual y Roadmap**

### **✅ Completado**

- [x] Sistema de autenticación completo
- [x] Conversor de divisas funcional
- [x] Gestión de favoritos
- [x] Sistema de alertas básico
- [x] Historial con filtros
- [x] API RESTful completa
- [x] Dashboard administrativo
- [x] Sistema de auditoría

### **🔄 En Desarrollo**

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
