from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.merma_model import MotivoMerma, Merma
from app.schemas.merma_schema import MermaCreate


async def get_motivos_merma(db: AsyncSession):
    result = await db.execute(select(MotivoMerma).order_by(MotivoMerma.cod_motivo_merma))
    return result.scalars().all()


async def get_mermas(db: AsyncSession, id_producto: int = None):
    query = select(Merma).order_by(Merma.fecha.desc())
    if id_producto:
        query = query.where(Merma.id_producto == id_producto)
    result = await db.execute(query)
    return result.scalars().all()


async def get_merma_by_id(db: AsyncSession, id_merma: int):
    result = await db.execute(select(Merma).where(Merma.id_merma == id_merma))
    return result.scalars().first()


async def create_merma(db: AsyncSession, datos: MermaCreate):
    merma = Merma(
        fecha=datos.fecha,
        id_producto=datos.id_producto,
        cantidad=datos.cantidad,
        cod_motivo_merma=datos.cod_motivo_merma,
        id_usuario=datos.id_usuario,
        obs=datos.obs,
        url_foto=datos.url_foto
    )
    db.add(merma)
    await db.commit()
    await db.refresh(merma)
    return merma


async def delete_merma(db: AsyncSession, id_merma: int):
    merma = await get_merma_by_id(db, id_merma)
    if not merma:
        return False
    await db.delete(merma)
    await db.commit()
    return True