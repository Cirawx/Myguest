const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const getRecetas = async (token, sigla = '') => {
  const params = new URLSearchParams()
  if (sigla) params.append('sigla', sigla)
  const res = await fetch(`${API_URL}/recetario/?${params.toString()}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al obtener recetas')
  return res.json()
}

export const getRecetaDetalle = async (token, id_taller) => {
  const res = await fetch(`${API_URL}/recetario/${id_taller}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al obtener detalle de receta')
  return res.json()
}

export const getDisponibilidad = async (token, id_taller, alumnos = 1) => {
  const res = await fetch(`${API_URL}/recetario/${id_taller}/disponibilidad?alumnos=${alumnos}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al verificar disponibilidad')
  return res.json()
}

export const getRecetaEscalada = async (token, id_taller, alumnos) => {
  const res = await fetch(`${API_URL}/recetario/${id_taller}/escalado?alumnos=${alumnos}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al escalar receta')
  return res.json()
}