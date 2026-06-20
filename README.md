# MyGuest v2.0 — Sistema de Gestión Logística

**MyGuest v2.0** es un sistema integral de gestión logística para la Carrera de Gastronomía de DuocUC, diseñado para mitigar los riesgos operacionales de la gestión manual de inventario, compras y ejecución académica de talleres.

El sistema centraliza el control de stock, proveedores, facturación, programación académica y reportes, automatizando procesos que antes se realizaban manualmente, con trazabilidad de cada transacción y permisos diferenciados por rol.

🔗 **Repositorio:** https://github.com/Cirawx/Myguest
🔗 **App en producción:** https://myguest.vercel.app
🔗 **API en producción:** https://myguest-production-9e8f.up.railway.app
🔗 **Documentación interactiva (Swagger):** https://myguest-production-9e8f.up.railway.app/docs

---

## 🚀 El Problema y la Solución

### ❌ Problema

La gestión manual de inventario y compras en un entorno gastronómico académico genera:

- Opacidad sobre el stock real disponible para cada taller.
- Errores humanos en el registro de consumo, mermas y devoluciones.
- Falta de trazabilidad entre lo programado académicamente y lo que realmente se ejecuta y consume en bodega.
- Pérdida de tiempo en tareas repetitivas como el ingreso manual de facturas.

### ✅ Solución

Una plataforma web con **11 módulos interconectados** y un sistema de **permisos por rol**, que:

- Centraliza inventario, proveedores, compras, facturación y programación académica en un solo lugar.
- Conecta automáticamente la ejecución de talleres con el descuento de stock mediante triggers en base de datos.
- Incorpora un módulo de **Ingesta Inteligente** que extrae datos de facturas usando IA (Gemini) con respaldo OCR (Tesseract), reduciendo la digitación manual.
- Define accesos diferenciados según el rol de cada usuario (Administrador, Docente, Bodeguero), evitando que cada persona vea o modifique más de lo que su función requiere.

---

## 🛠️ Módulos del Sistema

| Módulo | Descripción |
|---|---|
| 📊 **Dashboard** | Vista general con indicadores clave, alertas de stock crítico y gráfico de productos con menor stock |
| 👤 **Usuarios** | Gestión de cuentas, roles y reemplazo masivo de docente en talleres asignados |
| 🎓 **Académico** | Programación de asignaturas, programación de talleres y registro de ejecución con consumo de insumos |
| 📦 **Inventario** | Catálogo de productos, control de stock por categoría, alertas de stock mínimo |
| 🏭 **Proveedores** | Directorio de proveedores y gestión de familias de productos asociadas |
| 🛒 **Compras** | Órdenes de compra con seguimiento de estado (borrador, enviada, recibida, anulada) |
| 📄 **Facturación** | Registro de facturas de mercadería, con ingreso manual o mediante Ingesta Inteligente (IA) |
| 🤖 **Ingesta Inteligente** | Extracción automática de datos de facturas mediante IA (Gemini) con respaldo OCR (Tesseract) |
| 🗑️ **Mermas** | Registro de pérdidas de producto con motivo y cálculo de valor de la pérdida |
| ↩️ **Devoluciones** | Registro de insumos sobrantes devueltos tras la ejecución de un taller |
| 📈 **Reportes** | Reportes de stock, consumo, facturación, mermas/devoluciones y costos por asignatura, filtrables por período |
| 📋 **Recetario** | Consulta de recetas por taller, verificación de disponibilidad de stock y escalado de cantidades según número de alumnos |

---

## 🔐 Sistema de Roles y Permisos

El sistema define **4 roles**, cada uno con permisos de Ver / Crear / Editar / Eliminar configurados de forma independiente por módulo:

| Rol | Enfoque |
|---|---|
| **Administrador TI** | Acceso total al sistema |
| **Administrador de Carrera** | Acceso total al sistema (mismo nivel que Administrador TI) |
| **Docente** | Visualiza inventario y recetario; registra mermas y devoluciones de sus talleres; gestiona la programación de ejecución de sus propios talleres |
| **Bodeguero** | Gestiona inventario, proveedores, compras y facturación; sin acceso al módulo académico |

Los permisos se aplican en tres capas: ocultamiento de módulos en el menú lateral, ocultamiento de acciones (botones de crear/editar/eliminar) según el rol, y bloqueo de rutas por URL directa.

---

## 🤖 Ingesta Inteligente de Facturas

