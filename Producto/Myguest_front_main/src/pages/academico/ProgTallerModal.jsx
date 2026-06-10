import { useState, useEffect } from 'react'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import styles from './AcademicoModal.module.css'

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const ProgTallerModal = ({ asignaturas, periodos, usuarios, onClose, onGuardado }) => {
  const { isDark } = useThemeStore()
  const { token, usuario } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [talleres, setTalleres] = useState([])

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    ano_academ: new Date().getFullYear(),
    cod_periodo_academ: '',
    sigla: '',
    seccion: '',
    id_taller: '',
    id_usuario: usuario?.id_usuario || ''
  })

  useEffect(() => {
    if (form.sigla) fetchTalleres()
  }, [form.sigla])

  const fetchTalleres = async () => {
    try {
      const res = await fetch(`${API_URL}/talleres/?sigla=${form.sigla}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTalleres(data)
    } catch (err) {
      console.error('Error cargando talleres:', err)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/prog-taller/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fecha: form.fecha,
          ano_academ: parseInt(form.ano_academ),
          cod_periodo_academ: parseInt(form.cod_periodo_academ),
          sigla: form.sigla,
          seccion: parseInt(form.seccion),
          id_taller: parseInt(form.id_taller),
          id_usuario: parseInt(form.id_usuario)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Error al programar el taller')
      }

      onGuardado()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${isDark ? styles.dark : styles.light}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={`${styles.title} ${isDark ? styles.darkText : styles.lightText}`}>
            Programar Taller
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>

            <div className={styles.field}>
              <label className={styles.label}>Fecha *</label>
              <input
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Año académico *</label>
              <input
                name="ano_academ"
                type="number"
                value={form.ano_academ}
                onChange={handleChange}
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Período *</label>
              <select
                name="cod_periodo_academ"
                value={form.cod_periodo_academ}
                onChange={handleChange}
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="">Seleccionar período</option>
                {periodos.map(p => (
                  <option key={p.cod_periodo_academ} value={p.cod_periodo_academ}>
                    {p.nom_periodo_academ}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sección *</label>
              <input
                name="seccion"
                type="number"
                value={form.seccion}
                onChange={handleChange}
                placeholder="Ej: 1"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Asignatura *</label>
              <select
                name="sigla"
                value={form.sigla}
                onChange={handleChange}
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="">Seleccionar asignatura</option>
                {asignaturas.map(a => (
                  <option key={a.sigla} value={a.sigla}>
                    {a.nom_asign}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Taller *</label>
              <select
                name="id_taller"
                value={form.id_taller}
                onChange={handleChange}
                required
                disabled={!form.sigla}
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="">Seleccionar taller</option>
                {talleres.map(t => (
                  <option key={t.id_taller} value={t.id_taller}>
                    Semana {t.semana} — {t.titulo_preparacion}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Docente *</label>
              <select
                name="id_usuario"
                value={form.id_usuario}
                onChange={handleChange}
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="">Seleccionar docente</option>
                {usuarios.map(u => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nom} {u.primer_apellido}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.acciones}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.cancelBtn} ${isDark ? styles.cancelDark : styles.cancelLight}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? 'Programando...' : 'Programar Taller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProgTallerModal