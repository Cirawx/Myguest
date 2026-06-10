const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const getProductos = async (token) => {
  const res = await fetch(`${API_URL}/productos/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener productos')
  return res.json()
}

export const getInventario = async (token) => {
  const res = await fetch(`${API_URL}/inventario/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener inventario')
  return res.json()
}

export const getFamilias = async (token) => {
  const res = await fetch(`${API_URL}/familias/`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener familias')
  return res.json()
}

export const eliminarProducto = async (token, id) => {
  const res = await fetch(`${API_URL}/productos/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al eliminar producto')
  return true
}

export const actualizarStockMinimo = async (token, id, data) => {
  const res = await fetch(`${API_URL}/inventario/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar stock mínimo')
  return res.json()
}