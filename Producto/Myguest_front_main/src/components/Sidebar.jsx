import { NavLink, useNavigate } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { tienePermiso } from '../utils/permisos'
import styles from './Sidebar.module.css'

const menuItems = [
  { path: '/dashboard',    label: 'Dashboard',    icon: '📊', modulo: 'dashboard' },
  { path: '/usuarios',     label: 'Usuarios',     icon: '👤', modulo: 'usuarios' },
  { path: '/academico',    label: 'Académico',    icon: '🎓', modulo: 'academico' },
  { path: '/recetario',    label: 'Programación',    icon: '📋', modulo: 'recetario' },
  { path: '/inventario',   label: 'Inventario',   icon: '📦', modulo: 'inventario' },
  { path: '/proveedores',  label: 'Proveedores',  icon: '🏭', modulo: 'proveedores' },
  { path: '/compras',      label: 'Compras',      icon: '🛒', modulo: 'compras' },
  { path: '/facturacion',  label: 'Facturación',  icon: '📄', modulo: 'facturacion' },
  { path: '/mermas',       label: 'Mermas',       icon: '🗑️', modulo: 'mermas' },
  { path: '/devoluciones', label: 'Devoluciones', icon: '↩️', modulo: 'devoluciones' },
  { path: '/reportes',     label: 'Reportes',     icon: '📈', modulo: 'reportes' },
]

const Sidebar = ({ isOpen, onClose }) => {
  const { isDark } = useThemeStore()
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuVisible = menuItems.filter(item =>
    tienePermiso(usuario?.cod_perfil, item.modulo, 'ver')
  )

  return (
    <>
      <div
        className={`${styles.overlay} ${!isOpen ? styles.overlayHidden : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${isDark ? styles.dark : styles.light} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {usuario?.nom?.charAt(0)}{usuario?.primer_apellido?.charAt(0)}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{usuario?.nom} {usuario?.primer_apellido}</span>
            <span className={styles.userRole}>
              {usuario?.cod_perfil === 0 ? 'Administrador TI' : usuario?.cod_perfil === 1 ? 'Admin Carrera' : 'Docente'}
            </span>
          </div>
        </div>
        <nav className={styles.nav}>
          {menuVisible.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''} ${isDark ? styles.navDark : styles.navLight}`
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </aside>
    </>
  )
}

export default Sidebar