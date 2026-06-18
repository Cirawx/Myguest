import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/login/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import UsuariosPage from '../pages/usuarios/UsuariosPage'
import EnConstruccion from '../pages/EnConstruccion'
import useAuthStore from '../store/authStore'
import InventarioPage from '../pages/inventario/InventarioPage'
import ProveedoresPage from '../pages/proveedores/ProveedoresPage'
import FacturacionPage from '../pages/facturacion/FacturacionPage'
import IngestaFacturaPage from '../pages/facturacion/IngestaFacturaPage'
import AcademicoPage from '../pages/academico/AcademicoPage'
import ComprasPage from '../pages/compras/ComprasPage';
import MermasPage from '../pages/mermas/MermasPage';
import DevolucionesPage from '../pages/devoluciones/DevolucionesPage';
import ReportesPage from '../pages/reportes/ReportesPage'
import RecetarioPage from '../pages/recetario/RecetarioPage'

const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/usuarios" element={<PrivateRoute><UsuariosPage /></PrivateRoute>} />
        <Route path="/academico" element={<PrivateRoute><AcademicoPage /></PrivateRoute>} />
        <Route path="/inventario" element={<PrivateRoute><InventarioPage /></PrivateRoute>} />
        <Route path="/compras" element={<PrivateRoute><ComprasPage /></PrivateRoute>} />
        <Route path="/proveedores" element={<PrivateRoute><ProveedoresPage /></PrivateRoute>} />
        <Route path="/facturacion" element={<PrivateRoute><FacturacionPage /></PrivateRoute>} />
        <Route path="/facturacion/ingesta" element={<PrivateRoute><IngestaFacturaPage /></PrivateRoute>} />
        <Route path="/mermas" element={<PrivateRoute><MermasPage /></PrivateRoute>} />
        <Route path="/devoluciones" element={<PrivateRoute><DevolucionesPage /></PrivateRoute>} />
        <Route path="/reportes" element={<PrivateRoute><ReportesPage /></PrivateRoute>} />
        <Route path="/recetario" element={<PrivateRoute><RecetarioPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter