import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./AcademicoPage.module.css";
import ProgAsignModal from "./ProgAsignModal";
import ProgTallerModal from "./ProgTallerModal";
import RegisTallerModal from "./RegisTallerModal";
import {
  getCarreras,
  getPeriodos,
  getAsignaturas,
  getProgAsign,
  getProgTaller,
  getRegisTaller,
} from "../../services/academicoService";
import { getUsuarios } from "../../services/usuariosService";

const ITEMS_POR_PAGINA = 25;

const Paginacion = ({ total, pagina, setPagina, isDark }) => {
  const totalPaginas = Math.ceil(total / ITEMS_POR_PAGINA);
  if (totalPaginas <= 1) return null;
  return (
    <div className={styles.paginacion}>
      <button
        className={styles.paginaBtn}
        onClick={() => setPagina((p) => Math.max(1, p - 1))}
        disabled={pagina === 1}
      >
        ‹
      </button>
      <div className={styles.paginacionNumeros}>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
          .filter((p) => {
            if (p === 1 || p === totalPaginas) return true;
            if (pagina <= 3) return p <= 5;
            if (pagina >= totalPaginas - 2) return p >= totalPaginas - 4;
            return Math.abs(p - pagina) <= 2;
          })
          .reduce((acc, p, i, arr) => {
            if (i > 0 && arr[i - 1] !== p - 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className={styles.paginaDots}>
                ...
              </span>
            ) : (
              <button
                key={p}
                className={`${styles.paginaBtn} ${pagina === p ? styles.paginaBtnActiva : ""}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ),
          )}
      </div>
      <button
        className={styles.paginaBtn}
        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
        disabled={pagina === totalPaginas}
      >
        ›
      </button>
    </div>
  );
};

const AcademicoPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [pestana, setPestana] = useState("programacion");
  const [loading, setLoading] = useState(true);

  const [carreras, setCarreras] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [progAsign, setProgAsign] = useState([]);
  const [progTaller, setProgTaller] = useState([]);
  const [regisTaller, setRegisTaller] = useState([]);

  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [filtroSigla, setFiltroSigla] = useState("");
  const [expandido, setExpandido] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModalProgAsign, setMostrarModalProgAsign] = useState(false);
  const [mostrarModalProgTaller, setMostrarModalProgTaller] = useState(false);
  const [mostrarModalRegis, setMostrarModalRegis] = useState(false);

  const [paginaProgAsign, setPaginaProgAsign] = useState(1);
  const [paginaProgTaller, setPaginaProgTaller] = useState(1);
  const [paginaRegisTaller, setPaginaRegisTaller] = useState(1);

  useEffect(() => {
    fetchMaestros();
  }, [token]);
  useEffect(() => {
    fetchDatosPestana();
  }, [pestana, filtroAno, filtroPeriodo, filtroSigla]);
  useEffect(() => {
    setPaginaProgAsign(1);
  }, [progAsign]);
  useEffect(() => {
    setPaginaProgTaller(1);
  }, [progTaller]);
  useEffect(() => {
    setPaginaRegisTaller(1);
  }, [regisTaller]);

  const fetchMaestros = async () => {
    try {
      const [carrerasRes, periodosRes, asignaturasRes, usuariosRes] =
        await Promise.all([
          getCarreras(token),
          getPeriodos(token),
          getAsignaturas(token),
          getUsuarios(token),
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
      if (pestana === "programacion") {
        const res = await getProgAsign(token, {
          ano_academ: filtroAno,
          cod_periodo_academ: filtroPeriodo,
        });
        setProgAsign(res);
      } else if (pestana === "talleres") {
        const res = await getProgTaller(token, {
          ano_academ: filtroAno,
          cod_periodo_academ: filtroPeriodo,
          sigla: filtroSigla,
        });
        setProgTaller(res);
      } else if (pestana === "registro") {
        const res = await getRegisTaller(token, {
          ano_academ: filtroAno,
          cod_periodo_academ: filtroPeriodo,
          sigla: filtroSigla,
        });
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

  const paginar = (arr, pagina) => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(
      (pagina - 1) * ITEMS_POR_PAGINA,
      pagina * ITEMS_POR_PAGINA,
    );
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
            📋 Programación
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
            📝 Registro
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
              paginar(progAsign, paginaProgAsign).map((p, i) => (
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
              <Paginacion
                total={progAsign.length}
                pagina={paginaProgAsign}
                setPagina={setPaginaProgAsign}
                isDark={isDark}
              />
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
              paginar(progTaller, paginaProgTaller).map((t, i) => (
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
              <Paginacion
                total={progTaller.length}
                pagina={paginaProgTaller}
                setPagina={setPaginaProgTaller}
                isDark={isDark}
              />
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
              paginar(regisTaller, paginaRegisTaller).map((r, i) => (
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
              <Paginacion
                total={regisTaller.length}
                pagina={paginaRegisTaller}
                setPagina={setPaginaRegisTaller}
                isDark={isDark}
              />
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
