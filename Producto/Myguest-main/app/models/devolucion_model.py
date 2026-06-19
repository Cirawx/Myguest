from sqlalchemy import String, SmallInteger, ForeignKey, Date, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from datetime import date
from app.database import Base


class Devolucion(Base):
    __tablename__ = "devolucion"

    id_devolucion: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    ano_academ: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    cod_periodo_academ: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    sigla: Mapped[str] = mapped_column(String(15), nullable=False)
    seccion: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    id_taller: Mapped[int] = mapped_column(Integer, nullable=False)
    id_usuario: Mapped[int] = mapped_column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    motivo_sobrante: Mapped[str] = mapped_column(String(500), nullable=False)

    detalles: Mapped[list["DetDevolucion"]] = relationship(back_populates="devolucion", cascade="all, delete-orphan")


class DetDevolucion(Base):
    __tablename__ = "det_devolucion"

    id_devolucion: Mapped[int] = mapped_column(Integer, ForeignKey("devolucion.id_devolucion"), primary_key=True)
    id_producto: Mapped[int] = mapped_column(Integer, ForeignKey("producto.id_producto"), primary_key=True)
    cantidad: Mapped[float] = mapped_column(Numeric(12, 6), nullable=False)

    devolucion: Mapped["Devolucion"] = relationship(back_populates="detalles")