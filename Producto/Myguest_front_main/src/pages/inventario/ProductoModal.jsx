import { useState } from 'react'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import styles from './ProductoModal.module.css'
import { UNIDADES, CATEGORIAS } from '../../utils/inventarioData'

const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const ProductoModal = ({ onClose, onProductoCreado }) => {
  const { isDark } = useThemeStore()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nom_producto: '',
    precio: '',
    cod_unidad_medida: '1',
    cod_categ_producto: '0',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/productos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nom_producto: form.nom_producto,
          precio: parseInt(form.precio),
          cod_unidad_medida: parseInt(form.cod_unidad_medida),
          cod_categ_producto: parseInt(form.cod_categ_producto),
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Error al crear el producto')
      }

      onProductoCreado()
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
            Nuevo Producto
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Nombre del producto *</label>
              <input
                name="nom_producto"
                value={form.nom_producto}
                onChange={handleChange}
                placeholder="Nombre del producto"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Precio *</label>
              <input
                name="precio"
                type="number"
                value={form.precio}
                onChange={handleChange}
                placeholder="0"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Unidad de medida *</label>
              <select
                name="cod_unidad_medida"
                value={form.cod_unidad_medida}
                onChange={handleChange}
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                {UNIDADES.map(u => (
                  <option key={u.cod} value={u.cod}>{u.nom}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Categoría *</label>
              <select
                name="cod_categ_producto"
                value={form.cod_categ_producto}
                onChange={handleChange}
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                {CATEGORIAS.map(c => (
                  <option key={c.cod} value={c.cod}>{c.nom}</option>
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
              {loading ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductoModal