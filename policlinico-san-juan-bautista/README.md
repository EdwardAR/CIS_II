# Sistema Web de Gestion de Citas - Policlinico San Juan Bautista

Aplicacion web full-stack para la gestion integral de citas medicas, orientada al flujo real de un policlinico de atencion ambulatoria.

## 1. Introduccion y Objetivos

El proyecto busca resolver, con una arquitectura simple y robusta, el ciclo completo de atencion administrativa en consulta externa:

- Registro y autenticacion de pacientes.
- Gestion de medicos, especialidades y horarios de atencion.
- Reserva de citas con control de disponibilidad real.
- Seguimiento de estados de cita: pendiente, completada, cancelada.
- Visualizacion ejecutiva para personal administrativo.

### Objetivo General

Digitalizar el proceso de citas del Policlinico San Juan Bautista con una interfaz clara y una implementacion facil de desplegar localmente.

### Objetivos Tecnicos

- Mantener baja complejidad operacional (sin infraestructura pesada).
- Aplicar buenas practicas de seguridad web desde el inicio.
- Diseñar modulos desacoplados por dominio de negocio.
- Dejar base lista para evolucion futura (reportes, historia clinica, etc.).

## 2. Stack Tecnologico

- Backend: Node.js + Express
- Renderizado server-side: EJS
- Base de datos: SQLite (archivo local)
- Sesiones: express-session + connect-sqlite3
- Seguridad: helmet, csurf, express-rate-limit
- Validacion de datos: express-validator
- Hash de contrasenas: bcrypt
- Logging: morgan

## 3. Funcionalidades por Rol

### Paciente

- Registro de cuenta (nombre, correo, contrasena, DNI, telefono, datos de contacto).
- Inicio y cierre de sesion.
- Gestion de perfil personal.
- Consulta de medicos disponibles.
- Consulta de disponibilidad por fecha.
- Reserva de cita.
- Visualizacion de historial de citas.
- Cancelacion de citas pendientes.

### Medico

- Inicio y cierre de sesion.
- Panel personal de agenda.
- Visualizacion de citas asignadas.
- Cambio de estado de cita a completada.
- Cancelacion de cita cuando corresponda.

### Administrador (Personal del Policlinico)

- Inicio y cierre de sesion.
- Dashboard con resumen global:
  - Total de citas
  - Pendientes
  - Completadas
  - Canceladas
- Visualizacion de proximas citas.
- Registro de medicos.
- Gestion de horarios por medico.
- Visualizacion global de citas.
- Cambio de estado de citas (completar/cancelar).

## 4. Arquitectura del Proyecto

```text
policlinico-san-juan-bautista/
├─ package.json
├─ .env.example
├─ README.md
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ config/
│  │  ├─ env.js
│  │  ├─ db.js
│  │  └─ session.js
│  ├─ database/
│  │  ├─ schema.sql
│  │  ├─ seed.sql
│  │  └─ init-db.js
│  ├─ middlewares/
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ pacientes/
│  │  ├─ medicos/
│  │  ├─ citas/
│  │  └─ admin/
│  ├─ views/
│  └─ public/
└─ tests/
```

## 5. Modelo de Datos (ERD en texto)

```text
users
- id (PK)
- full_name
- email (UNIQUE)
- password_hash
- role [paciente|medico|admin]
- is_active
- created_at

patients
- id (PK)
- user_id (FK -> users.id, UNIQUE)
- dni (UNIQUE)
- phone
- birth_date
- address
- emergency_contact

doctors
- id (PK)
- user_id (FK -> users.id, UNIQUE)
- specialty
- license_number (UNIQUE)
- office

doctor_schedules
- id (PK)
- doctor_id (FK -> doctors.id)
- day_of_week [0-6]
- start_time
- end_time
- slot_minutes
- is_active

appointments
- id (PK)
- patient_id (FK -> patients.id)
- doctor_id (FK -> doctors.id)
- appointment_date
- start_time
- end_time
- status [pendiente|completada|cancelada]
- reason
- notes
- created_by_user_id (FK -> users.id)
- created_at
- UNIQUE(doctor_id, appointment_date, start_time)
```

## 6. Seguridad Implementada

- Hash de contrasenas con bcrypt.
- Sesiones HTTPOnly con expiracion controlada.
- Almacenamiento de sesiones en SQLite.
- Proteccion CSRF en formularios.
- Validaciones y sanitizacion de entradas con express-validator.
- Helmet para cabeceras de seguridad HTTP.
- Limitador de intentos para autenticacion (rate limit).
- Control de acceso por rol (RBAC) en rutas.

## 7. Instalacion Paso a Paso (Desde Cero)

### Requisitos

- Node.js LTS (recomendado >= 18)
- npm

### Instalacion

1. Clonar o copiar el proyecto al equipo.
1. Abrir terminal en la raiz del proyecto.
1. Instalar dependencias:

```bash
npm install
```

1. Crear archivo de entorno:

```bash
copy .env.example .env
```

1. (Opcional) Editar variables en `.env`:

- `PORT`
- `SESSION_SECRET`
- `DB_PATH`
- `NODE_ENV`

1. Iniciar la aplicacion:

```bash
npm start
```

1. Abrir en navegador:

```text
http://localhost:3000
```

## 8. Credenciales Iniciales

Se crean automaticamente al primer arranque:

- Admin
  - Correo: `admin@policlinico.pe`
  - Contrasena: `Admin123*`
- Medico
  - Correo: `ana.torres@policlinico.pe`
  - Contrasena: `Admin123*`

## 9. Flujo Operativo Recomendado

1. Ingresar como admin.
2. Registrar medicos adicionales.
3. Definir horarios de atencion por medico.
4. Registrar pacientes (o permitir autorregistro).
5. Paciente consulta disponibilidad y reserva cita.
6. Medico/admin actualiza estado de la atencion.
7. Admin monitorea indicadores en panel.

## 10. Instrucciones de Uso por Pantalla

### Login y Registro

- `/auth/login`: autenticacion general por rol.
- `/auth/register`: alta de nuevos pacientes.

### Pacientes

- `/pacientes/perfil`: visualiza y actualiza informacion de contacto.

### Citas

- `/citas`: listado de citas segun rol.
- `/citas/disponibilidad`: consulta de horarios disponibles (paciente/admin).
- Alta de cita con motivo de consulta.
- Botones de completar/cancelar segun permisos.

### Medicos (Admin)

- `/medicos`: alta de medico y listado.
- `/medicos/:doctorId/horarios`: configuracion de turnos por dia.

### Medico (Panel propio)

- `/medicos/mi-panel`: agenda del medico autenticado.

### Administracion

- `/admin`: dashboard global con resumen y proximas citas.

## 11. Buenas Practicas para Produccion

- Cambiar `SESSION_SECRET` por un valor robusto.
- Forzar HTTPS y `secure=true` en cookies.
- Definir politicas de backup para SQLite.
- Implementar auditoria de cambios por usuario.
- Agregar pruebas automatizadas para rutas criticas.
- Separar entornos de desarrollo, QA y produccion.

## 12. Roadmap Sugerido

- Reprogramacion de citas.
- Recordatorios por correo o WhatsApp.
- Reporteria mensual por especialidad.
- Ficha clinica resumida por paciente.
- Exportacion de citas a Excel/PDF.

---

Proyecto diseñado bajo la filosofia: simplicidad potente.
Listo para ejecutar y evolucionar en entorno clinico real.
