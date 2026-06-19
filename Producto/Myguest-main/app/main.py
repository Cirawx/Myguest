from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import engine, Base
import app.models

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.app_env == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="API REST para gestión de inventario y talleres de gastronomía",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://myguest.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers.usuario_router import router as usuario_router
from app.routers.auth_router import router as auth_router
from app.routers.inventario_router import router as inventario_router
from app.routers.proveedor_router import router as proveedor_router
from app.routers.academico_router import router as academico_router
from app.routers.facturacion_router import router as facturacion_router
from app.routers.compras_router import router as compras_router
from app.routers.devolucion_router import router as devolucion_router
from app.routers.merma_router import router as merma_router
from app.routers.recetario_router import router as recetario_router
from app.routers.reporte_router import router as reporte_router
from app.routers.ingesta_router import router as ingesta_router

app.include_router(auth_router,        prefix="/auth",      tags=["Auth"])
app.include_router(usuario_router,     prefix="/usuarios",  tags=["Usuarios"])
app.include_router(inventario_router,  prefix="",           tags=["Inventario"])
app.include_router(proveedor_router,   prefix="",           tags=["Proveedores"])
app.include_router(academico_router,   prefix="",           tags=["Academico"])
app.include_router(facturacion_router, prefix="",           tags=["Facturacion"])
app.include_router(compras_router,     prefix="",           tags=["Compras"])
app.include_router(devolucion_router,  prefix="",           tags=["Devoluciones"])
app.include_router(merma_router,  prefix="",                tags=["Mermas"])
app.include_router(recetario_router,   prefix="",           tags=["Recetario"])
app.include_router(reporte_router,     prefix="",           tags=["Reportes"])
app.include_router(ingesta_router,     prefix="",           tags=["Ingesta Inteligente"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.app_name, "env": settings.app_env}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}