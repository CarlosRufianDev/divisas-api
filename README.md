# 📈 Divisas API

API RESTful profesional para gestión de conversiones de divisas, historial de usuario y alertas automáticas de variación de precios, pensada para usuarios de bolsa, criptomonedas y finanzas.

---

## 🚀 Características principales

- **Autenticación JWT** con roles (usuario y administrador)
- **Conversión de divisas** en tiempo real (API Frankfurter)
- **Historial de conversiones** con filtros avanzados y paginación
- **Alertas automáticas** por email sobre variación de monedas
- **Cron jobs** para limpieza automática y envío de alertas
- **Scripts de mantenimiento** y pruebas manuales
- **Código modular y seguro**

---

## 📂 Estructura del proyecto

```
controllers/      # Lógica de negocio (conversión, alertas, auth)
cron/             # Tareas programadas (limpieza, alertas)
middleware/       # Middlewares de autenticación y roles
models/           # Modelos de datos (User, Conversion, Alert)
routes/           # Rutas de la API
scripts/          # Scripts de mantenimiento (ej: borrado manual)
utils/            # Utilidades (filtros, validadores)
validators/       # Validaciones de entrada
test.http         # Pruebas manuales de la API (VS Code)
.env              # Variables de entorno (no subir a GitHub)
README.md         # Este archivo
```

---

## ⚙️ Instalación y configuración

1. **Clona el repositorio:**
   ```sh
   git clone https://github.com/tuusuario/divisas-api.git
   cd divisas-api
   ```

2. **Instala las dependencias:**
   ```sh
   npm install
   ```

3. **Configura las variables de entorno en `.env`:**

   ```
   MONGODB_URI=tu_uri_de_mongodb
   API_URL=https://api.frankfurter.app/latest
   JWT_SECRET=█REDACTED_JWT█
   EMAIL_USER=tu_email@gmail.com
   EMAIL_PASS=tu_contraseña_de_aplicacion
   ```

   > **Nota:** Para `EMAIL_PASS` usa una [contraseña de aplicación de Gmail](https://support.google.com/accounts/answer/185833).

4. **Arranca el servidor:**
   ```sh
   npm run dev
   ```
   El servidor escuchará en `http://localhost:3000`

---

## 🧪 Pruebas manuales

Utiliza el archivo `test.http` (compatible con VS Code y la extensión REST Client) para probar todos los endpoints:

- Registro y login de usuarios y admin
- Conversión de divisas
- Consulta y borrado de historial
- Creación y gestión de alertas
- Pruebas de errores y acceso no autorizado

---

## 🛠️ Scripts de mantenimiento

- **Limpieza automática:**  
  Borra conversiones antiguas (más de 60 días) cada día a las 2:00 AM (cron job).
- **Envío de alertas:**  
  Envía emails diarios a las 8:00 AM con la variación de moneda configurada por el usuario.
- **Script manual:**  
  Ejecuta `node scripts/test-borrado-antiguo.js` para borrar conversiones antiguas manualmente (útil para pruebas y mantenimiento).

---

## ✉️ Alertas de variación de moneda

- Los usuarios pueden crear alertas para recibir por email la variación de un par de monedas cada X días.
- El email es profesional, personalizado y muestra el porcentaje de variación y los valores históricos.
- Puedes personalizar el intervalo de días al crear la alerta.

---

## 🔒 Seguridad y buenas prácticas

- Contraseñas encriptadas con bcrypt.
- JWT para autenticación y autorización.
- Validación de entradas y roles.
- Variables sensibles en `.env` (no subir nunca a GitHub).
- Código modular, comentado y fácil de mantener.

---

## 📈 Ideal para...

- Usuarios de bolsa, criptomonedas y finanzas que necesitan alertas y control de sus conversiones.
- Desarrolladores que buscan un ejemplo profesional de API Node.js con automatización, autenticación y buenas prácticas.

---

## 📑 Créditos y agradecimientos

- [Frankfurter API](https://www.frankfurter.app/) para datos de divisas.
- [Nodemailer](https://nodemailer.com/) para el envío de emails.
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) para la base de datos en la nube.

---

## 📝 Licencia

MIT

---

> **¿Quieres contribuir o sugerir mejoras?**  
> ¡Abre un issue o pull request!