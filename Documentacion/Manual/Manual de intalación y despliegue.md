---
title: "Manual de Instalación y Despliegue"
subtitle: "MyGuest v2.0 — Sistema de Gestión Logística"
authors: "Camilo Alarcón, Nibaldo Araya, Diego Benavides y Claudio Molina"
date: "Junio 2026"
---

# Manual de Instalación y Despliegue — MyGuest v2.0

## 1. Descripción General del Proyecto

**MyGuest v2.0** es un sistema de gestión logística desarrollado para la Carrera de Gastronomía de DuocUC. Permite administrar inventario, proveedores, facturación, programación académica de talleres, compras, mermas, devoluciones, recetario y reportes, todo desde una plataforma web centralizada.

| Ítem | Detalle |
|---|---|
| Repositorio | https://github.com/Cirawx/Myguest |
| Backend | FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL |
| Frontend | React + Vite + Zustand |
| Base de datos (producción) | Supabase (PostgreSQL gestionado) |
| Base de datos (local) | PostgreSQL 16 vía Docker |
| Hosting backend | Railway |
| Hosting frontend | Vercel |

---

## 2. Stack Tecnológico

### Backend

| Tecnología | Uso |
|---|---|
| Python 3.11 | Lenguaje base |
| FastAPI | Framework de API REST |
| SQLAlchemy 2.0 (async) | ORM |
| asyncpg | Driver PostgreSQL asíncrono |
| Pydantic v2 | Validación de datos |
| python-jose | Generación y validación de JWT |
| passlib + bcrypt | Hash de contraseñas |
| google-generativeai | Extracción IA de facturas (Gemini) |
| pytesseract | OCR como respaldo de Gemini |
| sib-api-v3-sdk | Envío de correos (Brevo) para recuperación de contraseña |

### Frontend

| Tecnología | Uso |
|---|---|
| React 18 | Librería de interfaz |
| Vite | Bundler y servidor de desarrollo |
| React Router | Enrutamiento |
| Zustand | Manejo de estado global (auth, tema) |
| Axios / fetch | Consumo de la API |
| Recharts | Gráficos del dashboard |
| SheetJS (xlsx) | Exportación de reportes a Excel |

---

## 3. Requisitos Mínimos de Hardware

| Componente | Mínimo | Recomendado |
|---|---|---|
| Procesador | Dual-core 2.0 GHz | Quad-core 2.5 GHz o superior |
| Memoria RAM | 8 GB | 16 GB |
| Almacenamiento disponible | 5 GB libres | 10 GB libres |
| Conexión a internet | Requerida (para dependencias, Docker images y despliegue) | Banda ancha estable |
| Sistema operativo | Windows 10/11, macOS o Linux | Windows 10/11 64-bit |

> Docker Desktop y la ejecución simultánea de backend + frontend + base de datos consumen RAM de forma constante; con 8 GB el equipo puede sentirse lento al tener además el navegador y el editor de código abiertos. Se recomienda 16 GB para una experiencia de desarrollo fluida.

---

## 4. Requisitos Previos de Software

Antes de instalar el proyecto, el equipo debe tener instalado:

| Herramienta | Versión mínima | Enlace de descarga |
|---|---|---|
| Git | Cualquiera reciente | https://git-scm.com/downloads |
| Python | 3.11 (exacto) | https://www.python.org/downloads/release/python-3119/ |
| Node.js | 18 o superior | https://nodejs.org/ |
| Docker Desktop | Cualquiera reciente | https://www.docker.com/products/docker-desktop/ |

> **Importante:** la versión de Python debe ser exactamente **3.11**. Versiones más nuevas (3.12+) pueden causar incompatibilidades con `bcrypt` y `passlib`.

### Instalación de Python 3.11 en Windows

Durante la instalación del instalador de Python, marcar:

- ☑️ **Add Python to PATH**
- ☑️ **Disable path length limit** (al final del instalador)

Alternativamente, con `winget`:

```cmd
winget install Python.Python.3.11
```

Verificar la instalación:

```cmd
py -3.11 --version
```

---

## 5. Clonar el Repositorio

```cmd
git clone https://github.com/Cirawx/Myguest.git
cd Myguest
```

Estructura principal del repositorio:

```
Myguest/
├── Producto/
│   ├── Myguest-main/          ← Backend (FastAPI)
│   └── Myguest_front_main/    ← Frontend (React)
├── BBDD/                       ← Scripts SQL
└── Documentacion/              ← Actas y documentación
```

---

## 6. Configuración de la Base de Datos Local (Docker)

### 6.1 Crear el contenedor PostgreSQL

Con Docker Desktop abierto y corriendo, ejecutar:

```cmd
docker run -d --name postgres_talleres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 -e POSTGRES_DB=talleres -p 5432:5432 -v postgres_talleres_data:/var/lib/postgresql/data postgres:16
```

### 6.2 Verificar que el contenedor está corriendo

```cmd
docker ps
```

Debe aparecer algo similar a:

