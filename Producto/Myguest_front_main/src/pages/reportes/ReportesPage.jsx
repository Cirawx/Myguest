import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
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
    { key: 'stock',        label: '📦 Stock' },
    { key: 'consumo',      label: '🍽️ Consumo' },
    { key: 'facturas',     label: '📄 Facturas' },
    { key: 'mermas',       label: '🗑️ Mermas' },
    { key: 'devoluciones', label: '↩️ Devoluciones' },
    { key: 'costos',       label: '💰 Costos por Asignatura' },
  ]

  const estadoColor = (estado) => {
    if (estado === 'Sin stock')     return '#ef4444'
    if (estado === 'Stock crítico') return '#ef4444'
    if (estado === 'Stock bajo')    return '#f59e0b'
    return '#22c55e'
  }

  // Separa el array combinado del backend en dos listas
  const soloMermas = data?.mermas_devoluciones?.filter(item => item.tipo === 'Merma') || []
  const soloDevoluciones = data?.mermas_devoluciones?.filter(item => item.tipo === 'Devolucion') || []

  // ── Exportar Excel ──────────────────────────────────────
  const exportarExcel = (datos, nombreArchivo, columnas) => {
    const hoja = XLSX.utils.json_to_sheet(datos.map(item => {
      const fila = {}
      columnas.forEach(col => { fila[col.titulo] = item[col.campo] })
      return fila
    }))
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte')
    XLSX.writeFile(libro, `${nombreArchivo}_${filtros.ano_academ}.xlsx`)
  }

  const exportarStock = () => exportarExcel(data.stock, 'reporte_stock', [
    { titulo: 'Producto',      campo: 'nom_producto' },
    { titulo: 'Categoría',     campo: 'nom_categ_producto' },
    { titulo: 'Unidad',        campo: 'nom_unidad_medida' },
    { titulo: 'Stock actual',  campo: 'stock_actual' },
    { titulo: 'Stock mínimo',  campo: 'stock_minimo' },
    { titulo: 'Diferencia',    campo: 'diferencia' },
    { titulo: 'Estado',        campo: 'estado' },
  ])

  const exportarConsumo = () => exportarExcel(data.consumo, 'reporte_consumo', [
    { titulo: 'Sigla',        campo: 'sigla' },
    { titulo: 'Asignatura',   campo: 'nom_asign' },
    { titulo: 'Taller',       campo: 'titulo_preparacion' },
    { titulo: 'Fecha',        campo: 'fecha' },
    { titulo: 'Producto',     campo: 'nom_producto' },
    { titulo: 'Cantidad',     campo: 'cantidad' },
    { titulo: 'Precio unit.', campo: 'precio_unitario' },
    { titulo: 'Costo total',  campo: 'costo_total' },
  ])

  const exportarFacturas = () => exportarExcel(data.facturas, 'reporte_facturas', [
    { titulo: 'N° Documento',  campo: 'num_documento' },
    { titulo: 'Fecha emisión', campo: 'fecha_emision' },
    { titulo: 'Proveedor',     campo: 'nom_proveedor' },
    { titulo: 'Estado',        campo: 'estado_conciliacion' },
    { titulo: 'Productos',     campo: 'total_productos' },
    { titulo: 'Monto total',   campo: 'monto_total' },
  ])

  const exportarMermas = () => exportarExcel(soloMermas, 'reporte_mermas', [
    { titulo: 'Fecha',     campo: 'fecha' },
    { titulo: 'Producto',  campo: 'nom_producto' },
    { titulo: 'Cantidad',  campo: 'cantidad' },
    { titulo: 'Motivo',    campo: 'motivo' },
    { titulo: 'Usuario',   campo: 'nom_usuario' },
  ])

  const exportarDevoluciones = () => exportarExcel(soloDevoluciones, 'reporte_devoluciones', [
    { titulo: 'Fecha',     campo: 'fecha' },
    { titulo: 'Producto',  campo: 'nom_producto' },
    { titulo: 'Cantidad',  campo: 'cantidad' },
    { titulo: 'Motivo',    campo: 'motivo' },
    { titulo: 'Usuario',   campo: 'nom_usuario' },
  ])

  const exportarCostos = () => exportarExcel(data.costos_asignatura, 'reporte_costos', [
    { titulo: 'Sigla',                 campo: 'sigla' },
    { titulo: 'Asignatura',            campo: 'nom_asign' },
    { titulo: 'N° Talleres',           campo: 'num_talleres' },
    { titulo: 'Costo total',           campo: 'costo_total' },
    { titulo: 'Costo promedio/taller', campo: 'costo_promedio_taller' },
  ])

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
                <div className={styles.tabHeader}>
                  <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                    📦 Estado de Stock — {data.stock.length} productos
                  </h2>
                  <button className={styles.btnExportar} onClick={exportarStock}>
                    ⬇️ Descargar Excel
                  </button>
                </div>
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
                            <span className={styles.badge} style={{
                              backgroundColor: estadoColor(item.estado) + '22',
                              color: estadoColor(item.estado),
                              border: `1px solid ${estadoColor(item.estado)}`
                            }}>
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
                <div className={styles.tabHeader}>
                  <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                    🍽️ Consumo por Taller — {data.consumo.length} registros
                  </h2>
                  <button className={styles.btnExportar} onClick={exportarConsumo}>
                    ⬇️ Descargar Excel
                  </button>
                </div>
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
                <div className={styles.tabHeader}>
                  <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                    📄 Facturas — {data.facturas.length} documentos
                  </h2>
                  <button className={styles.btnExportar} onClick={exportarFacturas} disabled={data.facturas.length === 0}>
                    ⬇️ Descargar Excel
                  </button>
                </div>
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
                      {data.facturas.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>No hay facturas para los filtros seleccionados</td></tr>
                      ) : (
                        data.facturas.map(item => (
                          <tr key={item.id_factura}>
                            <td>{item.num_documento}</td>
                            <td>{item.fecha_emision}</td>
                            <td>{item.nom_proveedor}</td>
                            <td>{item.estado_conciliacion}</td>
                            <td>{item.total_productos}</td>
                            <td>${item.monto_total.toLocaleString('es-CL')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Mermas (separado de Devoluciones) */}
            {tabActiva === 'mermas' && (
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                    🗑️ Mermas — {soloMermas.length} registros
                  </h2>
                  <button className={styles.btnExportar} onClick={exportarMermas} disabled={soloMermas.length === 0}>
                    ⬇️ Descargar Excel
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Motivo</th>
                        <th>Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soloMermas.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>No hay mermas para los filtros seleccionados</td></tr>
                      ) : (
                        soloMermas.map((item, i) => (
                          <tr key={i}>
                            <td>{item.fecha}</td>
                            <td>{item.nom_producto}</td>
                            <td>{item.cantidad}</td>
                            <td>{item.motivo}</td>
                            <td>{item.nom_usuario}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Devoluciones (separado de Mermas) */}
            {tabActiva === 'devoluciones' && (
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                    ↩️ Devoluciones — {soloDevoluciones.length} registros
                  </h2>
                  <button className={styles.btnExportar} onClick={exportarDevoluciones} disabled={soloDevoluciones.length === 0}>
                    ⬇️ Descargar Excel
                  </button>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Motivo</th>
                        <th>Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soloDevoluciones.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>No hay devoluciones para los filtros seleccionados</td></tr>
                      ) : (
                        soloDevoluciones.map((item, i) => (
                          <tr key={i}>
                            <td>{item.fecha}</td>
                            <td>{item.nom_producto}</td>
                            <td>{item.cantidad}</td>
                            <td>{item.motivo}</td>
                            <td>{item.nom_usuario}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Costos por Asignatura */}
            {tabActiva === 'costos' && (
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={`${styles.tabTitle} ${isDark ? styles.dark : styles.light}`}>
                    💰 Costos por Asignatura — {data.costos_asignatura.length} asignaturas
                  </h2>
                  <button className={styles.btnExportar} onClick={exportarCostos}>
                    ⬇️ Descargar Excel
                  </button>
                </div>
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