# Manual de Integración y Despliegue — MyGuest v2.0
### Guía técnica para equipos de TI

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Requisitos previos](#3-requisitos-previos)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Opción A — Despliegue en la nube](#5-opción-a--despliegue-en-la-nube)
6. [Opción B — Despliegue on-premise](#6-opción-b--despliegue-on-premise)
7. [Configuración de servicios externos](#7-configuración-de-servicios-externos)
8. [Verificación post-instalación](#8-verificación-post-instalación)
9. [Mantenimiento y actualizaciones](#9-mantenimiento-y-actualizaciones)
10. [Solución de problemas comunes](#10-solución-de-problemas-comunes)
11. [Checklist resumen](#11-checklist-resumen)

---

## 1. Introducción

Este documento está dirigido al **equipo de TI** responsable de instalar, desplegar y mantener MyGuest v2.0 en la infraestructura del cliente, ya sea en la nube o en servidores propios (on-premise).

MyGuest v2.0 es una aplicación web compuesta por tres componentes independientes que se comunican entre sí mediante HTTP/REST:

- Una **base de datos relacional** (PostgreSQL)
- Un **backend** que expone una API REST (Python/FastAPI)
- Un **frontend** que consume esa API (React, compilado a archivos estáticos)

El sistema puede desplegarse de dos formas, descritas en las secciones 5 y 6 de este manual:

- **En la nube**, usando servicios administrados (recomendado para equipos sin infraestructura propia)
- **On-premise**, usando contenedores Docker en un servidor propio del cliente

---

## 2. Arquitectura del sistema

```
┌─────────────────┐       HTTPS        ┌──────────────────┐       SQL        ┌─────────────────┐
│                 │  ───────────────►  │                  │  ─────────────►  │                 │
│    FRONTEND     │                    │     BACKEND      │                   │   BASE DE DATOS │
│  (React + Vite) │  ◄───────────────  │  (FastAPI/Python)│  ◄─────────────  │  (PostgreSQL 16) │
│                 │     JSON / REST    │                  │    Resultados    │                 │
└─────────────────┘                    └──────────────────┘                   └─────────────────┘
   Archivos estáticos                  Servidor con Python 3.11               Servidor con Postgres
   (HTML/JS/CSS)                       expuesto en un puerto HTTP             expuesto en puerto 5432
```

**Componentes y tecnologías:**

| Componente | Tecnología | Función |
|---|---|---|
| Base de datos | PostgreSQL 16 | Almacena todos los datos del sistema |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2.0 (async) | Expone la API REST, contiene la lógica de negocio |
| Frontend | React + Vite | Interfaz de usuario, consume la API del backend |
| Autenticación | JWT (JSON Web Tokens) | Control de sesión y permisos por rol |

El backend se comunica con la base de datos mediante el driver `asyncpg`. El frontend se comunica con el backend exclusivamente vía HTTP (peticiones REST en formato JSON), por lo que ambos pueden alojarse en servidores o proveedores distintos sin restricción, siempre que el backend sea accesible públicamente desde donde se sirva el frontend.

---

## 3. Requisitos previos

### 3.1 Software necesario (ambos escenarios)

| Software | Versión mínima | Uso |
|---|---|---|
| Python | 3.11 | Backend |
| Node.js | 18 o superior | Compilación del frontend |
| PostgreSQL | 16 | Base de datos |
| Git | Cualquier versión reciente | Clonar el repositorio del código fuente |

### 3.2 Requisitos adicionales para despliegue on-premise

| Software | Uso |
|---|---|
| Docker y Docker Compose | Contenerización de los servicios |
| Servidor Linux (Ubuntu 22.04 LTS o superior recomendado) | Host de los contenedores |
| Servidor web / proxy reverso (Nginx recomendado) | Servir el frontend y enrutar peticiones al backend |
| Certificado SSL (Let's Encrypt o similar) | HTTPS, requerido para autenticación segura |

### 3.3 Cuentas / servicios externos necesarios

Independiente del escenario de despliegue, el sistema requiere las siguientes integraciones externas para funcionar completamente:

| Servicio | Función en el sistema | Obligatorio |
|---|---|---|
| Proveedor de IA generativa (ej. Google Gemini) | Extracción automática de datos en facturas (módulo Ingesta Inteligente) | No — el sistema tiene un mecanismo de respaldo basado en OCR (Tesseract) si no se configura |
| Servicio de envío de correo transaccional (ej. Brevo, SendGrid o similar) | Envío de correos de recuperación de contraseña | Sí, si se requiere esa funcionalidad |
| Almacenamiento de archivos compatible con S3 (ej. Supabase Storage, AWS S3) | Almacenamiento de los archivos de factura subidos al módulo de Ingesta Inteligente | Sí, si se utiliza ese módulo |

> ⚠️ **Nota sobre el servicio de correo:** algunos proveedores de email transaccional con plan gratuito restringen el envío únicamente a la dirección de correo verificada por la cuenta, salvo que se autentique un dominio propio. Si se requiere enviar correos a cualquier destinatario sin restricciones, se recomienda verificar un remitente propio del cliente en el proveedor de correo elegido.

---

## 4. Variables de entorno

El sistema se configura completamente a través de variables de entorno, sin necesidad de modificar código fuente. A continuación se detallan todas las variables requeridas, sin incluir valores reales (deben ser generadas o solicitadas por cada equipo de implementación).

### 4.1 Backend

| Variable | Descripción | Ejemplo de formato |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL, con driver async | `postgresql+asyncpg://usuario:password@host:5432/nombre_bd` |
| `SECRET_KEY` | Clave secreta para firmar los tokens JWT. Debe ser una cadena aleatoria larga y única por instalación | `[cadena aleatoria de al menos 32 caracteres]` |
| `ALGORITHM` | Algoritmo de firma JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Minutos de validez de la sesión | `60` |
| `APP_ENV` | Entorno de ejecución | `production` o `development` |
| `APP_NAME` | Nombre visible de la aplicación | `Sistema Gastronomia` |
| `SUPABASE_URL` | (Opcional) URL del proyecto, si se usa Supabase como base de datos y/o storage | `https://[id-proyecto].supabase.co` |
| `SUPABASE_KEY` | (Opcional) Llave de servicio de Supabase | `[clave de servicio]` |
| `BREVO_API_KEY` / equivalente | Clave API del proveedor de correo transaccional elegido | `[clave del proveedor]` |
| `FRONTEND_URL` | URL pública donde queda alojado el frontend, usada para construir los enlaces de los correos enviados | `https://[dominio-del-cliente]` |
| `GEMINI_API_KEY` | (Opcional) Clave API del proveedor de IA, si se habilita la Ingesta Inteligente de Facturas | `[clave del proveedor]` |

### 4.2 Frontend

| Variable | Descripción | Ejemplo de formato |
|---|---|---|
| `VITE_API_URL` | URL pública donde queda expuesto el backend | `https://api.[dominio-del-cliente]` |

> ⚠️ **Importante:** la variable `VITE_API_URL` se inyecta en tiempo de **compilación** (build), no en tiempo de ejecución, ya que el frontend se compila a archivos estáticos. Si se cambia esta variable después de compilar, es necesario volver a generar el build del frontend para que el cambio tenga efecto.

---

## 5. Opción A — Despliegue en la nube

Esta es la configuración con la que el sistema fue desarrollado y probado, y la opción recomendada para equipos sin infraestructura propia o que prioricen rapidez de implementación y bajo mantenimiento.

### 5.1 Base de datos — Proveedor administrado de PostgreSQL

Se recomienda un proveedor de PostgreSQL administrado en la nube (por ejemplo Supabase, Amazon RDS, o similar).

**Pasos generales:**

1. Crear un proyecto/instancia de PostgreSQL 16.
2. Obtener la cadena de conexión en formato compatible con `asyncpg` (driver async de PostgreSQL para Python).
3. Si el proveedor ofrece un "Connection Pooler" o modo de conexión por sesión (recomendado para conexiones serverless o desde plataformas como Railway), usar esa cadena en lugar de la conexión directa.
4. Ejecutar los scripts de creación de esquema y carga inicial de datos (ver Anexo del repositorio: `BBDD/Scripts/`).

### 5.2 Backend — Plataforma de hosting para aplicaciones Python

Se recomienda una plataforma de despliegue continuo para aplicaciones backend (por ejemplo Railway, Render, Fly.io o similar).

**Pasos generales:**

1. Conectar el repositorio de código fuente del backend a la plataforma elegida.
2. Configurar el **directorio raíz** del proyecto backend dentro del repositorio (la carpeta que contiene el `Dockerfile` o `requirements.txt` del backend).
3. Configurar el **comando de inicio**:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Cargar todas las variables de entorno listadas en la sección 4.1.
5. Desplegar. La plataforma asignará automáticamente una URL pública para el backend.

### 5.3 Frontend — Plataforma de hosting estático/frontend

Se recomienda una plataforma especializada en frontend (por ejemplo Vercel, Netlify o similar).

**Pasos generales:**

1. Conectar el repositorio de código fuente del frontend a la plataforma elegida.
2. Configurar el **directorio raíz** del proyecto frontend.
3. Configurar:
   - **Framework:** Vite
   - **Comando de build:** `npm run build`
   - **Directorio de salida:** `dist`
4. Cargar la variable de entorno `VITE_API_URL` con la URL pública obtenida en el paso del backend (sección 5.2).
5. Si la plataforma no maneja automáticamente las rutas de una Single Page Application, agregar una regla de reescritura (rewrite) que redirija todas las rutas no encontradas hacia `index.html`, para que el enrutamiento del lado del cliente (React Router) funcione correctamente al recargar o acceder directamente a una URL interna.
6. Desplegar.

> 💡 Las plataformas modernas de este tipo suelen redesplegar automáticamente cada vez que se sube un cambio (`push`) al repositorio. Si tras un cambio el comportamiento en producción no se actualiza, verificar el historial de despliegues de la plataforma y, si es necesario, forzar un nuevo despliegue manual.

---

## 6. Opción B — Despliegue on-premise

Esta opción es recomendada para clientes que requieren que los datos permanezcan dentro de su propia infraestructura, por motivos de política interna, normativa o preferencia institucional.

### 6.1 Arquitectura on-premise sugerida

```
Servidor Linux
│
├── Contenedor: PostgreSQL 16        (puerto interno 5432)
├── Contenedor: Backend (FastAPI)    (puerto interno 8000)
├── Contenedor: Nginx (proxy reverso)
│     ├── Sirve los archivos estáticos del frontend compilado
│     └── Redirige las peticiones /api hacia el contenedor del backend
└── Certificado SSL (Let's Encrypt)
```

### 6.2 Pasos generales

1. **Preparar el servidor:** instalar Docker y Docker Compose en el servidor Linux destinado.

2. **Base de datos:**
   - Levantar un contenedor de PostgreSQL 16 con un volumen persistente para no perder datos ante reinicios del contenedor.
   - Ejecutar los scripts de creación de esquema y carga inicial (`BBDD/Scripts/`) contra esa instancia.

3. **Backend:**
   - Construir la imagen Docker del backend a partir del `Dockerfile` incluido en el repositorio.
   - Levantar el contenedor, inyectando las variables de entorno de la sección 4.1 (vía archivo `.env` o variables del orquestador).
   - Exponer el contenedor únicamente a la red interna o detrás del proxy reverso, no directamente a internet.

4. **Frontend:**
   - Compilar el frontend (`npm run build`) inyectando la variable `VITE_API_URL` apuntando a la URL pública que se usará para el backend.
   - Copiar el contenido de la carpeta `dist` generada a la carpeta servida por Nginx (o el servidor web elegido).

5. **Proxy reverso (Nginx):**
   - Configurar un *virtual host* que sirva los archivos estáticos del frontend.
   - Configurar una regla que redirija las peticiones (por ejemplo, las que comienzan con `/api` o el subdominio correspondiente) hacia el contenedor del backend.
   - Configurar una regla de *fallback* hacia `index.html` para las rutas no encontradas, de forma que el enrutamiento de React funcione correctamente.

6. **SSL:**
   - Emitir un certificado SSL (por ejemplo, mediante Let's Encrypt/Certbot) y configurarlo en Nginx para servir el sitio bajo HTTPS. Esto es indispensable: el sistema utiliza autenticación basada en tokens y debe operar bajo conexión cifrada.

7. **Backups:**
   - Configurar respaldos periódicos automatizados del volumen de la base de datos (`pg_dump` programado o snapshot del volumen Docker).

---

## 7. Configuración de servicios externos

### 7.1 Servicio de correo transaccional (recuperación de contraseña)

1. Crear una cuenta en el proveedor de correo transaccional elegido.
2. Generar una clave API desde el panel del proveedor.
3. **Verificar un remitente:** registrar y verificar la dirección de correo (o dominio) que figurará como remitente de los correos del sistema. Esto es necesario para poder enviar correos a cualquier destinatario sin restricciones del proveedor.
4. Cargar la clave API obtenida en la variable de entorno correspondiente del backend (sección 4.1).
5. Configurar la variable `FRONTEND_URL` con la URL pública real del frontend, ya que se utiliza para construir el enlace incluido en el correo de recuperación.

> ⚠️ Si se omite la verificación del remitente, muchos proveedores de email transaccional únicamente permitirán el envío de correos de prueba a la dirección con la que se creó la cuenta, lo cual impedirá que la funcionalidad de recuperación de contraseña funcione para usuarios reales del sistema.

### 7.2 Proveedor de IA generativa (Ingesta Inteligente de Facturas — opcional)

1. Crear una cuenta en el proveedor de IA elegido y generar una clave API.
2. Cargar la clave en la variable de entorno correspondiente del backend.
3. Si no se configura esta variable, el sistema utilizará automáticamente su mecanismo de respaldo basado en OCR (Tesseract), con menor precisión de extracción pero sin dependencia de un servicio externo de pago.

### 7.3 Almacenamiento de archivos (módulo de Ingesta de Facturas)

El módulo de Ingesta Inteligente requiere un servicio de almacenamiento de archivos compatible para guardar temporalmente los documentos de factura subidos por los usuarios.

1. Crear un bucket/contenedor de almacenamiento en el proveedor elegido.
2. Configurar las credenciales de acceso en las variables de entorno correspondientes del backend.
3. Asegurar que el contenedor de Docker del backend (si se despliega on-premise) cuente con las dependencias necesarias para procesamiento de documentos (Poppler para PDFs y Tesseract OCR), las cuales deben estar incluidas en el `Dockerfile` del proyecto.

---

## 8. Verificación post-instalación

Una vez desplegados los tres componentes, verificar lo siguiente en orden:

1. **Base de datos accesible:** confirmar que el backend puede conectarse exitosamente (revisar logs de arranque del backend; no debe haber errores de conexión).

2. **Backend operativo:** acceder a la documentación interactiva de la API, disponible en:
   ```
   https://[url-del-backend]/docs
   ```
   Debe cargar sin errores y mostrar el listado completo de endpoints agrupados por módulo.

3. **Login funcional:** desde la documentación interactiva (`/docs`), probar el endpoint de login con un usuario válido y confirmar que retorna un token.

4. **Frontend operativo:** acceder a la URL pública del frontend y confirmar que la pantalla de login carga correctamente.

5. **Comunicación frontend-backend:** iniciar sesión desde el frontend con un usuario válido y confirmar que el Dashboard carga datos reales (no debe haber errores de CORS ni de conexión en la consola del navegador).

6. **CORS configurado correctamente:** si el frontend y el backend están en dominios distintos, verificar que el backend tenga configurado explícitamente el dominio del frontend como origen permitido. No se recomienda permitir todos los orígenes (`*`) si se utiliza autenticación con credenciales, ya que algunos navegadores bloquean esa combinación por política de seguridad.

7. **Correo de recuperación de contraseña:** probar el flujo de recuperación de contraseña con una cuenta de prueba y confirmar que el correo llega correctamente.

8. **Triggers de base de datos activos:** confirmar (registrando una factura de prueba) que el stock del producto correspondiente se actualiza automáticamente sin intervención manual.

---

## 9. Mantenimiento y actualizaciones

- El código fuente del proyecto se gestiona mediante control de versiones (Git). Las actualizaciones se aplican mediante el flujo estándar: obtener los últimos cambios (`pull`), revisar, y desplegar la nueva versión.
- En despliegues en la nube con integración continua, los cambios subidos a la rama principal del repositorio se despliegan automáticamente.
- En despliegues on-premise, las actualizaciones requieren reconstruir las imágenes Docker afectadas y reiniciar los contenedores correspondientes.
- Se recomienda mantener un entorno de pruebas (staging) separado del de producción para validar cambios antes de aplicarlos al ambiente que usan los usuarios finales.

---

## 10. Solución de problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El frontend carga pero no muestra datos, con error de conexión en la consola del navegador | La variable `VITE_API_URL` no fue inyectada correctamente al momento de compilar el frontend | Verificar que la variable esté configurada en la plataforma de hosting **antes** de ejecutar el build, y volver a desplegar |
| Error de CORS en la consola del navegador al intentar ciertas acciones (especialmente al eliminar registros) | El backend tiene configurado `allow_origins=["*"]` junto con `allow_credentials=True`, combinación no permitida por los navegadores | Configurar explícitamente el/los dominios del frontend como origen permitido en la configuración de CORS del backend |
| El backend no inicia, con error de importación de módulos en los logs | Inconsistencia entre los archivos de modelos/routers tras una actualización de código | Revisar que todos los archivos `__init__.py` y los registros de routers en el archivo principal estén alineados con los módulos existentes |
| Los correos de recuperación de contraseña no llegan, aunque el endpoint responde exitosamente | El remitente configurado no está verificado ante el proveedor de correo, que por política solo permite enviar a la cuenta de prueba | Verificar el remitente (o el dominio) en el panel del proveedor de correo elegido |
| Error de tipo de fecha/hora al generar tokens o registros con expiración | Inconsistencia entre fechas con y sin zona horaria al comparar contra la base de datos | Asegurar que las fechas se generen y comparen de manera consistente (con o sin zona horaria) en todo el código del backend |
| No se puede eliminar un producto, usuario o familia | Restricción de integridad referencial (clave foránea) intencional, para proteger registros históricos | Comportamiento esperado. Resolver la dependencia (reasignar, desvincular) antes de eliminar |

---

## 11. Checklist resumen

**Antes de desplegar:**

- [ ] Repositorio de código fuente clonado/accesible
- [ ] Cuenta de base de datos PostgreSQL 16 creada (nube) o contenedor preparado (on-premise)
- [ ] Cuenta en plataforma de hosting para backend (nube) o servidor Linux con Docker (on-premise)
- [ ] Cuenta en plataforma de hosting para frontend (nube) o Nginx configurado (on-premise)
- [ ] Cuenta y clave API del servicio de correo transaccional elegido
- [ ] (Opcional) Cuenta y clave API del proveedor de IA generativa elegido
- [ ] Dominio(s) propios disponibles, si se requiere marca propia en las URLs

**Durante el despliegue:**

- [ ] Scripts de base de datos ejecutados (esquema + carga inicial)
- [ ] Variables de entorno del backend configuradas completas
- [ ] Backend desplegado y accesible vía `/docs`
- [ ] Variable `VITE_API_URL` configurada antes de compilar el frontend
- [ ] Frontend desplegado y accesible
- [ ] CORS del backend configurado con el dominio real del frontend
- [ ] Remitente de correo verificado en el proveedor elegido
- [ ] Certificado SSL activo en ambos componentes (si on-premise)

**Después del despliegue:**

- [ ] Login de prueba exitoso desde el frontend
- [ ] Dashboard carga datos sin errores en consola
- [ ] Flujo de recuperación de contraseña probado de extremo a extremo
- [ ] Registro de prueba (factura o taller) confirma actualización automática de stock
- [ ] Respaldo de base de datos configurado y probado

---

*Manual de Integración y Despliegue — MyGuest v2.0 — Documento técnico para equipos de TI.*