```
CONTAINER ID   IMAGE         PORTS                    NAMES
xxxxxxxxxxxx   postgres:16   0.0.0.0:5432->5432/tcp   postgres_talleres
```

> **Importante:** Si en la columna `PORTS` no aparece `0.0.0.0:5432->5432/tcp`, el puerto no está mapeado correctamente y el backend no podrá conectarse.

### 6.3 Datos de conexión local

| Parámetro | Valor |
|---|---|
| Host | localhost |
| Puerto | 5432 |
| Base de datos | talleres |
| Usuario | admin |
| Password | admin123 |

### 6.4 Ejecutar los scripts SQL

Los scripts de creación de esquema y carga de datos se encuentran en la carpeta `BBDD/` del repositorio (numerados en orden de ejecución). Ejecutarlos en orden ascendente usando la CLI de Docker:

```cmd
docker exec -i postgres_talleres psql -U admin -d talleres < "BBDD/01 - Creacion del esquema.sql"
docker exec -i postgres_talleres psql -U admin -d talleres < "BBDD/02 - Datos iniciales.sql"
docker exec -i postgres_talleres psql -U admin -d talleres < "BBDD/03 - Carga usuario.sql"
```

> Repetir para cada script numerado en la carpeta, en orden.

### 6.5 Usuario administrador de prueba

| Campo | Valor |
|---|---|
| Login | admin@duoc.cl |
| Password | admin@duoc.cl |
| Perfil | Administrador TI (cod_perfil = 0) |

> La contraseña inicial de cada usuario cargado por el script corresponde a su propio login.

---

## 7. Configuración y Levantamiento del Backend

### 7.1 Variables de entorno

Crear un archivo `.env` dentro de `Producto/Myguest-main/` con el siguiente contenido:

```env
DATABASE_URL=postgresql+asyncpg://admin:admin123@localhost:5432/talleres
SUPABASE_URL=
SUPABASE_KEY=
SECRET_KEY=clave-super-secreta-desarrollo-local-32x
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_ENV=development
APP_NAME=Sistema Gastronomia
GEMINI_API_KEY=
BREVO_API_KEY=
```

> Las variables `SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY` y `BREVO_API_KEY` son necesarias solo si se van a probar los módulos de Ingesta Inteligente (OCR + IA) y recuperación de contraseña por correo. Solicitarlas al equipo de backend si se requieren.

> El archivo `.env` está protegido por `.gitignore` y **nunca** debe subirse al repositorio.

### 7.2 Instalar dependencias

```cmd
cd "Producto\Myguest-main"
pip install -r requirements.txt
```

Si aparece un error relacionado con `bcrypt` o `passlib`:

```cmd
pip uninstall bcrypt passlib -y
pip install bcrypt==4.0.1 passlib==1.7.4
```

### 7.3 Levantar el servidor

```cmd
py -3.11 -m uvicorn app.main:app --reload
```

Salida esperada:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 7.4 Verificar funcionamiento

| URL | Descripción |
|---|---|
| http://127.0.0.1:8000 | Endpoint raíz |
| http://127.0.0.1:8000/docs | Documentación interactiva Swagger |

> **Importante:** Mantener esta terminal abierta mientras se use el sistema; cerrarla apaga el backend.

---

## 8. Configuración y Levantamiento del Frontend

### 8.1 Variables de entorno (opcional para desarrollo local)

Dentro de `Producto/Myguest_front_main/` puede existir un archivo `.env.local` con:

```env
VITE_API_URL=http://127.0.0.1:8000
```

> Si no se define, varios servicios usan por defecto la URL de producción en Railway como fallback (`import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'`).

### 8.2 Instalar dependencias

```cmd
cd "Producto\Myguest_front_main"
npm install
```

### 8.3 Levantar el servidor de desarrollo

```cmd
npm run dev
```

Salida esperada:

```
VITE vX.X.X  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 8.4 Acceder a la aplicación

Abrir el navegador en:

```
http://localhost:5173
```

E iniciar sesión con las credenciales del usuario administrador (ver sección 6.5).

---

## 9. Orden de Arranque Resumido (Día a Día)

Para trabajar localmente cada día, levantar en este orden y en terminales separadas:

**Terminal 1 — Base de datos**
```cmd
docker start postgres_talleres
```

**Terminal 2 — Backend**
```cmd
cd "Producto\Myguest-main"
py -3.11 -m uvicorn app.main:app --reload
```

**Terminal 3 — Frontend**
```cmd
cd "Producto\Myguest_front_main"
npm run dev
```

---

## 10. Despliegue en Producción

El sistema productivo está distribuido en tres servicios en la nube:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │ ───► │   Railway   │ ───► │  Supabase   │
│  (Frontend) │      │  (Backend)  │      │ (PostgreSQL)│
└─────────────┘      └─────────────┘      └─────────────┘
```

### 10.1 Base de datos — Supabase

