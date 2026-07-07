# Orden del Culto — Planificador de Servicios

Aplicación web para planificar los servicios/cultos de la iglesia: orden del culto,
repertorio de canciones y asignación de voluntarios por equipo. Pensada para
correr en un servidor local (una PC o Raspberry Pi de la iglesia) y ser usada
desde cualquier celular, tablet o computadora conectada a la misma red WiFi.

No usa frameworks pesados: solo Node.js y su módulo nativo de SQLite, así que
no requiere conexión a internet para instalarse ni paquetes adicionales.

## Requisitos

- Node.js **versión 22.5 o superior** (incluye el módulo nativo `node:sqlite`).
  Verifica tu versión con: `node --version`

## Instalación y arranque

```bash
cd planificador-iglesia
npm start
```

(No hace falta `npm install`: la app no usa dependencias externas, solo el
núcleo de Node.js.)

Al iniciar verás algo como:

```
============================================
  Planificador de Servicios - Iglesia
============================================
  Local:    http://localhost:3000
  Red:      http://192.168.1.25:3000
============================================
```

- **Desde el mismo servidor:** abre `http://localhost:3000`
- **Desde cualquier celular/tablet/PC en la misma red WiFi:** abre la dirección
  "Red" que se mostró (ej. `http://192.168.1.25:3000`)

### Usuario inicial

- **Usuario:** `admin`
- **Contraseña:** `admin123`

Inicia sesión con esas credenciales y cambia la contraseña desde
"Personas → Editar" lo antes posible.

## Mantener el servidor siempre encendido

Para que la app quede disponible todo el tiempo (no solo mientras tengas la
terminal abierta), instala `pm2`:

```bash
npm install -g pm2
pm2 start server.js --name iglesia
pm2 save
pm2 startup   # sigue las instrucciones para que arranque solo al reiniciar el equipo
```

## Roles de usuario

- **Administrador**: control total (usuarios, equipos, servicios, canciones).
- **Líder**: crea y edita servicios, orden del culto, canciones y asigna voluntarios.
- **Voluntario**: ve sus asignaciones y las confirma o rechaza; ve el repertorio
  y los próximos servicios en modo lectura.

## Estructura del proyecto

```
server.js           servidor HTTP (sirve la API y el frontend)
db.js                esquema de base de datos SQLite + creación de usuario inicial
lib/                 utilidades (sesiones, router, helpers HTTP)
routes/api.js        todos los endpoints de la API
public/              frontend (HTML/CSS/JS, sin build)
data/iglesia.db       archivo de base de datos (se crea automáticamente)
```

## Respaldo de datos

Todo se guarda en un único archivo: `data/iglesia.db`. Para respaldar la
información de la iglesia, simplemente copia ese archivo a otro lugar
(USB, Google Drive, etc.) periódicamente.

## Nota técnica

El servidor está escrito usando **solo el núcleo de Node.js**
(`http`, `node:sqlite`, `crypto`), sin Express ni paquetes externos. Esto
significa cero instalación, cero conexión a internet requerida y menos cosas
que puedan romperse con el tiempo.
