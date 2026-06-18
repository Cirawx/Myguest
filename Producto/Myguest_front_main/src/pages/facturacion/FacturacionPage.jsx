import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./FacturacionPage.module.css";
import FacturaModal from "./FacturaModal";
import FacturaEditModal from "./FacturaEditModal";
import {
  getFacturas,
  eliminarFactura as eliminarFacturaService,
} from "../../services/facturacionService";
import { getProveedores } from "../../services/proveedoresService";
import { getProductos } from "../../services/inventarioService";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "conciliada", label: "Conciliada" },
  { value: "con_diferencia", label: "Con diferencia" },
];

const FacturacionPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [facturaEditar, setFacturaEditar] = useState(null);
  const [itemEliminar, setItemEliminar] = useState(null);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    fetchData();
  }, [token, filtroProveedor, filtroEstado]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facturasRes, proveedoresRes, productosRes] = await Promise.all([
        getFacturas(token, {
          id_proveedor: filtroProveedor,
          estado: filtroEstado,
        }),
        getProveedores(token, true),
        getProductos(token),
      ]);
      setFacturas(facturasRes);
      setProveedores(proveedoresRes);
      setProductos(productosRes);
    } catch (err) {
      console.error("Error cargando facturas:", err);
    } finally {
      setLoading(false);
    }
  };

  const eliminarFactura = async () => {
    try {
      await eliminarFacturaService(token, itemEliminar.id_factura);
      setItemEliminar(null);
      setExpandido(null);
      fetchData();
    } catch (err) {
      console.error("Error eliminando factura:", err);
    }
  };

  const getNombreProveedor = (id) => {
    const p = proveedores.find((p) => p.id_proveedor === id);
    return p ? p.nom_proveedor : `Proveedor #${id}`;
  };

  const getBadgeEstado = (estado) => {
    if (estado === "pendiente") return styles.badgePendiente;
    if (estado === "conciliada") return styles.badgeConciliada;
    return styles.badgeDiferencia;
  };

  const getNombreProducto = (id) => {
    const p = productos.find((p) => p.id_producto === id);
    return p ? p.nom_producto : `Producto #${id}`;
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1
              className={`${styles.title} ${isDark ? styles.dark : styles.light}`}
            >
              Facturación
            </h1>
            <p className={styles.subtitle}>
              Gestión de facturas e ingreso de mercadería
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className={styles.newBtn}
              onClick={() => navigate('/facturacion/ingesta')}
              style={{ background: '#2563eb' }}
              title="Subir factura PDF/foto y extraer datos automáticamente con OCR"
            >
              📥 Subir con OCR
            </button>
            <button
              className={styles.newBtn}
              onClick={() => setMostrarModal(true)}
            >
              + Nueva Factura
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className={styles.filtros}>
          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className={`${styles.select} ${isDark ? styles.inputDark : styles.inputLight}`}
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nom_proveedor}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={`${styles.select} ${isDark ? styles.inputDark : styles.inputLight}`}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className={styles.loading}>Cargando facturas...</div>
        ) : (
          <div
            className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <div
              className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
            >
              <span>N° Documento</span>
              <span>Proveedor</span>
              <span>Fecha emisión</span>
              <span>Estado</span>
              <span></span>
            </div>

            {facturas.length === 0 ? (
              <p className={styles.empty}>No hay facturas registradas</p>
            ) : (
              facturas.map((f) => (
                <div key={f.id_factura}>
                  <div
                    onClick={() =>
                      setExpandido(
                        expandido === f.id_factura ? null : f.id_factura,
                      )
                    }
                    className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight} ${expandido === f.id_factura ? styles.tablaRowActive : ""}`}
                  >
                    <span
                      className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                    >
                      {f.num_documento}
                    </span>
                    <span className={styles.cod}>
                      {getNombreProveedor(f.id_proveedor)}
                    </span>
                    <span className={styles.cod}>{f.fecha_emision}</span>
                    <span
                      className={`${styles.badge} ${getBadgeEstado(f.estado_conciliacion)}`}
                    >
                      {f.estado_conciliacion}
                    </span>
                    <span
                      className={`${styles.chevron} ${expandido === f.id_factura ? styles.chevronOpen : ""}`}
                    >
                      ›
                    </span>
                  </div>

                  {expandido === f.id_factura && (
                    <div
                      className={`${styles.acordeon} ${isDark ? styles.acordeonDark : styles.acordeonLight}`}
                    >
                      <div className={styles.acordeonGrid}>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>
                            N° Documento
                          </span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {f.num_documento}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>
                            Proveedor
                          </span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {getNombreProveedor(f.id_proveedor)}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>
                            Fecha emisión
                          </span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {f.fecha_emision}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>
                            Fecha ingreso
                          </span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {f.fecha_ingreso
                              ? new Date(f.fecha_ingreso).toLocaleString()
                              : "—"}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>Estado</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {f.estado_conciliacion}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>
                            Observaciones
                          </span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {f.obs || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Detalle productos */}
                      <div className={styles.detalleSection}>
                        <h4
                          className={`${styles.detalleTitulo} ${isDark ? styles.dark : styles.light}`}
                        >
                          Productos
                        </h4>
                        <div
                          className={`${styles.detalleTabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
                        >
                          <div
                            className={`${styles.detalleHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
                          >
                            <span>Producto</span>
                            <span>Cantidad</span>
                            <span>Precio unitario</span>
                            <span>Vencimiento</span>
                          </div>
                          {f.detalles.map((d, i) => (
                            <div
                              key={i}
                              className={`${styles.detalleRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight}`}
                            >
                              <span
                                className={`${styles.cod} ${isDark ? styles.dark : styles.light}`}
                              >
                                {getNombreProducto(d.id_producto)}
                              </span>
                              <span className={styles.cod}>{d.cantidad}</span>
                              <span className={styles.precio}>
                                ${d.precio_unitario.toLocaleString()}
                              </span>
                              <span className={styles.cod}>
                                {d.fecha_vencimiento || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.acordeonAcciones}>
                        <button
                          className={styles.editBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFacturaEditar(f);
                          }}
                        >
                          ✏️ Editar estado
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemEliminar(f);
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            <div className={styles.tablaFooter}>
              <span className={styles.total}>{facturas.length} facturas</span>
            </div>
          </div>
        )}

        {/* Modal confirmación eliminar */}
        {itemEliminar && (
          <div className={styles.overlay}>
            <div
              className={`${styles.confirmModal} ${isDark ? styles.tablaDark : styles.tablaLight}`}
            >
              <h3 className={`${isDark ? styles.dark : styles.light}`}>
                ¿Eliminar factura?
              </h3>
              <p className={styles.confirmText}>
                Esta acción no se puede deshacer. ¿Estás seguro de eliminar la
                factura <strong>{itemEliminar.num_documento}</strong>?
              </p>
              <div className={styles.acordeonAcciones}>
                <button
                  className={`${styles.cancelBtn} ${isDark ? styles.cancelDark : styles.cancelLight}`}
                  onClick={() => setItemEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  className={styles.deleteConfirmBtn}
                  onClick={eliminarFactura}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
        {mostrarModal && (
          <FacturaModal
            onClose={() => setMostrarModal(false)}
            onFacturaCreada={fetchData}
          />
        )}

        {facturaEditar && (
          <FacturaEditModal
            factura={facturaEditar}
            onClose={() => setFacturaEditar(null)}
            onGuardado={fetchData}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default FacturacionPage;