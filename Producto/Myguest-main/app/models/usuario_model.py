from sqlalchemy import String, SmallInteger, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database import Base

class Perfil(Base):
    __tablename__ = "perfil"

    cod_perfil: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    nom_perfil: Mapped[str] = mapped_column(String(30), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="perfil")


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    login: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    hash_password: Mapped[str] = mapped_column(String(256), nullable=False)
    primer_apellido: Mapped[str] = mapped_column(String(20), nullable=False)
    segundo_apellido: Mapped[str | None] = mapped_column(String(20))
    nom: Mapped[str] = mapped_column(String(20), nullable=False)
    nom_preferido: Mapped[str | None] = mapped_column(String(20))
    cod_perfil: Mapped[int] = mapped_column(SmallInteger, ForeignKey("perfil.cod_perfil"), nullable=False)
    cod_carrera: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    perfil: Mapped["Perfil"] = relationship(back_populates="usuarios")
    
class PasswordResetToken(Base):
    __tablename__ = "password_reset_token"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expiracion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    usado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    usuario: Mapped["Usuario"] = relationship()