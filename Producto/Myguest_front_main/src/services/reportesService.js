const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const getReporte = async (token, filtros = {}) => {
  const params = new URLSearchParams()
  if (filtros.ano_academ) params.append('ano_academ', filtros.ano_academ)
  if (filtros.cod_periodo_academ) params.append('cod_periodo_academ', filtros.cod_periodo_academ)
  if (filtros.sigla) params.append('sigla', filtros.sigla)

  const res = await fetch(`${API_URL}/reportes/?${params.toString()}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al obtener el reporte')
  return res.json()
}