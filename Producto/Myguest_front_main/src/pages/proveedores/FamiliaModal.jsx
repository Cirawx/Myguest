import { useState } from 'react'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import styles from './ProveedorModal.module.css'

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const FamiliaModal = ({ familia, proveedores, onClose, onGuardado }) => {
  const { isDark } = useThemeStore()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const esEdicion = !!familia

  const [form, setForm] = useState({
    cod_familia: familia?.cod_familia || '',
    nom_familia: familia?.nom_familia || '',
    id_proveedor: familia?.id_proveedor ? String(familia.id_proveedor) : ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = esEdicion
        ? `http://127.0.0.1:8000/familias/${familia.cod_familia}`
        : 'http://127.0.0.1:8000/familias/'
      const method = esEdicion ? 'PUT' : 'POST'

      const body = esEdicion
        ? {
            nom_familia: form.nom_familia,
            id_proveedor: form.id_proveedor ? parseInt(form.id_proveedor) : null
          }
        : {
            cod_familia: parseInt(form.cod_familia),
            nom_familia: form.nom_familia,
            id_proveedor: form.id_proveedor ? parseInt(form.id_proveedor) : null
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Error al guardar la familia')
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
            {esEdicion ? 'Editar Familia' : 'Nueva Familia'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>

            {!esEdicion && (
              <div className={styles.field}>
                <label className={styles.label}>Código de familia *</label>
                <input
                  name="cod_familia"
                  type="number"
                  value={form.cod_familia}
                  onChange={handleChange}
                  placeholder="Ej: 10"
                  required
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                />
              </div>
            )}

            <div className={`${styles.field} ${!esEdicion ? '' : styles.fullWidth}`}>
              <label className={styles.label}>Nombre de la familia *</label>
              <input
                name="nom_familia"
                value={form.nom_familia}
                onChange={handleChange}
                placeholder="Nombre de la familia"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Proveedor (opcional)</label>
              <select
                name="id_proveedor"
                value={form.id_proveedor}
                onChange={handleChange}
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="">Sin proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>{p.nom_proveedor}</option>
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
              {loading ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Familia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FamiliaModal