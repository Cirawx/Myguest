const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getOrdenesCompra = async (token) => {
  const res = await fetch(`${API_URL}/ordenes-compra/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener órdenes');
  return res.json();
};

export const getOrdenCompra = async (token, id) => {
  const res = await fetch(`${API_URL}/ordenes-compra/${id}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener la orden');
  return res.json();
};

export const crearOrdenCompra = async (token, data) => {
  const res = await fetch(`${API_URL}/ordenes-compra/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear la orden');
  return res.json();
};

export const actualizarEstadoOrden = async (token, id, data) => {
  const res = await fetch(`${API_URL}/ordenes-compra/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar la orden');
  return res.json();
};

export const getProveedores = async (token) => {
  const res = await fetch(`${API_URL}/proveedores/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener proveedores');
  return res.json();
};

export const eliminarOrdenCompra = async (token, id) => {
  const res = await fetch(`${API_URL}/ordenes-compra/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al eliminar la orden');
  return true;
};
export const getProductos = async (token) => {
  const res = await fetch(`${API_URL}/productos/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};