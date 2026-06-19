import { useState, useEffect } from "react";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import {
  getMermas,
  getMotivos,
  getProductos,
  eliminarMerma,
} from "../../services/mermasService";
import MainLayout from "../../layouts/MainLayout";
import ModalCrearMerma from "./ModalCrearMerma";
import styles from "./MermasPage.module.css";
import { tienePermiso } from "../../utils/permisos";

const MOTIVO_CONFIG = {
  1: { label: "Vencimiento", clase: styles.badgeVencimiento },
  2: { label: "Mal estado al ingreso", clase: styles.badgeDano },
  3: { label: "Daño en bodega", clase: styles.badgeDano },
  4: { label: "Error de preparación", clase: styles.badgeError },
  5: { label: "Otro", clase: styles.badgeOtro },
};

export default function MermasPage() {
  const { token, usuario } = useAuthStore();
  const { isDark } = useThemeStore();
  const t = isDark ? styles.dark : styles.light;

  const [mermas, setMermas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("todos");
  const [modalCrear, setModalCrear] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [dataMermas, dataProductos] = await Promise.all([
        getMermas(token),
        getProductos(token),
      ]);
      setMermas(dataMermas);
      setProductos(dataProductos);
    } catch {
      setError(
        "Error al cargar las mermas. Verifica que el backend esté corriendo.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getNombreProducto = (id) => {
    const p = productos.find((p) => p.id_producto === id);
    return p ? p.nom_producto : `Producto #${id}`;
  };

  // Stats
  const totalMermas = mermas.length;
  const totalCantidad = mermas.reduce((acc, m) => acc + m.cantidad, 0);
  const porVencimiento = mermas.filter((m) => m.cod_motivo_merma === 1).length;
  const porDano = mermas.filter(
    (m) => m.cod_motivo_merma === 2 || m.cod_motivo_merma === 3,
  ).length;

  // Filtros
  const mermasFiltradas = mermas.filter((m) => {
    const texto = busqueda.toLowerCase();
    const nombre = getNombreProducto(m.id_producto).toLowerCase();
    const coincideTexto = nombre.includes(texto);
    const coincideMotivo =
      filtroMotivo === "todos" || m.cod_motivo_merma === parseInt(filtroMotivo);
    return coincideTexto && coincideMotivo;
  });

  const handleEliminar = async (id) => {
    try {
      await eliminarMerma(token, id);
      setConfirmEliminar(null);
      cargarDatos();
    } catch {
      setError("Error al eliminar la merma");
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={`${styles.titulo} ${t}`}>Mermas y Pérdidas</h1>
            <p className={styles.subtitulo}>
              Registro y control de productos dados de baja
            </p>
          </div>
          <button
            className={styles.btnNueva}
            onClick={() => setModalCrear(true)}
          >
            + Registrar Merma
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${t}`}>
            <div className={`${styles.statIcon} ${styles.statIconRojo}`}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6m4-6v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <div>
              <p className={styles.statNumero}>{totalMermas}</p>
              <p className={styles.statLabel}>Total Registros</p>
            </div>
          </div>

          <div className={`${styles.statCard} ${t}`}>
            <div className={`${styles.statIcon} ${styles.statIconAmarillo}`}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <p className={styles.statNumero}>{totalCantidad.toFixed(1)}</p>
              <p className={styles.statLabel}>Unidades Perdidas</p>
            </div>
          </div>

          <div className={`${styles.statCard} ${t}`}>
            <div className={`${styles.statIcon} ${styles.statIconMorado}`}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className={styles.statNumero}>{porVencimiento}</p>
              <p className={styles.statLabel}>Por Vencimiento</p>
            </div>
          </div>

          <div className={`${styles.statCard} ${t}`}>
            <div className={`${styles.statIcon} ${styles.statIconAmarillo}`}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className={styles.statNumero}>{porDano}</p>
              <p className={styles.statLabel}>Por Daño</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarIzq}>
            <div className={styles.buscadorWrap}>
              <svg
                className={styles.buscadorIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={`${styles.buscador} ${t}`}
                placeholder="Buscar por producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select
              className={`${styles.filtroSelect} ${t}`}
              value={filtroMotivo}
              onChange={(e) => setFiltroMotivo(e.target.value)}
            >
              <option value="todos">Todos los motivos</option>
              <option value="1">Vencimiento</option>
              <option value="2">Mal estado al ingreso</option>
              <option value="3">Daño en bodega</option>
              <option value="4">Error de preparación</option>
              <option value="5">Otro</option>
            </select>
          </div>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Tabla */}
        <div className={`${styles.tablaWrap} ${t}`}>
          <table className={styles.tabla}>
            <thead>
              <tr className={t}>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Valor pérdida</th>
                <th>Motivo</th>
                <th>Fecha</th>
                <th>Observación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.estadoTabla}>
                    Cargando mermas...
                  </td>
                </tr>
              ) : mermasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.estadoTabla}>
                    No hay mermas registradas
                  </td>
                </tr>
              ) : (
                mermasFiltradas.map((m) => {
                  const config = MOTIVO_CONFIG[m.cod_motivo_merma] || {
                    label: "Otro",
                    clase: styles.badgeOtro,
                  };
                  return (
                    <tr key={m.id_merma} className={t}>
                      <td className={styles.tdNombre}>
                        {getNombreProducto(m.id_producto)}
                      </td>
                      <td className={styles.tdCantidad}>{m.cantidad}</td>
                      <td className={styles.tdCantidad}>
                        $
                        {(() => {
                          const prod = productos.find(
                            (p) => p.id_producto === m.id_producto,
                          );
                          return prod
                            ? (m.cantidad * prod.precio).toLocaleString("es-CL")
                            : "—";
                        })()}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${config.clase}`}>
                          {config.label}
                        </span>
                      </td>
                      <td>{m.fecha}</td>
                      <td>{m.obs || "-"}</td>
                      <td>
                        {tienePermiso(
                          usuario?.cod_perfil,
                          "mermas",
                          "eliminar",
                        ) &&
                          (confirmEliminar === m.id_merma ? (
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#ef4444",
                                }}
                              >
                                ¿Eliminar?
                              </span>
                              <button
                                className={styles.btnConfirmar}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "0.75rem",
                                }}
                                onClick={() => handleEliminar(m.id_merma)}
                              >
                                Sí
                              </button>
                              <button
                                className={styles.btnCancelar}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "0.75rem",
                                }}
                                onClick={() => setConfirmEliminar(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              className={styles.btnEliminar}
                              onClick={() => setConfirmEliminar(m.id_merma)}
                              title="Eliminar"
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6m4-6v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {modalCrear && (
          <ModalCrearMerma
            onClose={() => setModalCrear(false)}
            onCreado={cargarDatos}
          />
        )}
      </div>
    </MainLayout>
  );
}
