const API_URL = 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getMermas = async (token) => {
  const res = await fetch(`${API_URL}/mermas/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener mermas');
  return res.json();
};

export const crearMerma = async (token, data) => {
  const res = await fetch(`${API_URL}/mermas/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear merma');
  return res.json();
};

export const eliminarMerma = async (token, id) => {
  const res = await fetch(`${API_URL}/mermas/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al eliminar merma');
  return true;
};

export const getMotivos = async (token) => {
  const res = await fetch(`${API_URL}/motivos-merma/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener motivos');
  return res.json();
};

export const getProductos = async (token) => {
  const res = await fetch(`${API_URL}/productos/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};