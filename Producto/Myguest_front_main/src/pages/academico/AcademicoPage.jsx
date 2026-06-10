import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./AcademicoPage.module.css";
import ProgAsignModal from "./ProgAsignModal";
import ProgTallerModal from "./ProgTallerModal";
import RegisTallerModal from "./RegisTallerModal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const AcademicoPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [pestana, setPestana] = useState("programacion");
  const [loading, setLoading] = useState(true);

  // Datos maestros
  const [carreras, setCarreras] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);

  // Datos por pestaña
  const [progAsign, setProgAsign] = useState([]);
  const [progTaller, setProgTaller] = useState([]);
  const [regisTaller, setRegisTaller] = useState([]);

  // Filtros
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [filtroSigla, setFiltroSigla] = useState("");

  // Expandido
  const [expandido, setExpandido] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModalProgAsign, setMostrarModalProgAsign] = useState(false);
  const [mostrarModalProgTaller, setMostrarModalProgTaller] = useState(false);
  const [mostrarModalRegis, setMostrarModalRegis] = useState(false);

  useEffect(() => {
    fetchMaestros();
  }, [token]);

  useEffect(() => {
    fetchDatosPestana();
  }, [pestana, filtroAno, filtroPeriodo, filtroSigla]);

  const fetchMaestros = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [carrerasRes, periodosRes, asignaturasRes, usuariosRes] =
        await Promise.all([
          fetch(`${API_URL}/carreras/`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/periodos/`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/asignaturas/`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/usuarios/`, { headers }).then((r) => r.json()),
        ]);
      setCarreras(carrerasRes);
      setPeriodos(periodosRes);
      setAsignaturas(asignaturasRes);
      setUsuarios(usuariosRes);
    } catch (err) {
      console.error("Error cargando maestros:", err);
    }
  };

  const fetchDatosPestana = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let url = "";

      if (pestana === "programacion") {
        url = `${API_URL}/prog-asign/?ano_academ=${filtroAno}`;
        if (filtroPeriodo) url += `&cod_periodo_academ=${filtroPeriodo}`;
        const res = await fetch(url, { headers }).then((r) => r.json());
        setProgAsign(res);
      } else if (pestana === "talleres") {
        url = `${API_URL}/prog-taller/?ano_academ=${filtroAno}`;
        if (filtroPeriodo) url += `&cod_periodo_academ=${filtroPeriodo}`;
        if (filtroSigla) url += `&sigla=${filtroSigla}`;
        const res = await fetch(url, { headers }).then((r) => r.json());
        setProgTaller(res);
      } else if (pestana === "registro") {
        url = `${API_URL}/regis-taller/?ano_academ=${filtroAno}`;
        if (filtroPeriodo) url += `&cod_periodo_academ=${filtroPeriodo}`;
        if (filtroSigla) url += `&sigla=${filtroSigla}`;
        const res = await fetch(url, { headers }).then((r) => r.json());
        setRegisTaller(res);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNombreAsignatura = (sigla) => {
    const a = asignaturas.find((a) => a.sigla === sigla);
    return a ? a.nom_asign : sigla;
  };

  const getNombrePeriodo = (cod) => {
    const p = periodos.find((p) => p.cod_periodo_academ === cod);
    return p ? p.nom_periodo_academ_abrev : `Período ${cod}`;
  };

  const anos = [2023, 2024, 2025, 2026];

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1
              className={`${styles.title} ${isDark ? styles.dark : styles.light}`}
            >
              Módulo Académico
            </h1>
            <p className={styles.subtitle}>
              Programación y registro de talleres
            </p>
          </div>
          <button
            className={styles.newBtn}
            onClick={() => {
              if (pestana === "programacion") setMostrarModalProgAsign(true);
              else if (pestana === "talleres") setMostrarModalProgTaller(true);
              else setMostrarModalRegis(true);
            }}
          >
            {pestana === "programacion"
              ? "+ Nueva Programación"
              : pestana === "talleres"
                ? "+ Programar Taller"
                : "+ Registrar Taller"}
          </button>
        </div>

        {/* Pestañas */}
        <div className={styles.pestanas}>
          <button
            onClick={() => {
              setPestana("programacion");
              setExpandido(null);
            }}
            className={`${styles.pestana} ${pestana === "programacion" ? styles.pestanaActiva : isDark ? styles.pestanaDark : styles.pestanaLight}`}
          >
            📚 Programación
          </button>
          <button
            onClick={() => {
              setPestana("talleres");
              setExpandido(null);
            }}
            className={`${styles.pestana} ${pestana === "talleres" ? styles.pestanaActiva : isDark ? styles.pestanaDark : styles.pestanaLight}`}
          >
            🍳 Talleres
          </button>
          <button
            onClick={() => {
              setPestana("registro");
              setExpandido(null);
            }}
            className={`${styles.pestana} ${pestana === "registro" ? styles.pestanaActiva : isDark ? styles.pestanaDark : styles.pestanaLight}`}
          >
            📋 Registro
          </button>
        </div>

        {/* Filtros */}
        <div className={styles.filtros}>
          <select
            value={filtroAno}
            onChange={(e) => setFiltroAno(e.target.value)}
            className={`${styles.select} ${isDark ? styles.inputDark : styles.inputLight}`}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className={`${styles.select} ${isDark ? styles.inputDark : styles.inputLight}`}
          >
            <option value="">Todos los períodos</option>
            {periodos.map((p) => (
              <option key={p.cod_periodo_academ} value={p.cod_periodo_academ}>
                {p.nom_periodo_academ}
              </option>
            ))}
          </select>

          {(pestana === "talleres" || pestana === "registro") && (
            <select
              value={filtroSigla}
              onChange={(e) => setFiltroSigla(e.target.value)}
              className={`${styles.select} ${isDark ? styles.inputDark : styles.inputLight}`}
            >
              <option value="">Todas las asignaturas</option>
              {asignaturas.map((a) => (
                <option key={a.sigla} value={a.sigla}>
                  {a.nom_asign}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : pestana === "programacion" ? (
          <div
            className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <div
              className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
            >
              <span>Asignatura</span>
              <span>Año</span>
              <span>Período</span>
              <span>Sección</span>
            </div>
            {progAsign.length === 0 ? (
              <p className={styles.empty}>No hay programaciones</p>
            ) : (
              progAsign.map((p, i) => (
                <div
                  key={i}
                  className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight}`}
                >
                  <span
                    className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                  >
                    {getNombreAsignatura(p.sigla)}
                  </span>
                  <span className={styles.cod}>{p.ano_academ}</span>
                  <span className={styles.cod}>
                    {getNombrePeriodo(p.cod_periodo_academ)}
                  </span>
                  <span className={styles.cod}>Sección {p.seccion}</span>
                </div>
              ))
            )}
            <div className={styles.tablaFooter}>
              <span className={styles.total}>
                {progAsign.length} programaciones
              </span>
            </div>
          </div>
        ) : pestana === "talleres" ? (
          <div
            className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <div
              className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
            >
              <span>Asignatura</span>
              <span>Fecha</span>
              <span>Período</span>
              <span>Sección</span>
            </div>
            {progTaller.length === 0 ? (
              <p className={styles.empty}>No hay talleres programados</p>
            ) : (
              progTaller.map((t, i) => (
                <div
                  key={i}
                  className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight}`}
                >
                  <span
                    className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                  >
                    {getNombreAsignatura(t.sigla)}
                  </span>
                  <span className={styles.cod}>{t.fecha}</span>
                  <span className={styles.cod}>
                    {getNombrePeriodo(t.cod_periodo_academ)}
                  </span>
                  <span className={styles.cod}>Sección {t.seccion}</span>
                </div>
              ))
            )}
            <div className={styles.tablaFooter}>
              <span className={styles.total}>{progTaller.length} talleres</span>
            </div>
          </div>
        ) : (
          <div
            className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <div
              className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
            >
              <span>Asignatura</span>
              <span>Fecha</span>
              <span>Sección</span>
              <span>Observaciones</span>
            </div>
            {regisTaller.length === 0 ? (
              <p className={styles.empty}>No hay registros de ejecución</p>
            ) : (
              regisTaller.map((r, i) => (
                <div
                  key={i}
                  className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight}`}
                >
                  <span
                    className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                  >
                    {getNombreAsignatura(r.sigla)}
                  </span>
                  <span className={styles.cod}>{r.fecha}</span>
                  <span className={styles.cod}>Sección {r.seccion}</span>
                  <span className={styles.cod}>{r.obs || "—"}</span>
                </div>
              ))
            )}
            <div className={styles.tablaFooter}>
              <span className={styles.total}>
                {regisTaller.length} registros
              </span>
            </div>
          </div>
        )}

        {mostrarModalProgAsign && (
          <ProgAsignModal
            asignaturas={asignaturas}
            periodos={periodos}
            onClose={() => setMostrarModalProgAsign(false)}
            onGuardado={fetchDatosPestana}
          />
        )}

        {mostrarModalProgTaller && (
          <ProgTallerModal
            asignaturas={asignaturas}
            periodos={periodos}
            usuarios={usuarios}
            onClose={() => setMostrarModalProgTaller(false)}
            onGuardado={fetchDatosPestana}
          />
        )}

        {mostrarModalRegis && (
          <RegisTallerModal
            asignaturas={asignaturas}
            periodos={periodos}
            usuarios={usuarios}
            onClose={() => setMostrarModalRegis(false)}
            onGuardado={fetchDatosPestana}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default AcademicoPage;
