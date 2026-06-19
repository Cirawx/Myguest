import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/login/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import UsuariosPage from '../pages/usuarios/UsuariosPage'
import InventarioPage from '../pages/inventario/InventarioPage'
import ProveedoresPage from '../pages/proveedores/ProveedoresPage'
import FacturacionPage from '../pages/facturacion/FacturacionPage'
import AcademicoPage from '../pages/academico/AcademicoPage'
import ComprasPage from '../pages/compras/ComprasPage'
import MermasPage from '../pages/mermas/MermasPage'
import DevolucionesPage from '../pages/devoluciones/DevolucionesPage'
import ReportesPage from '../pages/reportes/ReportesPage'
import RecetarioPage from '../pages/recetario/RecetarioPage'
import useAuthStore from '../store/authStore'
import { tienePermiso } from '../utils/permisos'

const RutaProtegida = ({ children, modulo }) => {
  const { token, usuario } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  if (modulo && !tienePermiso(usuario?.cod_perfil, modulo, 'ver')) {
    return <Navigate to="/dashboard" />
  }
  return children
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<RutaProtegida modulo="dashboard"><DashboardPage /></RutaProtegida>} />
        <Route path="/usuarios" element={<RutaProtegida modulo="usuarios"><UsuariosPage /></RutaProtegida>} />
        <Route path="/academico" element={<RutaProtegida modulo="academico"><AcademicoPage /></RutaProtegida>} />
        <Route path="/inventario" element={<RutaProtegida modulo="inventario"><InventarioPage /></RutaProtegida>} />
        <Route path="/compras" element={<RutaProtegida modulo="compras"><ComprasPage /></RutaProtegida>} />
        <Route path="/proveedores" element={<RutaProtegida modulo="proveedores"><ProveedoresPage /></RutaProtegida>} />
        <Route path="/facturacion" element={<RutaProtegida modulo="facturacion"><FacturacionPage /></RutaProtegida>} />
        <Route path="/mermas" element={<RutaProtegida modulo="mermas"><MermasPage /></RutaProtegida>} />
        <Route path="/devoluciones" element={<RutaProtegida modulo="devoluciones"><DevolucionesPage /></RutaProtegida>} />
        <Route path="/reportes" element={<RutaProtegida modulo="reportes"><ReportesPage /></RutaProtegida>} />
        <Route path="/recetario" element={<RutaProtegida modulo="recetario"><RecetarioPage /></RutaProtegida>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter