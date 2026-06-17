const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const getCarreras = async (token) => {
  const res = await fetch(`${API_URL}/carreras/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener carreras')
  return res.json()
}

export const getPeriodos = async (token) => {
  const res = await fetch(`${API_URL}/periodos/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener períodos')
  return res.json()
}

export const getAsignaturas = async (token) => {
  const res = await fetch(`${API_URL}/asignaturas/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener asignaturas')
  return res.json()
}

export const getTalleres = async (token, sigla = '') => {
  const params = sigla ? `?sigla=${sigla}` : ''
  const res = await fetch(`${API_URL}/talleres/${params}`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener talleres')
  return res.json()
}

export const getProgAsign = async (token, filtros = {}) => {
  const params = new URLSearchParams()
  if (filtros.ano_academ) params.append('ano_academ', filtros.ano_academ)
  if (filtros.cod_periodo_academ) params.append('cod_periodo_academ', filtros.cod_periodo_academ)
  const res = await fetch(`${API_URL}/prog-asign/?${params}`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener programaciones')
  return res.json()
}

export const crearProgAsign = async (token, data) => {
  const res = await fetch(`${API_URL}/prog-asign/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear programación')
  return res.json()
}

export const getProgTaller = async (token, filtros = {}) => {
  const params = new URLSearchParams()
  if (filtros.ano_academ) params.append('ano_academ', filtros.ano_academ)
  if (filtros.cod_periodo_academ) params.append('cod_periodo_academ', filtros.cod_periodo_academ)
  if (filtros.sigla) params.append('sigla', filtros.sigla)
  if (filtros.seccion) params.append('seccion', filtros.seccion)
  const res = await fetch(`${API_URL}/prog-taller/?${params}`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener talleres programados')
  return res.json()
}

export const crearProgTaller = async (token, data) => {
  const res = await fetch(`${API_URL}/prog-taller/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al programar taller')
  return res.json()
}

export const getRegisTaller = async (token, filtros = {}) => {
  const params = new URLSearchParams()
  if (filtros.ano_academ) params.append('ano_academ', filtros.ano_academ)
  if (filtros.cod_periodo_academ) params.append('cod_periodo_academ', filtros.cod_periodo_academ)
  if (filtros.sigla) params.append('sigla', filtros.sigla)
  const res = await fetch(`${API_URL}/regis-taller/?${params}`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener registros de taller')
  return res.json()
}

export const crearRegisTaller = async (token, data) => {
  const res = await fetch(`${API_URL}/regis-taller/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al registrar taller')
  return res.json()
}