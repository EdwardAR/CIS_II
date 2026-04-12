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

## 5. Como levantar el proyecto (inicio rapido)

Ejecute estos comandos desde la raiz del proyecto (`CIS_II`):

```bash
npm install
npm run db:init
npm start
```

Luego abra en su navegador:

```text
http://localhost:3000
```

### 5.1 Paso a paso

1. Instalar dependencias.

```bash
npm install
```

2. Inicializar base de datos (crea tablas y datos de referencia).

```bash
npm run db:init
```

3. Iniciar servidor.

```bash
npm start
```

4. Verificar que la app responde (opcional).

```bash
curl http://localhost:3000/auth/login
```

### 5.2 Modo desarrollo (reinicio automatico)

```bash
npm run dev
```

Use este modo cuando este haciendo cambios de codigo frecuentes.

### 5.3 Reinicio limpio de la base de datos

Si desea empezar desde cero con datos de prueba:

1. Detenga el servidor (Ctrl + C).
2. Elimine `src/database/clinic.sqlite`.
3. Ejecute nuevamente:

```bash
npm run db:init
```

## 6. Scripts disponibles

- `npm start`: inicia el servidor en modo normal.
- `npm run dev`: inicia servidor con watch para desarrollo.
- `npm run db:init`: ejecuta inicializacion de base de datos y carga datos de referencia idempotentes.

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

## 8. Credenciales y datos de referencia

La inicializacion (`npm run db:init`) crea automaticamente usuarios de demo, medicos por especialidad, horarios y citas de ejemplo.

Contrasena por defecto para todos los usuarios demo: `Admin123*`

### 8.1 Usuario administrador

- Correo: `admin@policlinico.pe`

### 8.2 Medicos de referencia

- `ana.torres@policlinico.pe` - Medicina General
- `carlos.rios@policlinico.pe` - Cardiologia
- `lucia.herrera@policlinico.pe` - Pediatria
- `mateo.salazar@policlinico.pe` - Dermatologia
- `valeria.nunez@policlinico.pe` - Neurologia
- `diego.paredes@policlinico.pe` - Traumatologia
- `sofia.campos@policlinico.pe` - Ginecologia
- `renato.flores@policlinico.pe` - Endocrinologia
- `patricia.leon@policlinico.pe` - Otorrinolaringologia
- `javier.molina@policlinico.pe` - Urologia
- `elisa.romero@policlinico.pe` - Oftalmologia

### 8.3 Pacientes de referencia

- `maria.perez@pacientes.pe`
- `jose.quispe@pacientes.pe`
- `carla.mendoza@pacientes.pe`
- `luis.alvarado@pacientes.pe`
- `rosa.huaman@pacientes.pe`
- `andrea.salinas@pacientes.pe`
- `pedro.caceres@pacientes.pe`
- `daniela.rojas@pacientes.pe`
- `ricardo.vega@pacientes.pe`
- `luciana.soto@pacientes.pe`
- `fernando.aquino@pacientes.pe`

### 8.4 Citas de referencia

Se insertan citas de ejemplo en estado `pendiente` y `completada` para facilitar pruebas del flujo de agenda.

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

Funcionalidad incorporada:

- Filtro por especialidad en la reserva de citas.
- Lista dinamica de medicos segun especialidad seleccionada.

### Medicos

- `GET /medicos/mi-panel` (medico)
- `GET /medicos` (admin)
- `POST /medicos` (admin)
- `GET /medicos/:doctorId/horarios` (admin)
- `POST /medicos/:doctorId/horarios` (admin)

Funcionalidad incorporada:

- Filtro por especialidad en gestion de medicos (vista admin).

### Admin

- `GET /admin` (admin)

## 10. Flujo de uso por rol

### 10.1 Administrador

1. Iniciar sesion con `admin@policlinico.pe`.
2. Entrar a `Panel Admin` para revisar metricas de citas.
3. Ir a `Medicos` para registrar especialistas y horarios.
4. Ir a `Citas` para monitorear estados y completar/cancelar cuando corresponda.

### 10.2 Paciente

1. Registrarse en `/auth/register` o usar un usuario demo.
2. Ir a `Citas`.
3. Seleccionar `especialidad` y luego `medico`.
4. Consultar disponibilidad por fecha y confirmar la cita.

### 10.3 Medico

1. Iniciar sesion con un medico demo.
2. Abrir `Mi panel` (`/medicos/mi-panel`).
3. Revisar citas pendientes y completadas.
4. Marcar citas como completadas o canceladas desde modulo `Citas`.

## 11. Funcionalidades implementadas

- Gestion de usuarios por rol: paciente, medico y administrador.
- Registro y autenticacion con sesiones seguras.
- Registro de medicos y asignacion de horarios.
- Reserva de citas con validacion de disponibilidad.
- Filtros por especialidad:
  - En `Citas` para encontrar medico rapidamente.
  - En `Medicos` para gestion administrativa.
- Saludo contextual por rol con nombre del usuario en las pantallas internas.
- Panel administrativo con metricas y proximas citas.
- Datos de referencia listos para pruebas funcionales.

## 12. Solucion de problemas comunes

### 12.1 Error interno en Medicos despues de actualizar codigo

Si se modifican vistas/controladores mientras el servidor sigue corriendo, puede quedar codigo en memoria y mostrar `Error interno`.

Solucion:

```bash
# detener el servidor en ejecucion (Ctrl + C)
npm start
```

### 12.2 Puerto en uso (EADDRINUSE)

Si aparece `listen EADDRINUSE: address already in use :::3000`, hay otra instancia corriendo.

Opciones:

- Detener la instancia anterior.
- Cambiar temporalmente el puerto:

En PowerShell (Windows):

```powershell
$env:PORT=3001
npm start
```

En CMD (Windows):

```bat
set PORT=3001
npm start
```

En Linux/macOS:

```bash
PORT=3001 npm start
```

### 12.3 No aparecen tablas/datos en SQLite

Ejecutar nuevamente la inicializacion:

```bash
npm run db:init
```

Si desea un reinicio completo, elimine `src/database/clinic.sqlite` y vuelva a inicializar.

## 13. Seguridad implementada

- Password hashing con bcrypt.
- Sesiones con cookie `httpOnly` y `sameSite=lax`.
- CSRF en formularios.
- Helmet para headers de seguridad.
- Rate-limit de login.
- Control de acceso por rol (RBAC).

## 14. Optimizaciones y recomendaciones

Se incorporaron mejoras de rendimiento y robustez:

- SQLite en modo `WAL` para mejor concurrencia lectura/escritura.
- `busy_timeout` para reducir fallos por bloqueo temporal de DB.
- Consultas de citas preparadas y reutilizadas en servicio.
- Generacion de horarios disponibles optimizada con `Set` (busqueda O(1)).
- Semilla inicial envuelta en transaccion para consistencia.
- Script `db:init` ejecutable directamente desde `src/database/init-db.js`.
- Datos de referencia idempotentes (no duplican registros al re-ejecutar).

Para producción:

- Definir `SESSION_SECRET` fuerte y unico.
- Forzar HTTPS y cookies seguras (`NODE_ENV=production`).
- Respaldar periodicamente archivo SQLite.
- Agregar auditoria de cambios sensibles.
- Incorporar pruebas automatizadas de rutas criticas.

## 15. Roadmap sugerido

- Reprogramacion de citas.
- Recordatorios por correo/WhatsApp.
- Reporteria por especialidad.
- Exportacion de citas (Excel/PDF).

---

Proyecto listo para ejecucion local y evolucion incremental.
