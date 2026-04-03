# Sistema Web de Gestion de Citas - Policlinico San Juan Bautista

Aplicacion web full-stack para la gestion integral de citas medicas, orientada a un flujo real de policlinico de atencion ambulatoria.

## 1. Objetivo del proyecto

Este sistema digitaliza el proceso de gestion de citas para tres tipos de usuario:

- Paciente
- Medico
- Administrador

Permite registrar usuarios, definir horarios medicos, reservar citas y hacer seguimiento del estado de atencion.

## 2. Stack tecnologico

- Node.js + Express
- EJS (renderizado server-side)
- SQLite (better-sqlite3)
- express-session + connect-sqlite3
- Seguridad: helmet, csurf, express-rate-limit
- Validaciones: express-validator
- Hash de contrasenas: bcrypt
- Logging: morgan

## 3. Estructura del proyecto

```text
CIS-II_-Sistema-Web-de-Gesti-n-de-Citas-en-un-Policlinico-San-Juan-Bautista-/
|- package.json
|- README.md
|- src/
|  |- app.js
|  |- server.js
|  |- config/
|  |  |- env.js
|  |  |- db.js
|  |  |- session.js
|  |- database/
|  |  |- schema.sql
|  |  |- seed.sql
|  |  |- init-db.js
|  |- middlewares/
|  |- modules/
|  |  |- auth/
|  |  |- pacientes/
|  |  |- medicos/
|  |  |- citas/
|  |  |- admin/
|  |- views/
|  |- public/
|- tests/
```

## 4. Requisitos

- Node.js LTS (18 o superior)
- npm

Verificacion rapida:

```bash
node -v
npm -v
```

## 5. Instalacion y ejecucion

Desde la raiz del proyecto:

1. Instalar dependencias.

```bash
npm install
```

2. Crear archivo de entorno.

```bash
copy .env.example .env
```

3. Levantar la aplicacion.

```bash
npm start
```

4. Abrir en navegador.

```text
http://localhost:3000
```

## 6. Scripts disponibles

- `npm start`: inicia el servidor en modo normal.
- `npm run dev`: inicia servidor con watch para desarrollo.
- `npm run db:init`: ejecuta inicializacion de base de datos.

## 7. Variables de entorno

Configuradas en `src/config/env.js`:

- `PORT`: puerto HTTP (default `3000`).
- `SESSION_SECRET`: secreto de sesion (default `change_me_please`).
- `DB_PATH`: ruta de SQLite (default `./src/database/clinic.sqlite`).
- `NODE_ENV`: entorno (`development` o `production`).

Ejemplo recomendado:

```env
PORT=3000
SESSION_SECRET=coloca_un_secreto_largo_y_unico
DB_PATH=./src/database/clinic.sqlite
NODE_ENV=development
```

## 8. Credenciales iniciales

Si no existe el usuario admin, al iniciar se crean cuentas por defecto:

- Admin
  - Correo: `admin@policlinico.pe`
  - Contrasena: `Admin123*`
- Medico
  - Correo: `ana.torres@policlinico.pe`
  - Contrasena: `Admin123*`

## 9. Rutas principales por modulo

### Auth

- `GET /auth/login`
- `POST /auth/login`
- `GET /auth/register`
- `POST /auth/register`
- `POST /auth/logout`

### Citas

- `GET /citas`
- `GET /citas/disponibilidad` (paciente/admin)
- `POST /citas` (paciente)
- `POST /citas/:id/completar` (admin/medico)
- `POST /citas/:id/cancelar` (admin/medico/paciente)

### Medicos

- `GET /medicos/mi-panel` (medico)
- `GET /medicos` (admin)
- `POST /medicos` (admin)
- `GET /medicos/:doctorId/horarios` (admin)
- `POST /medicos/:doctorId/horarios` (admin)

### Admin

- `GET /admin` (admin)

## 10. Seguridad implementada

- Password hashing con bcrypt.
- Sesiones con cookie `httpOnly` y `sameSite=lax`.
- CSRF en formularios.
- Helmet para headers de seguridad.
- Rate-limit de login.
- Control de acceso por rol (RBAC).

## 11. Optimizaciones y recomendaciones

Se incorporaron mejoras de rendimiento y robustez:

- SQLite en modo `WAL` para mejor concurrencia lectura/escritura.
- `busy_timeout` para reducir fallos por bloqueo temporal de DB.
- Consultas de citas preparadas y reutilizadas en servicio.
- Generacion de horarios disponibles optimizada con `Set` (busqueda O(1)).
- Semilla inicial envuelta en transaccion para consistencia.
- Correccion de script `db:init` hacia `src/database/init-db.js`.

Para producción:
- Definir `SESSION_SECRET` fuerte y unico.
- Forzar HTTPS y cookies seguras (`NODE_ENV=production`).
- Respaldar periodicamente archivo SQLite.
- Agregar auditoria de cambios sensibles.
- Incorporar pruebas automatizadas de rutas criticas.

## 12. Roadmap sugerido

- Reprogramacion de citas.
- Recordatorios por correo/WhatsApp.
- Reporteria por especialidad.
- Exportacion de citas (Excel/PDF).

---

Proyecto listo para ejecucion local y evolucion incremental.
