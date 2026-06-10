import { useState } from 'react'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import { UNIDADES, CATEGORIAS } from '../../utils/inventarioData'
import styles from './ProductoModal.module.css'

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const ProductoEditModal = ({ producto, onClose, onProductoEditado, familias }) => {
  const { isDark } = useThemeStore()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nom_producto: producto.nom_producto || '',
    precio: producto.precio || '',
    cod_unidad_medida: String(producto.cod_unidad_medida),
    cod_categ_producto: String(producto.cod_categ_producto),
    cod_familia: producto.cod_familia ? String(producto.cod_familia) : ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/productos/${producto.id_producto}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nom_producto: form.nom_producto,
          precio: parseInt(form.precio),
          cod_unidad_medida: parseInt(form.cod_unidad_medida),
          cod_categ_producto: parseInt(form.cod_categ_producto),
          cod_familia: form.cod_familia ? parseInt(form.cod_familia) : null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Error al editar el producto')
      }

      onProductoEditado()
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
            Editar Producto
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

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Familia (opcional)</label>
              <select
                name="cod_familia"
                value={form.cod_familia}
                onChange={handleChange}
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="">Sin familia</option>
                {familias.map(f => (
                  <option key={f.cod_familia} value={f.cod_familia}>{f.nom_familia}</option>
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductoEditModal