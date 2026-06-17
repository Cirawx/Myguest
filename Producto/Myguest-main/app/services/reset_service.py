import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.usuario_model import PasswordResetToken, Usuario
from app.services.email_service import enviar_email_recuperacion
from app.utils.security import get_password_hash

async def solicitar_reset(db: AsyncSession, login: str):
    result = await db.execute(select(Usuario).where(Usuario.login == login))
    usuario = result.scalar_one_or_none()

    if not usuario:
        return

    token = secrets.token_hex(32)
    expiracion = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=30)

    reset_token = PasswordResetToken(
        id_usuario=usuario.id_usuario,
        token=token,
        expiracion=expiracion,
        usado=False
    )
    db.add(reset_token)
    await db.commit()

    enviar_email_recuperacion(usuario.login, token, usuario.nom)


async def confirmar_reset(db: AsyncSession, token: str, nueva_password: str):
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        return False, "Token invalido"
    if reset_token.usado:
        return False, "Token ya utilizado"
    if reset_token.expiracion < datetime.now(timezone.utc).replace(tzinfo=None):
        return False, "Token expirado"

    result = await db.execute(
        select(Usuario).where(Usuario.id_usuario == reset_token.id_usuario)
    )
    usuario = result.scalar_one_or_none()
    usuario.hash_password = get_password_hash(nueva_password)

    reset_token.usado = True
    await db.commit()

    return True, "Contrasena actualizada correctamente"