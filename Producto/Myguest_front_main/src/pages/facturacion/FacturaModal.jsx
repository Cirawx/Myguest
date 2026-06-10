import { useState, useEffect } from 'react'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import styles from './FacturaModal.module.css'

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const FacturaModal = ({ onClose, onFacturaCreada }) => {
  const { isDark } = useThemeStore()
  const { token, usuario } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [busquedaProducto, setBusquedaProducto] = useState('')

  const [form, setForm] = useState({
    num_documento: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    id_proveedor: '',
    id_orden_compra: '',
    obs: '',
  })

  const [detalles, setDetalles] = useState([
    { id_producto: '', cantidad: '', precio_unitario: '', fecha_vencimiento: '' }
  ])

  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${token}` }
      const [provRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/proveedores/?todos=true`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/productos/`, { headers }).then(r => r.json()),
      ])
      setProveedores(provRes)
      setProductos(prodRes)
    }
    fetchData()
  }, [token])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleDetalleChange = (index, field, value) => {
    const nuevosDetalles = [...detalles]
    nuevosDetalles[index][field] = value
    setDetalles(nuevosDetalles)
  }

  const agregarDetalle = () => {
    setDetalles([...detalles, { id_producto: '', cantidad: '', precio_unitario: '', fecha_vencimiento: '' }])
  }

  const eliminarDetalle = (index) => {
    if (detalles.length === 1) return
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const productosFiltrados = productos.filter(p =>
    p.nom_producto.toLowerCase().includes(busquedaProducto.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const body = {
        num_documento: form.num_documento,
        fecha_emision: form.fecha_emision,
        id_proveedor: parseInt(form.id_proveedor),
        id_usuario: usuario.id_usuario,
        id_orden_compra: form.id_orden_compra ? parseInt(form.id_orden_compra) : null,
        obs: form.obs || null,
        detalles: detalles.map(d => ({
          id_producto: parseInt(d.id_producto),
          cantidad: parseFloat(d.cantidad),
          precio_unitario: parseInt(d.precio_unitario),
          fecha_vencimiento: d.fecha_vencimiento || null
        }))
      }

      const response = await fetch(`${API_URL}/facturas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Error al crear la factura')
      }

      onFacturaCreada()
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
            Nueva Factura
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Datos factura */}
          <div className={styles.section}>
            <h3 className={`${styles.sectionTitle} ${isDark ? styles.darkText : styles.lightText}`}>
              Datos de la factura
            </h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>N° Documento *</label>
                <input
                  name="num_documento"
                  value={form.num_documento}
                  onChange={handleChange}
                  placeholder="Ej: FAC-001"
                  required
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Fecha emisión *</label>
                <input
                  name="fecha_emision"
                  type="date"
                  value={form.fecha_emision}
                  onChange={handleChange}
                  required
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Proveedor *</label>
                <select
                  name="id_proveedor"
                  value={form.id_proveedor}
                  onChange={handleChange}
                  required
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>{p.nom_proveedor}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>N° Orden de compra</label>
                <input
                  name="id_orden_compra"
                  type="number"
                  value={form.id_orden_compra}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Observaciones</label>
                <textarea
                  name="obs"
                  value={form.obs}
                  onChange={handleChange}
                  placeholder="Observaciones opcionales"
                  rows={2}
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                />
              </div>
            </div>
          </div>

          {/* Detalle productos */}
          <div className={styles.section}>
            <h3 className={`${styles.sectionTitle} ${isDark ? styles.darkText : styles.lightText}`}>
              Productos
            </h3>

            {detalles.map((detalle, index) => (
              <div key={index} className={`${styles.detalleRow} ${isDark ? styles.detalleRowDark : styles.detalleRowLight}`}>
                <div className={styles.detalleGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Producto *</label>
                    <input
                        type="text"
                        value={detalle.busqueda || productos.find(p => p.id_producto === parseInt(detalle.id_producto))?.nom_producto || ''}
                        onChange={(e) => {
                        handleDetalleChange(index, 'busqueda', e.target.value)
                        handleDetalleChange(index, 'id_producto', '')
                        }}
                        placeholder="Buscar producto..."
                        required={!detalle.id_producto}
                        className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                    />
                    {detalle.busqueda && !detalle.id_producto && (
                        <div className={`${styles.sugerencias} ${isDark ? styles.sugerenciasDark : styles.sugerenciasLight}`}>
                        {productos
                            .filter(p => p.nom_producto.toLowerCase().includes(detalle.busqueda.toLowerCase()))
                            .slice(0, 8)
                            .map(p => (
                            <div
                                key={p.id_producto}
                                className={styles.sugerencia}
                                onClick={() => {
                                handleDetalleChange(index, 'id_producto', String(p.id_producto))
                                handleDetalleChange(index, 'busqueda', p.nom_producto)
                                }}
                            >
                                {p.nom_producto}
                            </div>
                            ))}
                        </div>
                    )}
                    </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Cantidad *</label>
                    <input
                      type="number"
                      value={detalle.cantidad}
                      onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                      placeholder="0"
                      required
                      className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Precio unitario *</label>
                    <input
                      type="number"
                      value={detalle.precio_unitario}
                      onChange={(e) => handleDetalleChange(index, 'precio_unitario', e.target.value)}
                      placeholder="0"
                      required
                      className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Fecha vencimiento</label>
                    <input
                      type="date"
                      value={detalle.fecha_vencimiento}
                      onChange={(e) => handleDetalleChange(index, 'fecha_vencimiento', e.target.value)}
                      className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarDetalle(index)}
                  className={styles.eliminarDetalleBtn}
                  disabled={detalles.length === 1}
                >
                  🗑️
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={agregarDetalle}
              className={`${styles.agregarBtn} ${isDark ? styles.agregarBtnDark : styles.agregarBtnLight}`}
            >
              + Agregar producto
            </button>
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
              {loading ? 'Creando...' : 'Crear Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FacturaModal