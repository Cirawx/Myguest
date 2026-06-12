import { useEffect, useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import { getReporte } from '../../services/reportesService'
import styles from './ReportesPage.module.css'

const ReportesPage = () => {
  const { isDark } = useThemeStore()
  const { token } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabActiva, setTabActiva] = useState('stock')
  const [filtros, setFiltros] = useState({
    ano_academ: new Date().getFullYear(),
    cod_periodo_academ: '',
    sigla: '',
  })

  const cargarReporte = async () => {
    setLoading(true)
    setError(null)
    try {
      const resultado = await getReporte(token, filtros)
      setData(resultado)
    } catch (err) {
      setError('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarReporte()
  }, [])

  const tabs = [
    { key: 'stock', label: '📦 Stock' },
    { key: 'consumo', label: '🍽️ Consumo' },
    { key: 'facturas', label: '📄 Facturas' },
    { key: 'mermas', label: '🗑️ Mermas y Devoluciones' },
    { key: 'costos', label: '💰 Costos por Asignatura' },
  ]

  const estadoColor = (estado) => {
    if (estado === 'Sin stock') return '#ef4444'
    if (estado === 'Stock crítico') return '#ef4444'
    if (estado === 'Stock bajo') return '#f59e0b'
    return '#22c55e'
  }

  return (
    <MainLayout>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={`${styles.title} ${isDark ? styles.dark : styles.light}`}>
              Reportes
            </h1>
            <p className={styles.subtitle}>Resumen general del sistema</p>
          </div>
        </div>

        {/* Filtros */}
        <div className={`${styles.filtrosCard} ${isDark ? styles.cardDark : styles.cardLight}`}>
          <div className={styles.filtrosGrid}>
            <div className={styles.filtroItem}>
              <label className={styles.filtroLabel}>Año académico</label>
              <input
                type="number"
                className={`${styles.filtroInput} ${isDark ? styles.inputDark : styles.inputLight}`}
                value={filtros.ano_academ}
                onChange={e => setFiltros(f => ({ ...f, ano_academ: e.target.value }))}
                placeholder="Ej: 2026"
              />
            </div>
            <div className={styles.filtroItem}>
              <label className={styles.filtroLabel}>Período</label>
              <select
                className={`${styles.filtroInput} ${isDark ? styles.inputDark : styles.inputLight}`}
                value={filtros.cod_periodo_academ}
                onChange={e => setFiltros(f => ({ ...f, cod_periodo_academ: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="1">1er Semestre</option>
                <option value="2">2do Semestre</option>
              </select>
            </div>
            <div className={styles.filtroItem}>
              <label className={styles.filtroLabel}>Sigla asignatura</label>
              <input
                type="text"
                className={`${styles.filtroInput} ${isDark ? styles.inputDark : styles.inputLight}`}
                value={filtros.sigla}
                onChange={e => setFiltros(f => ({ ...f, sigla: e.target.value.toUpperCase() }))}
                placeholder="Ej: ABT3131"
              />
            </div>
            <button className={styles.btnFiltrar} onClick={cargarReporte}>
              🔍 Generar Reporte
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${tabActiva === tab.key ? styles.tabActiva : ''} ${isDark ? styles.tabDark : styles.tabLight}`}
              onClick={() => setTabActiva(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Cargando reporte...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : (
          <div className={`${styles.tabContent} ${isDark ? styles.cardDark : styles.cardLight}`}>

            {/* Tab Stock */}
            {tabActiva === 'stock' && (
              <div>
                <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                  📦 Estado de Stock — {data.stock.length} productos
                </h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Unidad</th>
                        <th>Stock actual</th>
                        <th>Stock mínimo</th>
                        <th>Diferencia</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stock.map(item => (
                        <tr key={item.id_producto}>
                          <td>{item.nom_producto}</td>
                          <td>{item.nom_categ_producto}</td>
                          <td>{item.nom_unidad_medida}</td>
                          <td>{item.stock_actual}</td>
                          <td>{item.stock_minimo}</td>
                          <td>{item.diferencia}</td>
                          <td>
                            <span className={styles.badge} style={{ backgroundColor: estadoColor(item.estado) + '22', color: estadoColor(item.estado), border: `1px solid ${estadoColor(item.estado)}` }}>
                              {item.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Consumo */}
            {tabActiva === 'consumo' && (
              <div>
                <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                  🍽️ Consumo por Taller — {data.consumo.length} registros
                </h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Sigla</th>
                        <th>Asignatura</th>
                        <th>Taller</th>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio unit.</th>
                        <th>Costo total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.consumo.map((item, i) => (
                        <tr key={i}>
                          <td>{item.sigla}</td>
                          <td>{item.nom_asign}</td>
                          <td>{item.titulo_preparacion || '—'}</td>
                          <td>{item.fecha}</td>
                          <td>{item.nom_producto}</td>
                          <td>{item.cantidad}</td>
                          <td>${item.precio_unitario.toLocaleString('es-CL')}</td>
                          <td>${item.costo_total.toLocaleString('es-CL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Facturas */}
            {tabActiva === 'facturas' && (
              <div>
                <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                  📄 Facturas — {data.facturas.length} documentos
                </h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>N° Documento</th>
                        <th>Fecha emisión</th>
                        <th>Proveedor</th>
                        <th>Estado</th>
                        <th>Productos</th>
                        <th>Monto total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.facturas.map(item => (
                        <tr key={item.id_factura}>
                          <td>{item.num_documento}</td>
                          <td>{item.fecha_emision}</td>
                          <td>{item.nom_proveedor}</td>
                          <td>{item.estado_conciliacion}</td>
                          <td>{item.total_productos}</td>
                          <td>${item.monto_total.toLocaleString('es-CL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Mermas y Devoluciones */}
            {tabActiva === 'mermas' && (
              <div>
                <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                  🗑️ Mermas y Devoluciones — {data.mermas_devoluciones.length} registros
                </h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Motivo</th>
                        <th>Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mermas_devoluciones.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <span className={styles.badge} style={{
                              backgroundColor: item.tipo === 'Merma' ? '#ef444422' : '#22c55e22',
                              color: item.tipo === 'Merma' ? '#ef4444' : '#22c55e',
                              border: `1px solid ${item.tipo === 'Merma' ? '#ef4444' : '#22c55e'}`
                            }}>
                              {item.tipo}
                            </span>
                          </td>
                          <td>{item.fecha}</td>
                          <td>{item.nom_producto}</td>
                          <td>{item.cantidad}</td>
                          <td>{item.motivo}</td>
                          <td>{item.nom_usuario}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Costos por Asignatura */}
            {tabActiva === 'costos' && (
              <div>
                <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                  💰 Costos por Asignatura — {data.costos_asignatura.length} asignaturas
                </h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Sigla</th>
                        <th>Asignatura</th>
                        <th>N° Talleres</th>
                        <th>Costo total</th>
                        <th>Costo promedio/taller</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.costos_asignatura.map(item => (
                        <tr key={item.sigla}>
                          <td>{item.sigla}</td>
                          <td>{item.nom_asign}</td>
                          <td>{item.num_talleres}</td>
                          <td>${item.costo_total.toLocaleString('es-CL')}</td>
                          <td>${item.costo_promedio_taller.toLocaleString('es-CL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ReportesPage