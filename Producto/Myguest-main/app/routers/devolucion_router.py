from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.devolucion_schema import DevolucionCreate, DevolucionResponse
from app.services import devolucion_service

router = APIRouter()


@router.get("/devoluciones/", response_model=List[DevolucionResponse])
async def listar_devoluciones(
    ano_academ: Optional[int] = Query(None),
    sigla: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return await devolucion_service.get_devoluciones(db, ano_academ, sigla)


@router.get("/devoluciones/{id_devolucion}", response_model=DevolucionResponse)
async def obtener_devolucion(
    id_devolucion: int,
    db: AsyncSession = Depends(get_db),
    usuario=Depends(get_current_user)
):
    devolucion = await devolucion_service.get_devolucion_by_id(db, id_devolucion)
    if not devolucion:
        raise HTTPException(status_code=404, detail="Devolucion no encontrada")
    return devolucion


@router.post("/devoluciones/", response_model=DevolucionResponse, status_code=status.HTTP_201_CREATED)
async def crear_devolucion(
    datos: DevolucionCreate,
    db: AsyncSession = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return await devolucion_service.create_devolucion(db, datos)


@router.delete("/devoluciones/{id_devolucion}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_devolucion(
    id_devolucion: int,
    db: AsyncSession = Depends(get_db),
    usuario=Depends(get_current_user)
):
    eliminado = await devolucion_service.delete_devolucion(db, id_devolucion)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Devolucion no encontrada")