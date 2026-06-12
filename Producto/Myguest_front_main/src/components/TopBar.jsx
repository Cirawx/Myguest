import styles from './TopBar.module.css'
import useThemeStore from '../store/themeStore'

const TopBar = ({ onToggleSidebar }) => {
  const { isDark, toggleTheme } = useThemeStore()
  return (
    <div className={`${styles.topbar} ${isDark ? styles.dark : styles.light}`}>
      <div className={styles.left}>
        <button className={styles.hamburger} onClick={onToggleSidebar}>
          ☰
        </button>
      </div>
      <div className={styles.center}>
        <div className={styles.duocLogo}>
          <span className={styles.duocText}>Duoc</span>
          <span className={styles.ucText}>UC</span>
        </div>
        <span className={styles.separator}>|</span>
        <span className={styles.carrera}>Carrera de Gastronomía</span>
      </div>
      <div className={styles.right}>
        <button className={styles.themeBtn} onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  )
}

export default TopBar