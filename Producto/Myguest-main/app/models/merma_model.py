from sqlalchemy import String, SmallInteger, ForeignKey, Date, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from datetime import date
from app.database import Base


class MotivoMerma(Base):
    __tablename__ = "motivo_merma"

    cod_motivo_merma: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    nom_motivo_merma: Mapped[str] = mapped_column(String(50), nullable=False)

    mermas: Mapped[list["Merma"]] = relationship(back_populates="motivo")


class Merma(Base):
    __tablename__ = "merma"

    id_merma: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    id_producto: Mapped[int] = mapped_column(Integer, ForeignKey("producto.id_producto"), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(12, 6), nullable=False)
    cod_motivo_merma: Mapped[int] = mapped_column(SmallInteger, ForeignKey("motivo_merma.cod_motivo_merma"), nullable=False)
    id_usuario: Mapped[int] = mapped_column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    obs: Mapped[Optional[str]] = mapped_column(String(500))
    url_foto: Mapped[Optional[str]] = mapped_column(String(300))

    motivo: Mapped["MotivoMerma"] = relationship(back_populates="mermas")