| Parámetro | Valor |
|---|---|
| Proyecto | qtoikmzlifsoqnrmrxzf |
| Tipo de conexión | Session Pooler (compatibilidad IPv4) |
| Cadena de conexión (referencial) | `postgresql+asyncpg://postgres.qtoikmzlifsoqnrmrxzf:****@aws-1-us-east-2.pooler.supabase.com:5432/postgres` |

> La contraseña real de conexión debe solicitarse al administrador del proyecto en Supabase; no se documenta en texto plano por seguridad.

El cliente de Supabase Storage (usado por el módulo de Ingesta Inteligente) requiere una clave de servicio en formato JWT legacy (`eyJ...`), no el nuevo formato opaco `sb_secret_...`, salvo que se use una versión de cliente actualizada que soporte ambos formatos.

### 10.2 Backend — Railway

| Parámetro | Valor |
|---|---|
| Repositorio conectado | github.com/Cirawx/Myguest |
| Root Directory | `Producto/Myguest-main` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| URL pública | https://myguest-production-9e8f.up.railway.app |

**Variables de entorno requeridas en Railway:**

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a Supabase |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_KEY` | Clave de servicio de Supabase |
| `SECRET_KEY` | Clave secreta para firmar JWT |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `GEMINI_API_KEY` | Clave de API de Google Gemini (ingesta inteligente) |
| `BREVO_API_KEY` | Clave de API de Brevo (envío de correos) |

> **Importante:** cada vez que se agreguen nuevas dependencias de Python al proyecto, deben reflejarse en `requirements.txt` y subirse junto con el código. Railway instala automáticamente desde ese archivo en cada despliegue; si falta una dependencia, el despliegue falla silenciosamente con errores de `ModuleNotFoundError`.

### 10.3 Frontend — Vercel

| Parámetro | Valor |
|---|---|
| Repositorio conectado | github.com/Cirawx/Myguest |
| Root Directory | `Producto/Myguest_front_main` |
| Framework Preset | Vite |
| URL pública | https://myguest.vercel.app |

**Variable de entorno requerida en Vercel:**

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://myguest-production-9e8f.up.railway.app` |

**Archivo `vercel.json`** (necesario para que las rutas de React Router funcionen correctamente al recargar la página):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> **Importante:** Si el frontend muestra comportamiento desactualizado tras un despliegue (por ejemplo, llamadas a `http://127.0.0.1:8000` en producción), verificar que `VITE_API_URL` esté correctamente configurada en el dashboard de Vercel y forzar un nuevo despliegue limpiando la caché de build.

### 10.4 Flujo de despliegue continuo

Cada `git push` a la rama `main` dispara automáticamente:

1. **Railway** reconstruye y redepliega el backend.
2. **Vercel** reconstruye y redepliega el frontend.

No se requiere intervención manual adicional salvo que se agreguen nuevas variables de entorno.

---

## 11. Flujo de Trabajo con Git

```cmd
# Antes de empezar a trabajar
git pull origin main --rebase

# Después de hacer cambios
git add <archivos específicos>
git commit -m "descripción del cambio"
git push origin main
```

> **Importante:** Nunca usar `git add .` — siempre especificar los archivos modificados explícitamente para evitar subir archivos sensibles (`.env`) o no deseados por error.

---

## 12. Problemas Conocidos y Soluciones

| Problema | Causa | Solución |
|---|---|---|
| `docker: failed to connect to API` | Docker Desktop no está abierto | Abrir Docker Desktop y esperar a que cargue |
| `Connect call failed 127.0.0.1:5432` | Contenedor de PostgreSQL apagado | `docker start postgres_talleres` |
| Error 401 en `/auth/login` | Hash de contraseña incompatible | Verificar versiones `bcrypt==4.0.1` y `passlib==1.7.4` |
| `git push` rechazado | Rama remota tiene commits nuevos | `git pull origin main --rebase` y reintentar push |
| Token expirado / 401 en endpoints autenticados | El JWT expiró (60 min) | Cerrar sesión y volver a iniciar sesión |
| Backend cae en Railway tras un despliegue | Dependencia nueva no está en `requirements.txt` | Actualizar `requirements.txt` con todas las dependencias nuevas antes de hacer push |
| Frontend en Vercel sigue llamando a `localhost` | `VITE_API_URL` no configurada o caché de build vieja | Verificar variable de entorno en Vercel y forzar redeploy |
| `No suitable Python runtime found` | Python 3.11 no instalado | Instalar Python 3.11 desde el instalador oficial o `winget` |

---

## 13. Equipo de Desarrollo

Todos los integrantes del equipo participan como **colaboradores** del proyecto, sin jerarquías formales, aportando en las distintas áreas de frontend, backend, base de datos y documentación.

| Integrante | GitHub | Área de aporte principal |
|---|---|---|
| Camilo Ignacio | Cirawx | Frontend |
| Claudio Molina | ClaudioMolina27 | Backend/Base de datos |
| Nibaldo Araya | NibScript | Backend/Documentación |
| Diego | gatozz | Frontend |

---

*Documento generado para la Carrera de Gastronomía, DuocUC — Proyecto MyGuest v2.0.*
