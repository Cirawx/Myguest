from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import date


class DetDevolucionCreate(BaseModel):
    id_producto: int
    cantidad: float


class DevolucionCreate(BaseModel):
    fecha: date
    ano_academ: int
    cod_periodo_academ: int
    sigla: str
    seccion: int
    id_taller: int
    id_usuario: int
    motivo_sobrante: str
    detalles: List[DetDevolucionCreate]


class DetDevolucionResponse(BaseModel):
    id_devolucion: int
    id_producto: int
    cantidad: float
    model_config = ConfigDict(from_attributes=True)


class DevolucionResponse(BaseModel):
    id_devolucion: int
    fecha: date
    ano_academ: int
    cod_periodo_academ: int
    sigla: str
    seccion: int
    id_taller: int
    id_usuario: int
    motivo_sobrante: str
    detalles: List[DetDevolucionResponse] = []
    model_config = ConfigDict(from_attributes=True)