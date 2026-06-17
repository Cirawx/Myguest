import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { getProveedores, crearOrdenCompra, getProductos } from '../../services/comprasService';
import styles from './ComprasPage.module.css';

export default function ModalCrearOrden({ onClose, onCreado }) {
  const { token } = useAuthStore();
  const { isDark } = useThemeStore();
  const t = isDark ? styles.dark : styles.light;

  const getIdUsuario = () => {
    try {
      return parseInt(JSON.parse(atob(token.split('.')[1])).sub);
    } catch {
      return null;
    }
  };

  const [proveedores, setProveedores]   = useState([]);
  const [productos, setProductos]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [busquedaProd, setBusquedaProd] = useState('');
  const [productosAgregados, setProductosAgregados] = useState([]);
  const [form, setForm] = useState({
    id_proveedor:  '',
    fecha_entrega: '',
    notas:         '',
  });

  useEffect(() => {
    Promise.all([getProveedores(token), getProductos(token)])
      .then(([dataProvs, dataProds]) => {
        setProveedores(dataProvs);
        setProductos(dataProds);
      })
      .catch(() => setError('Error al cargar datos'));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Productos filtrados para autocomplete
  const productosFiltrados = busquedaProd
    ? productos
        .filter(p => p.nom_producto?.toLowerCase().includes(busquedaProd.toLowerCase()))
        .filter(p => !productosAgregados.find(pa => pa.id_producto === p.id_producto))
        .slice(0, 8)
    : [];

  const agregarProducto = (p) => {
    setProductosAgregados(prev => [...prev, {
      id_producto:     p.id_producto,
      nombre:          p.nom_producto,
      cantidad:        1,
      precio_unitario: p.precio || 0,
    }]);
    setBusquedaProd('');
  };

  const quitarProducto = (id) => {
    setProductosAgregados(prev => prev.filter(p => p.id_producto !== id));
  };

  const actualizarCantidad = (id, valor) => {
    setProductosAgregados(prev =>
      prev.map(p => p.id_producto === id ? { ...p, cantidad: parseFloat(valor) || 0 } : p)
    );
  };

  const actualizarPrecio = (id, valor) => {
    setProductosAgregados(prev =>
      prev.map(p => p.id_producto === id ? { ...p, precio_unitario: parseInt(valor) || 0 } : p)
    );
  };

  const handleSubmit = async () => {
    if (!form.id_proveedor)  { setError('Debes seleccionar un proveedor'); return; }
    if (!form.fecha_entrega) { setError('La fecha de entrega es obligatoria'); return; }
    if (productosAgregados.length === 0) { setError('Debes agregar al menos un producto'); return; }
    if (productosAgregados.some(p => p.cantidad <= 0)) { setError('Todas las cantidades deben ser mayores a 0'); return; }

    setLoading(true);
    setError('');
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      await crearOrdenCompra(token, {
        id_proveedor:      parseInt(form.id_proveedor),
        fecha_emision:     hoy,
        fecha_entrega_est: form.fecha_entrega,
        id_usuario:        getIdUsuario(),
        obs:               form.notas || '',
        detalles:          productosAgregados.map(p => ({
          id_producto:     p.id_producto,
          cantidad:        p.cantidad,
          precio_unitario: p.precio_unitario,
        })),
      });
      onCreado();
      onClose();
    } catch {
      setError('Error al crear la orden. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalBox} ${t}`}
        style={{ maxWidth: '560px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitulo}>Crear Orden de Compra</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <p className={styles.modalSubtitulo}>
          Ingresa los datos para crear una nueva orden de compra.
        </p>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Proveedor</label>
          <select
            name="id_proveedor"
            className={`${styles.formSelect} ${t}`}
            value={form.id_proveedor}
            onChange={handleChange}
          >
            <option value="">Seleccionar proveedor</option>
            {proveedores.map(p => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nom_proveedor}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Fecha de Entrega</label>
          <input
            type="date"
            name="fecha_entrega"
            className={`${styles.formInput} ${t}`}
            value={form.fecha_entrega}
            onChange={handleChange}
          />
        </div>

        {/* Productos */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Productos</label>

          {productosAgregados.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {/* Encabezado */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 100px 32px',
                gap: '6px',
                fontSize: '0.75rem',
                color: '#6b7280',
                padding: '0 4px',
              }}>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Precio unit.</span>
                <span></span>
              </div>
              {productosAgregados.map(p => (
                <div key={p.id_producto} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 100px 32px',
                  gap: '6px',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  fontSize: '0.83rem',
                  background: isDark ? '#0f0f0f' : '#f9fafb',
                }}>
                  <span style={{ color: isDark ? '#f9fafb' : '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nombre}
                  </span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={p.cantidad}
                    onChange={e => actualizarCantidad(p.id_producto, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      border: '1px solid #374151',
                      background: isDark ? '#111827' : '#ffffff',
                      color: isDark ? '#f9fafb' : '#111827',
                      fontSize: '0.83rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    value={p.precio_unitario}
                    onChange={e => actualizarPrecio(p.id_producto, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      border: '1px solid #374151',
                      background: isDark ? '#111827' : '#ffffff',
                      color: isDark ? '#f9fafb' : '#111827',
                      fontSize: '0.83rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => quitarProducto(p.id_producto)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '2px',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Buscador */}
          <input
            type="text"
            className={`${styles.formInput} ${t}`}
            placeholder="Buscar producto para agregar..."
            value={busquedaProd}
            onChange={e => setBusquedaProd(e.target.value)}
          />

          {busquedaProd && (
            <div style={{
              border: '1px solid #374151',
              borderRadius: '8px',
              marginTop: '4px',
              overflow: 'hidden',
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              {productosFiltrados.length === 0 ? (
                <div style={{ padding: '10px 12px', color: '#6b7280', fontSize: '0.83rem' }}>
                  Sin resultados
                </div>
              ) : (
                productosFiltrados.map(p => (
                  <div
                    key={p.id_producto}
                    onClick={() => agregarProducto(p)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      borderBottom: '1px solid #1f2937',
                      background: isDark ? '#111827' : '#ffffff',
                      color: isDark ? '#f9fafb' : '#111827',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1f2937' : '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = isDark ? '#111827' : '#ffffff'}
                  >
                    <span>{p.nom_producto}</span>
                    <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>
                      ${p.precio?.toLocaleString('es-CL') || '0'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notas (opcional)</label>
          <textarea
            name="notas"
            className={`${styles.formTextarea} ${t}`}
            placeholder="Instrucciones especiales..."
            value={form.notas}
            onChange={handleChange}
          />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancelar} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.btnConfirmar}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>

      </div>
    </div>
  );
}