from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date


class MotivoMermaResponse(BaseModel):
    cod_motivo_merma: int
    nom_motivo_merma: str
    model_config = ConfigDict(from_attributes=True)


class MermaCreate(BaseModel):
    fecha: date
    id_producto: int
    cantidad: float
    cod_motivo_merma: int
    id_usuario: int
    obs: Optional[str] = None
    url_foto: Optional[str] = None


class MermaResponse(BaseModel):
    id_merma: int
    fecha: date
    id_producto: int
    cantidad: float
    cod_motivo_merma: int
    id_usuario: int
    obs: Optional[str] = None
    url_foto: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)