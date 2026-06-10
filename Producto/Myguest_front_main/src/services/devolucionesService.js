const API_URL = 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getDevoluciones = async (token) => {
  const res = await fetch(`${API_URL}/devoluciones/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener devoluciones');
  return res.json();
};

export const crearDevolucion = async (token, data) => {
  const res = await fetch(`${API_URL}/devoluciones/`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear devolución');
  return res.json();
};

export const eliminarDevolucion = async (token, id) => {
  const res = await fetch(`${API_URL}/devoluciones/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al eliminar devolución');
  return true;
};

export const getAsignaturas = async (token) => {
  const res = await fetch(`${API_URL}/asignaturas/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener asignaturas');
  return res.json();
};

export const getTalleres = async (token, sigla) => {
  const res = await fetch(`${API_URL}/talleres/?sigla=${sigla}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener talleres');
  return res.json();
};

export const getPeriodos = async (token) => {
  const res = await fetch(`${API_URL}/periodos/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener períodos');
  return res.json();
};

export const getProductos = async (token) => {
  const res = await fetch(`${API_URL}/productos/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};

export const getRegistrosTaller = async (token) => {
  const res = await fetch(`${API_URL}/regis-taller/`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Error al obtener registros de taller');
  return res.json();
};