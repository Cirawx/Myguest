const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

export const getDashboardData = async (token) => {
  const headers = { Authorization: `Bearer ${token}` }

  const [usuarios, productos, inventarioAlertas, proveedores, inventario] = await Promise.all([
    fetch(`${API_URL}/usuarios/`, { headers }).then(r => r.json()),
    fetch(`${API_URL}/productos/`, { headers }).then(r => r.json()),
    fetch(`${API_URL}/inventario/alertas`, { headers }).then(r => r.json()),
    fetch(`${API_URL}/proveedores/`, { headers }).then(r => r.json()),
    fetch(`${API_URL}/inventario/`, { headers }).then(r => r.json()),
  ])

  const stockOrdenado = inventario
    .filter(i => i.stock_actual !== null)
    .sort((a, b) => a.stock_actual - b.stock_actual)
    .slice(0, 5)

  return {
    totalUsuarios: usuarios.length,
    totalProductos: productos.length,
    stockCritico: inventarioAlertas.length,
    totalProveedores: proveedores.length,
    alertas: inventarioAlertas,
    stockBajo: stockOrdenado
  }
}