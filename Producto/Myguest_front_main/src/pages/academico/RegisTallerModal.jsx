import { useState, useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./AcademicoModal.module.css";
import {
  getProgTaller,
  crearRegisTaller,
} from "../../services/academicoService";
import { getProductos } from "../../services/inventarioService";

const RegisTallerModal = ({
  periodos,
  usuarios,
  asignaturas,
  onClose,
  onGuardado,
}) => {
  const { isDark } = useThemeStore();
  const { token, usuario } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Datos en cascada
  const [productos, setProductos] = useState([]);
  const [asignaturasDisponibles, setAsignaturasDisponibles] = useState([]);
  const [seccionesDisponibles, setSeccionesDisponibles] = useState([]);
  const [talleresDisponibles, setTalleresDisponibles] = useState([]);
  const [tallerSeleccionado, setTallerSeleccionado] = useState(null);

  const [form, setForm] = useState({
    ano_academ: new Date().getFullYear(),
    cod_periodo_academ: "",
    sigla: "",
    seccion: "",
    id_taller: "",
    id_usuario: usuario?.id_usuario || "",
    obs: "",
  });

  const [detalles, setDetalles] = useState([
    {
      id_producto: "",
      busqueda: "",
      cod_agrupador: "1",
      precio: "",
      cantidad: "",
    },
  ]);

  // Cargar productos al inicio
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await getProductos(token);
        setProductos(data);
      } catch (err) {
        console.error("Error cargando productos:", err);
      }
    };
    fetchProductos();
  }, [token]);

  // Paso 1: cuando cambia año o período, cargar asignaturas disponibles
  const fetchAsignaturas = async (ano, periodo) => {
    if (!ano || !periodo) return;
    try {
      const data = await getProgTaller(token, {
        ano_academ: ano,
        cod_periodo_academ: periodo,
      });
      const siglas = [...new Set(data.map((t) => t.sigla))];
      setAsignaturasDisponibles(siglas);
      setSeccionesDisponibles([]);
      setTalleresDisponibles([]);
      setForm((f) => ({ ...f, sigla: "", seccion: "", id_taller: "" }));
    } catch (err) {
      console.error("Error:", err);
    }
  };
  // Paso 2: cuando cambia asignatura, cargar secciones disponibles
  const fetchSecciones = async (ano, periodo, sigla) => {
    if (!ano || !periodo || !sigla) return;
    try {
      const data = await getProgTaller(token, {
        ano_academ: ano,
        cod_periodo_academ: periodo,
        sigla,
      });
      const secciones = [...new Set(data.map((t) => t.seccion))];
      setSeccionesDisponibles(secciones);
      setTalleresDisponibles([]);
      setForm((f) => ({ ...f, seccion: "", id_taller: "" }));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Paso 3: cuando cambia sección, cargar talleres disponibles
  const fetchTalleres = async (ano, periodo, sigla, seccion) => {
    if (!ano || !periodo || !sigla || !seccion) return;
    try {
      const data = await getProgTaller(token, {
        ano_academ: ano,
        cod_periodo_academ: periodo,
        sigla,
        seccion,
      });
      setTalleresDisponibles(data);
      setForm((f) => ({ ...f, id_taller: "" }));
      setTallerSeleccionado(null);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (name === "ano_academ" || name === "cod_periodo_academ") {
      const ano = name === "ano_academ" ? value : form.ano_academ;
      const periodo =
        name === "cod_periodo_academ" ? value : form.cod_periodo_academ;
      fetchAsignaturas(ano, periodo);
    }

    if (name === "sigla") {
      fetchSecciones(form.ano_academ, form.cod_periodo_academ, value);
    }

    if (name === "seccion") {
      fetchTalleres(
        form.ano_academ,
        form.cod_periodo_academ,
        form.sigla,
        value,
      );
    }

    if (name === "id_taller") {
      const taller = talleresDisponibles.find(
        (t) => t.id_taller === parseInt(value),
      );
      setTallerSeleccionado(taller);
      if (taller) {
        setForm((f) => ({
          ...f,
          id_taller: value,
          id_usuario: taller.id_usuario || f.id_usuario,
        }));
      }
    }
  };

  const handleDetalleChange = (index, field, value) => {
    const nuevos = [...detalles];
    nuevos[index][field] = value;
    setDetalles(nuevos);
  };

  const agregarDetalle = () => {
    setDetalles([
      ...detalles,
      {
        id_producto: "",
        busqueda: "",
        cod_agrupador: "1",
        precio: "",
        cantidad: "",
      },
    ]);
  };

  const eliminarDetalle = (index) => {
    if (detalles.length === 1) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await crearRegisTaller(token, body);
      onGuardado();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${isDark ? styles.dark : styles.light}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2
            className={`${styles.title} ${isDark ? styles.darkText : styles.lightText}`}
          >
            Registrar Ejecución de Taller
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Datos del taller */}
          <div className={styles.section}>
            <h3
              className={`${styles.sectionTitle} ${isDark ? styles.darkText : styles.lightText}`}
            >
              Datos del taller
            </h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Año académico *</label>
                <input
                  name="ano_academ"
                  type="number"
                  value={form.ano_academ}
                  onChange={handleChange}
                  required
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Período *</label>
                <select
                  name="cod_periodo_academ"
                  value={form.cod_periodo_academ}
                  onChange={handleChange}
                  required
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                >
                  <option value="">Seleccionar período</option>
                  {periodos.map((p) => (
                    <option
                      key={p.cod_periodo_academ}
                      value={p.cod_periodo_academ}
                    >
                      {p.nom_periodo_academ}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Asignatura *</label>
                <select
                  name="sigla"
                  value={form.sigla}
                  onChange={handleChange}
                  required
                  disabled={
                    !form.cod_periodo_academ ||
                    asignaturasDisponibles.length === 0
                  }
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                >
                  <option value="">
                    {!form.cod_periodo_academ
                      ? "Selecciona año y período primero"
                      : "Seleccionar asignatura"}
                  </option>
                  {asignaturasDisponibles.map((sigla) => {
                    const asig = asignaturas.find((a) => a.sigla === sigla);
                    return (
                      <option key={sigla} value={sigla}>
                        {asig ? asig.nom_asign : sigla}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Sección *</label>
                <select
                  name="seccion"
                  value={form.seccion}
                  onChange={handleChange}
                  required
                  disabled={!form.sigla || seccionesDisponibles.length === 0}
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                >
                  <option value="">
                    {!form.sigla
                      ? "Selecciona asignatura primero"
                      : "Seleccionar sección"}
                  </option>
                  {seccionesDisponibles.map((s) => (
                    <option key={s} value={s}>
                      Sección {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Taller programado *</label>
                <select
                  name="id_taller"
                  value={form.id_taller}
                  onChange={handleChange}
                  required
                  disabled={!form.seccion || talleresDisponibles.length === 0}
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                >
                  <option value="">
                    {!form.seccion
                      ? "Selecciona sección primero"
                      : "Seleccionar taller"}
                  </option>
                  {talleresDisponibles.map((t) => (
                    <option key={t.id_taller} value={t.id_taller}>
                      {t.fecha} — Taller #{t.id_taller}
                    </option>
                  ))}
                </select>
              </div>

              {tallerSeleccionado && (
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label className={styles.label}>Fecha del taller</label>
                  <input
                    value={tallerSeleccionado.fecha}
                    disabled
                    className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                  />
                </div>
              )}

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Docente *</label>
                <select
                  name="id_usuario"
                  value={form.id_usuario}
                  onChange={handleChange}
                  required
                  className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                >
                  <option value="">Seleccionar docente</option>
                  {usuarios.map((u) => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nom} {u.primer_apellido}
                    </option>
                  ))}
                </select>
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

          {/* Productos consumidos */}
          <div className={styles.section}>
            <h3
              className={`${styles.sectionTitle} ${isDark ? styles.darkText : styles.lightText}`}
            >
              Productos consumidos
            </h3>

            {detalles.map((detalle, index) => (
              <div
                key={index}
                className={`${styles.detalleRow} ${isDark ? styles.detalleRowDark : styles.detalleRowLight}`}
              >
                <div className={styles.detalleGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Producto *</label>
                    <input
                      type="text"
                      value={
                        detalle.busqueda ||
                        productos.find(
                          (p) =>
                            p.id_producto === parseInt(detalle.id_producto),
                        )?.nom_producto ||
                        ""
                      }
                      onChange={(e) => {
                        handleDetalleChange(index, "busqueda", e.target.value);
                        handleDetalleChange(index, "id_producto", "");
                      }}
                      placeholder="Buscar producto..."
                      className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                    />
                    {detalle.busqueda && !detalle.id_producto && (
                      <div
                        className={`${styles.sugerencias} ${isDark ? styles.sugerenciasDark : styles.sugerenciasLight}`}
                      >
                        {productos
                          .filter((p) =>
                            p.nom_producto
                              .toLowerCase()
                              .includes(detalle.busqueda.toLowerCase()),
                          )
                          .slice(0, 6)
                          .map((p) => (
                            <div
                              key={p.id_producto}
                              className={styles.sugerencia}
                              onClick={() => {
                                handleDetalleChange(
                                  index,
                                  "id_producto",
                                  String(p.id_producto),
                                );
                                handleDetalleChange(
                                  index,
                                  "precio",
                                  String(p.precio),
                                );
                                handleDetalleChange(
                                  index,
                                  "busqueda",
                                  p.nom_producto,
                                );
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
                      onChange={(e) =>
                        handleDetalleChange(index, "cantidad", e.target.value)
                      }
                      placeholder="0"
                      required
                      className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Precio *</label>
                    <input
                      type="number"
                      value={detalle.precio}
                      onChange={(e) =>
                        handleDetalleChange(index, "precio", e.target.value)
                      }
                      placeholder="0"
                      required
                      className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarDetalle(index)}
                  className={styles.eliminarBtn}
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
              disabled={loading || !tallerSeleccionado}
              className={styles.submitBtn}
            >
              {loading ? "Registrando..." : "Registrar Taller"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisTallerModal;
