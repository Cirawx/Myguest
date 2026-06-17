from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.usuario_model import Usuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate
from app.utils.security import get_password_hash

async def get_usuario_by_id(db: AsyncSession, id_usuario: int):
    result = await db.execute(select(Usuario).where(Usuario.id_usuario == id_usuario))
    return result.scalars().first()

async def get_usuario_by_login(db: AsyncSession, login: str):
    result = await db.execute(select(Usuario).where(Usuario.login == login))
    return result.scalars().first()

async def get_usuarios(db: AsyncSession):
    result = await db.execute(select(Usuario))
    return result.scalars().all()

async def create_usuario(db: AsyncSession, usuario_in: UsuarioCreate):
    nuevo = Usuario(
        login=usuario_in.login,
        hash_password=get_password_hash(usuario_in.password),
        primer_apellido=usuario_in.primer_apellido,
        segundo_apellido=usuario_in.segundo_apellido,
        nom=usuario_in.nom,
        nom_preferido=usuario_in.nom_preferido,
        cod_perfil=usuario_in.cod_perfil,
        cod_carrera=usuario_in.cod_carrera,
    )
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)
    return nuevo

async def update_usuario(db: AsyncSession, id_usuario: int, datos: UsuarioUpdate):
    usuario = await get_usuario_by_id(db, id_usuario)
    if not usuario:
        return None
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(usuario, campo, valor)
    await db.commit()
    await db.refresh(usuario)
    return usuario

async def delete_usuario(db: AsyncSession, id_usuario: int):
    usuario = await get_usuario_by_id(db, id_usuario)
    if not usuario:
        return False
    try:
        await db.delete(usuario)
        await db.commit()
        return True
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar este usuario porque tiene talleres asociados. Por favor, retirelo de los talleres primero."
        )