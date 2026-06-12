import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import {
  getRecetas,
  getRecetaDetalle,
  getDisponibilidad,
  getRecetaEscalada,
} from "../../services/recetarioService";
import styles from "./RecetarioPage.module.css";

const RecetarioPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();

  const [recetas, setRecetas] = useState([]);
  const [recetasFiltradas, setRecetasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroSigla, setFiltroSigla] = useState("");

  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [escalado, setEscalado] = useState(null);
  const [alumnos, setAlumnos] = useState(1);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [tabDetalle, setTabDetalle] = useState("ingredientes");

  const cargarRecetas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecetas(token);
      setRecetas(data);
      setRecetasFiltradas(data);
    } catch (err) {
      setError("Error al cargar las recetas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRecetas();
  }, []);

  useEffect(() => {
    if (!filtroSigla.trim()) {
      setRecetasFiltradas(recetas);
    } else {
      setRecetasFiltradas(
        recetas.filter((r) =>
          r.sigla.toLowerCase().includes(filtroSigla.toLowerCase()),
        ),
      );
    }
  }, [filtroSigla, recetas]);

  const abrirDetalle = async (receta) => {
    setRecetaSeleccionada(receta);
    setDetalle(null);
    setDisponibilidad(null);
    setEscalado(null);
    setTabDetalle("ingredientes");
    setLoadingDetalle(true);
    try {
      const [det, disp] = await Promise.all([
        getRecetaDetalle(token, receta.id_taller),
        getDisponibilidad(token, receta.id_taller, alumnos),
      ]);
      setDetalle(det);
      setDisponibilidad(disp);
    } catch (err) {
      console.error("Error cargando detalle:", err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const calcularEscalado = async () => {
    if (!recetaSeleccionada) return;
    try {
      const data = await getRecetaEscalada(
        token,
        recetaSeleccionada.id_taller,
        alumnos,
      );
      setEscalado(data);
      setTabDetalle("escalado");
    } catch (err) {
      console.error("Error calculando escalado:", err);
    }
  };

  const verificarDisponibilidad = async () => {
    if (!recetaSeleccionada) return;
    try {
      const data = await getDisponibilidad(
        token,
        recetaSeleccionada.id_taller,
        alumnos,
      );
      setDisponibilidad(data);
      setTabDetalle("disponibilidad");
    } catch (err) {
      console.error("Error verificando disponibilidad:", err);
    }
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
              Recetario
            </h1>
            <p className={styles.subtitle}>
              Consulta de recetas y disponibilidad de ingredientes
            </p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Panel izquierdo — lista de recetas */}
          <div
            className={`${styles.panelLista} ${isDark ? styles.cardDark : styles.cardLight}`}
          >
            {/* Filtro */}
            <div className={styles.filtroContainer}>
              <input
                type="text"
                placeholder="Filtrar por sigla (ej: ABT3131)"
                value={filtroSigla}
                onChange={(e) => setFiltroSigla(e.target.value.toUpperCase())}
                className={`${styles.filtroInput} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
              <button className={styles.btnBuscar} onClick={cargarRecetas}>
                🔍
              </button>
            </div>

            {/* Lista */}
            {loading ? (
              <p className={styles.loadingText}>Cargando recetas...</p>
            ) : error ? (
              <p className={styles.errorText}>{error}</p>
            ) : recetasFiltradas.length === 0 ? (
              <p className={styles.emptyText}>No hay recetas disponibles</p>
            ) : (
              <div className={styles.listaRecetas}>
                {recetasFiltradas.map((receta) => (
                  <div
                    key={receta.id_taller}
                    onClick={() => abrirDetalle(receta)}
                    className={`${styles.recetaCard} ${recetaSeleccionada?.id_taller === receta.id_taller ? styles.recetaActiva : isDark ? styles.recetaCardDark : styles.recetaCardLight}`}
                  >
                    <div className={styles.recetaCardHeader}>
                      <span className={`${styles.recetaSigla}`}>
                        {receta.sigla}
                      </span>
                      <span className={styles.recetaSemana}>
                        Semana {receta.semana}
                      </span>
                    </div>
                    <p
                      className={`${styles.recetaTitulo} ${isDark ? styles.dark : styles.light}`}
                    >
                      {receta.titulo_preparacion || "Sin título"}
                    </p>
                    <div className={styles.recetaMeta}>
                      <span>🧂 {receta.num_ingredientes} ingredientes</span>
                      <span>
                        💰 ${receta.costo_estimado.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho — detalle */}
          <div
            className={`${styles.panelDetalle} ${isDark ? styles.cardDark : styles.cardLight}`}
          >
            {!recetaSeleccionada ? (
              <div className={styles.sinSeleccion}>
                <p>Selecciona una receta para ver su detalle</p>
              </div>
            ) : loadingDetalle ? (
              <div className={styles.sinSeleccion}>
                <p>Cargando detalle...</p>
              </div>
            ) : (
              <div>
                {/* Header detalle */}
                <div className={styles.detalleHeader}>
                  <div>
                    <h2
                      className={`${styles.detalleTitulo} ${isDark ? styles.dark : styles.light}`}
                    >
                      {recetaSeleccionada.titulo_preparacion || "Sin título"}
                    </h2>
                    <p className={styles.detalleSubtitulo}>
                      {recetaSeleccionada.sigla} — Semana{" "}
                      {recetaSeleccionada.semana}
                      {recetaSeleccionada.jornada &&
                        ` — ${recetaSeleccionada.jornada}`}
                    </p>
                  </div>
                  {disponibilidad && (
                    <span
                      className={styles.badgeEjecutable}
                      style={{
                        backgroundColor: disponibilidad.ejecutable
                          ? "#22c55e22"
                          : "#ef444422",
                        color: disponibilidad.ejecutable
                          ? "#22c55e"
                          : "#ef4444",
                        border: `1px solid ${disponibilidad.ejecutable ? "#22c55e" : "#ef4444"}`,
                      }}
                    >
                      {disponibilidad.ejecutable
                        ? "✅ Ejecutable"
                        : "❌ Stock insuficiente"}
                    </span>
                  )}
                </div>

                {detalle?.detalle_preparacion && (
                  <p className={styles.detalleDesc}>
                    {detalle.detalle_preparacion}
                  </p>
                )}

                {/* Control alumnos */}
                <div
                  className={`${styles.alumnosControl} ${isDark ? styles.alumnosDark : styles.alumnosLight}`}
                >
                  <span className={styles.alumnosLabel}>
                    👥 Número de alumnos:
                  </span>
                  <div className={styles.alumnosInput}>
                    <button
                      className={styles.alumnosBtn}
                      onClick={() => setAlumnos((a) => Math.max(1, a - 1))}
                    >
                      −
                    </button>
                    <span
                      className={`${styles.alumnosValor} ${isDark ? styles.dark : styles.light}`}
                    >
                      {alumnos}
                    </span>
                    <button
                      className={styles.alumnosBtn}
                      onClick={() => setAlumnos((a) => a + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className={styles.btnVerificar}
                    onClick={verificarDisponibilidad}
                  >
                    🔍 Verificar stock
                  </button>
                  <button
                    className={styles.btnEscalar}
                    onClick={calcularEscalado}
                  >
                    📐 Escalar receta
                  </button>
                </div>

                {/* Tabs detalle */}
                <div className={styles.tabsDetalle}>
                  {[
                    { key: "ingredientes", label: "🧂 Ingredientes" },
                    { key: "disponibilidad", label: "📦 Disponibilidad" },
                    { key: "escalado", label: "📐 Escalado" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setTabDetalle(tab.key)}
                      className={`${styles.tabDetalle} ${tabDetalle === tab.key ? styles.tabDetalleActiva : isDark ? styles.tabDetalleDark : styles.tabDetalleLight}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Ingredientes */}
                {tabDetalle === "ingredientes" && detalle && (
                  <div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Agrupador</th>
                            <th>Cantidad</th>
                            <th>Unidad</th>
                            <th>Precio unit.</th>
                            <th>Costo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalle.ingredientes.map((ing, i) => (
                            <tr key={i}>
                              <td className={isDark ? styles.dark : styles.light}>{ing.nom_producto}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.nom_agrupador}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.cantidad}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.nom_unidad_medida}</td>
                              <td className={isDark ? styles.dark : styles.light}>
                                ${ing.precio_unitario.toLocaleString("es-CL")}
                              </td>
                              <td className={isDark ? styles.dark : styles.light}>
                                ${ing.costo_ingrediente.toLocaleString("es-CL")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.costoTotal}>
                      <span>Costo estimado total:</span>
                      <strong className={isDark ? styles.dark : styles.light}>
                        ${detalle.costo_estimado.toLocaleString("es-CL")}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Tab Disponibilidad */}
                {tabDetalle === "disponibilidad" && disponibilidad && (
                  <div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Necesario</th>
                            <th>Stock actual</th>
                            <th>Faltante</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disponibilidad.ingredientes.map((ing, i) => (
                            <tr key={i}>
                              <td className={isDark ? styles.dark : styles.light}>{ing.nom_producto}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.cantidad_necesaria}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.stock_actual}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.faltante > 0 ? ing.faltante : "—"}</td>
                              <td className={isDark ? styles.dark : styles.light}>
                                <span
                                  className={styles.badge}
                                  style={{
                                    backgroundColor: ing.disponible
                                      ? "#22c55e22"
                                      : "#ef444422",
                                    color: ing.disponible
                                      ? "#22c55e"
                                      : "#ef4444",
                                    border: `1px solid ${ing.disponible ? "#22c55e" : "#ef4444"}`,
                                  }}
                                >
                                  {ing.disponible ? "✅ OK" : "❌ Falta"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab Escalado */}
                {tabDetalle === "escalado" && escalado && (
                  <div>
                    <div className={styles.escaladoInfo}>
                      <span>
                        Receta escalada para{" "}
                        <strong>{escalado.alumnos} alumnos</strong>
                      </span>
                      <span>
                        Costo total:{" "}
                        <strong>
                          ${escalado.costo_total.toLocaleString("es-CL")}
                        </strong>
                      </span>
                      <span>
                        Costo por alumno:{" "}
                        <strong>
                          ${escalado.costo_por_alumno.toLocaleString("es-CL")}
                        </strong>
                      </span>
                    </div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Agrupador</th>
                            <th>Cant. base</th>
                            <th>Cant. escalada</th>
                            <th>Unidad</th>
                            <th>Costo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {escalado.ingredientes.map((ing, i) => (
                            <tr key={i}>
                              <td className={isDark ? styles.dark : styles.light}>{ing.nom_producto}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.nom_agrupador}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.cantidad_base}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.cantidad_escalada}</td>
                              <td className={isDark ? styles.dark : styles.light}>{ing.nom_unidad_medida}</td>
                              <td className={isDark ? styles.dark : styles.light}>
                                ${ing.costo_ingrediente.toLocaleString("es-CL")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tabDetalle === "escalado" && !escalado && (
                  <div className={styles.sinSeleccion}>
                    <p>
                      Ajusta el número de alumnos y presiona "Escalar receta"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RecetarioPage;
