from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.devolucion_model import Devolucion, DetDevolucion
from app.schemas.devolucion_schema import DevolucionCreate


async def get_devoluciones(db: AsyncSession, ano_academ: int = None, sigla: str = None):
    query = select(Devolucion).options(selectinload(Devolucion.detalles)).order_by(Devolucion.fecha.desc())
    if ano_academ:
        query = query.where(Devolucion.ano_academ == ano_academ)
    if sigla:
        query = query.where(Devolucion.sigla == sigla)
    result = await db.execute(query)
    return result.scalars().all()


async def get_devolucion_by_id(db: AsyncSession, id_devolucion: int):
    result = await db.execute(
        select(Devolucion)
        .options(selectinload(Devolucion.detalles))
        .where(Devolucion.id_devolucion == id_devolucion)
    )
    return result.scalars().first()


async def create_devolucion(db: AsyncSession, datos: DevolucionCreate):
    devolucion = Devolucion(
        fecha=datos.fecha,
        ano_academ=datos.ano_academ,
        cod_periodo_academ=datos.cod_periodo_academ,
        sigla=datos.sigla,
        seccion=datos.seccion,
        id_taller=datos.id_taller,
        id_usuario=datos.id_usuario,
        motivo_sobrante=datos.motivo_sobrante
    )
    db.add(devolucion)
    await db.flush()
    for det in datos.detalles:
        detalle = DetDevolucion(
            id_devolucion=devolucion.id_devolucion,
            id_producto=det.id_producto,
            cantidad=det.cantidad
        )
        db.add(detalle)
    await db.commit()
    result = await db.execute(
        select(Devolucion)
        .options(selectinload(Devolucion.detalles))
        .where(Devolucion.id_devolucion == devolucion.id_devolucion)
    )
    return result.scalars().first()


async def delete_devolucion(db: AsyncSession, id_devolucion: int):
    devolucion = await get_devolucion_by_id(db, id_devolucion)
    if not devolucion:
        return False
    await db.delete(devolucion)
    await db.commit()
    return True