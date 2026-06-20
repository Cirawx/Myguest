const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const getUsuarios = async (token) => {
  const res = await fetch(`${API_URL}/usuarios/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener usuarios')
  return res.json()
}

export const eliminarUsuario = async (token, id) => {
  const res = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al eliminar usuario')
  return true
}

export const reemplazarDocente = async (token, id_usuario_actual, nuevo_id_usuario) => {
  const res = await fetch(`${API_URL}/usuarios/${id_usuario_actual}/reemplazar-docente?nuevo_id_usuario=${nuevo_id_usuario}`, {
    method: 'PUT',
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Error al reemplazar docente')
  }
  return res.json()
}