El módulo de Ingesta Inteligente automatiza el registro de facturas mediante un flujo de extracción asistido por IA:

1. **Carga del documento** — el usuario sube una imagen o PDF de la factura.
2. **Extracción** — Gemini AI analiza el documento y extrae los datos estructurados (proveedor, productos, cantidades, precios). Si la extracción por IA no está disponible, el sistema usa Tesseract OCR como respaldo.
3. **Vista previa (split-screen)** — el documento original se muestra junto a los datos extraídos para que el usuario los valide visualmente.
4. **Búsqueda y asociación de productos** — el usuario confirma o ajusta la asociación entre los productos detectados y el catálogo interno mediante un buscador libre.
5. **Confirmación** — al guardar, se crea la factura en el sistema y se actualiza el stock automáticamente.

Los archivos de las facturas se almacenan en Supabase Storage.

---

## 💻 Stack Tecnológico

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
| google-generativeai | Extracción de datos de facturas (Gemini) |
| pytesseract | OCR de respaldo |
| sib-api-v3-sdk (Brevo) | Envío de correos para recuperación de contraseña |

### Frontend

| Tecnología | Uso |
|---|---|
| React 18 | Librería de interfaz |
| Vite | Bundler y servidor de desarrollo |
| React Router | Enrutamiento |
| Zustand | Manejo de estado global (autenticación, tema) |
| Recharts | Gráficos del dashboard |
| SheetJS (xlsx) | Exportación de reportes a Excel |

### Base de Datos e Infraestructura

| Componente | Tecnología |
|---|---|
| Base de datos (producción) | PostgreSQL gestionado en **Supabase** |
| Base de datos (desarrollo local) | PostgreSQL 16 vía **Docker** |
| Hosting backend | **Railway** |
| Hosting frontend | **Vercel** |
| Almacenamiento de archivos | Supabase Storage |

La base de datos cuenta con triggers automáticos para mantener el stock sincronizado:

- `trg_stock_entrada` — al registrar una factura, el stock sube.
- `trg_stock_salida` — al registrar la ejecución de un taller, el stock baja según los insumos consumidos.
- `trg_stock_devolucion` — al registrar una devolución, el stock sube nuevamente.

---

## 📊 Atributos de Calidad

- **🔒 Seguridad** — autenticación mediante JWT, contraseñas hasheadas con bcrypt, permisos diferenciados por rol en frontend y backend.
- **🎯 Trazabilidad** — cada movimiento de stock queda vinculado a su origen (factura, ejecución de taller, merma o devolución) y al usuario que lo generó.
- **⚡ Automatización** — el stock se actualiza automáticamente mediante triggers de base de datos, sin intervención manual.
- **🧩 Modularidad** — cada módulo del sistema sigue un patrón consistente de cuatro capas en el backend (modelo, esquema, servicio, router) y de servicio + página + componentes en el frontend.

---

## 📁 Estructura del Repositorio

```
Myguest/
├── Documentacion/              ← Actas de reunión y documentación del proyecto
├── BBDD/                       ← Scripts SQL de creación y carga de la base de datos
├── Producto/
│   ├── Myguest-main/            ← Backend (FastAPI)
│   └── Myguest_front_main/      ← Frontend (React + Vite)
└── README.md
```

Para instrucciones detalladas de instalación local y despliegue, ver [`Manual_Instalacion_Despliegue_MyGuest.md`](./Manual_Instalacion_Despliegue_MyGuest.md).

---

## 👥 Equipo de Desarrollo

Todos los integrantes del equipo participan como **colaboradores** del proyecto, aportando en las distintas áreas de frontend, backend, base de datos y documentación.

| Integrante | GitHub | Área de aporte principal |
|---|---|---|
| Camilo Ignacio | [Cirawx](https://github.com/Cirawx) | Frontend |
| Claudio Molina | [ClaudioMolina27](https://github.com/ClaudioMolina27) | Backend y Base de Datos |
| Nibaldo Araya | [NibScript](https://github.com/NibScript) | Backend y Documentación |
| Diego Benavides | [gatozz](https://github.com/gatozz) | Frontend |

---

## 📌 Estado del Proyecto

El sistema se encuentra en **desarrollo activo**, con los 11 módulos funcionales y desplegados en producción. Trabajo en curso incluye refinamiento del sistema de permisos por rol y mejoras continuas de UX en los módulos existentes.

---

*Carrera de Gastronomía, DuocUC — Proyecto MyGuest v2.0.*
