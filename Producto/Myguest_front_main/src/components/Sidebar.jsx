import { NavLink, useNavigate } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import styles from './Sidebar.module.css'

const menuItems = [
  { path: '/dashboard',   label: 'Dashboard',   icon: '📊' },
  { path: '/usuarios',    label: 'Usuarios',    icon: '👤' },
  { path: '/academico',   label: 'Académico',   icon: '🎓' },
  { path: '/inventario',  label: 'Inventario',  icon: '📦' },
  { path: '/proveedores', label: 'Proveedores', icon: '🏭' },
  { path: '/compras',     label: 'Compras',     icon: '🛒' },
  { path: '/facturacion', label: 'Facturación', icon: '📄' },
  { path: '/mermas',      label: 'Mermas',      icon: '🗑️' },
  { path: '/devoluciones', label: 'Devoluciones', icon: '↩️' },
  { path: '/reportes',    label: 'Reportes',    icon: '📈' },
  { path: '/recetario',    label: 'Recetario',    icon: '📋' },
]

const Sidebar = ({ isOpen, onClose }) => {
  const { isDark } = useThemeStore()
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay — aparece en tablet/móvil cuando el sidebar está abierto */}
      <div
        className={`${styles.overlay} ${!isOpen ? styles.overlayHidden : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isDark ? styles.dark : styles.light} ${isOpen ? styles.open : styles.closed}`}>

        {/* Info usuario */}
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

        {/* Menú */}
        <nav className={styles.nav}>
          {menuItems.map((item) => (
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

        {/* Logout */}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>

      </aside>
    </>
  )
}

export default Sidebar