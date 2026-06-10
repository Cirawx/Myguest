const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const getProveedores = async (token, todos = false) => {
  const res = await fetch(`${API_URL}/proveedores/?todos=${todos}`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener proveedores')
  return res.json()
}

export const getFamilias = async (token) => {
  const res = await fetch(`${API_URL}/familias/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener familias')
  return res.json()
}

export const desactivarProveedor = async (token, id) => {
  const res = await fetch(`${API_URL}/proveedores/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al desactivar proveedor')
  return true
}

export const activarProveedor = async (token, id, data) => {
  const res = await fetch(`${API_URL}/proveedores/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al activar proveedor')
  return res.json()
}

export const eliminarFamilia = async (token, cod) => {
  const res = await fetch(`${API_URL}/familias/${cod}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al eliminar familia')
  return true
}