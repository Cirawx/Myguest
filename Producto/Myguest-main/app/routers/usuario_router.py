from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas.usuario_schema import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services import usuario_service

router = APIRouter()


@router.get("/", response_model=List[UsuarioResponse])
async def listar_usuarios(db: AsyncSession = Depends(get_db)):
    return await usuario_service.get_usuarios(db)


@router.get("/{id_usuario}", response_model=UsuarioResponse)
async def obtener_usuario(id_usuario: int, db: AsyncSession = Depends(get_db)):
    usuario = await usuario_service.get_usuario_by_id(db, id_usuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def crear_usuario(usuario: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    existente = await usuario_service.get_usuario_by_login(db, login=usuario.login)
    if existente:
        raise HTTPException(status_code=400, detail="El login ya está registrado")
    return await usuario_service.create_usuario(db, usuario)


@router.put("/{id_usuario}", response_model=UsuarioResponse)
async def actualizar_usuario(id_usuario: int, datos: UsuarioUpdate, db: AsyncSession = Depends(get_db)):
    usuario = await usuario_service.update_usuario(db, id_usuario, datos)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_usuario(id_usuario: int, db: AsyncSession = Depends(get_db)):
    eliminado = await usuario_service.delete_usuario(db, id_usuario)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

@router.put("/{id_usuario_actual}/reemplazar-docente", status_code=status.HTTP_200_OK)
async def reemplazar_docente(
    id_usuario_actual: int,
    nuevo_id_usuario: int,
    db: AsyncSession = Depends(get_db)
):
    actualizados = await usuario_service.reemplazar_docente_talleres(db, id_usuario_actual, nuevo_id_usuario)
    return {"talleres_actualizados": actualizados}

@router.put("/{id_usuario_actual}/reemplazar-docente", status_code=status.HTTP_200_OK)
async def reemplazar_docente(
    id_usuario_actual: int,
    nuevo_id_usuario: int,
    db: AsyncSession = Depends(get_db)
):
    actualizados = await usuario_service.reemplazar_docente_talleres(db, id_usuario_actual, nuevo_id_usuario)
    return {"talleres_actualizados": actualizados}