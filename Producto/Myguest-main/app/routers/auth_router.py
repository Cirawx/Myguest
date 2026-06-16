from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.schemas.auth_schema import LoginRequest, TokenResponse
from app.schemas.usuario_schema import UsuarioResponse
from app.services import auth_service
from app.services import reset_service
from app.dependencies import get_current_user
from app.models.usuario_model import Usuario

router = APIRouter()


class SolicitarResetRequest(BaseModel):
    login: str


class ConfirmarResetRequest(BaseModel):
    token: str
    nueva_password: str


@router.post("/login", response_model=TokenResponse)
async def login(datos: LoginRequest, db: AsyncSession = Depends(get_db)):
    usuario = await auth_service.authenticate_usuario(db, datos.login, datos.password)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_service.create_access_token({
        "sub": str(usuario.id_usuario),
        "perfil": usuario.cod_perfil
    })
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UsuarioResponse)
async def me(usuario: Usuario = Depends(get_current_user)):
    return usuario


@router.post("/recuperar-password")
async def recuperar_password(datos: SolicitarResetRequest, db: AsyncSession = Depends(get_db)):
    await reset_service.solicitar_reset(db, datos.login)
    return {"mensaje": "Si el correo existe, recibirás un email con instrucciones"}


@router.post("/reset-password")
async def reset_password(datos: ConfirmarResetRequest, db: AsyncSession = Depends(get_db)):
    ok, mensaje = await reset_service.confirmar_reset(db, datos.token, datos.nueva_password)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=mensaje)
    return {"mensaje": mensaje}