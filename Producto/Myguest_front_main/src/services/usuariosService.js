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