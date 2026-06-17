const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const getFacturas = async (token, filtros = {}) => {
  const params = new URLSearchParams()
  if (filtros.id_proveedor) params.append('id_proveedor', filtros.id_proveedor)
  if (filtros.estado) params.append('estado', filtros.estado)
  const res = await fetch(`${API_URL}/facturas/?${params}`, { headers: getHeaders(token) })
  if (!res.ok) throw new Error('Error al obtener facturas')
  return res.json()
}

export const crearFactura = async (token, data) => {
  const res = await fetch(`${API_URL}/facturas/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al crear factura')
  return res.json()
}

export const actualizarFactura = async (token, id, data) => {
  const res = await fetch(`${API_URL}/facturas/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar factura')
  return res.json()
}

export const eliminarFactura = async (token, id) => {
  const res = await fetch(`${API_URL}/facturas/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al eliminar factura')
  return true
}