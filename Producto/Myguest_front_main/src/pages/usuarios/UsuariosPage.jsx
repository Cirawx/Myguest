import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./UsuariosPage.module.css";
import UsuarioModal from "./UsuarioModal";
import UsuarioEditModal from "./UsuarioEditModal";
import {
  getUsuarios,
  eliminarUsuario as eliminarUsuarioService,
} from "../../services/usuariosService";
import { reemplazarDocente } from "../../services/usuariosService";

const UsuariosPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [usuarioEliminar, setUsuarioEliminar] = useState(null);
  const [usuarioReemplazar, setUsuarioReemplazar] = useState(null);
  const [nuevoDocenteId, setNuevoDocenteId] = useState("");
  const [reemplazando, setReemplazando] = useState(false);
  const [mensajeReemplazo, setMensajeReemplazo] = useState("");

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await getUsuarios(token);
        setUsuarios(data);
      } catch (err) {
        setError("Error al cargar los usuarios");
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, [token]);

  const perfilLabel = (cod) => {
    if (cod === 0) return { label: "Administrador TI", color: "#8b5cf6" };
    if (cod === 1) return { label: "Admin Carrera", color: "#f59e0b" };
    if (cod === 3) return { label: "Bodeguero", color: "#06b6d4" };
    return { label: "Docente", color: "#22c55e" };
  };

  const usuariosFiltrados = usuarios
    .filter((u) =>
      filtro === "todos" ? true : u.cod_perfil === parseInt(filtro),
    )
    .filter(
      (u) =>
        `${u.nom} ${u.primer_apellido}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        u.login.toLowerCase().includes(busqueda.toLowerCase()),
    );

  const toggleExpandido = (id) => {
    setExpandido(expandido === id ? null : id);
  };

  const recargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios(token);
      setUsuarios(data);
    } catch (err) {
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async () => {
    try {
      await eliminarUsuarioService(token, usuarioEliminar.id_usuario);
      setUsuarioEliminar(null);
      setExpandido(null);
      recargarUsuarios();
    } catch (err) {
      alert("Error al eliminar el usuario");
    }
  };

  const handleReemplazar = async () => {
    if (!nuevoDocenteId) return;
    setReemplazando(true);
    try {
      const resultado = await reemplazarDocente(
        token,
        usuarioReemplazar.id_usuario,
        parseInt(nuevoDocenteId),
      );
      setMensajeReemplazo(
        `${resultado.talleres_actualizados} talleres reasignados correctamente.`,
      );
      setTimeout(() => {
        setUsuarioReemplazar(null);
        setNuevoDocenteId("");
        setMensajeReemplazo("");
      }, 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setReemplazando(false);
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
              Gestión de Usuarios
            </h1>
            <p className={styles.subtitle}>
              Administra los roles y perfiles de la institución
            </p>
          </div>
          <button
            className={styles.newBtn}
            onClick={() => setMostrarModal(true)}
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Filtros */}
        <div className={styles.filtros}>
          <span
            className={`${styles.filtroLabel} ${isDark ? styles.dark : styles.light}`}
          >
            Filtrar por Rol
          </span>
          <div className={styles.filtrosBtns}>
            {[
              { value: "todos", label: "Todos" },
              { value: "0", label: "Administrador TI" },
              { value: "1", label: "Admin Carrera" },
              { value: "2", label: "Docente" },
              { value: "3", label: "Bodeguero" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`${styles.filtroBtn} ${filtro === f.value ? styles.filtroBtnActive : ""} ${isDark ? styles.filtroBtnDark : styles.filtroBtnLight}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Búsqueda */}
        <div className={styles.busqueda}>
          <span className={styles.busquedaIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${styles.busquedaInput} ${isDark ? styles.inputDark : styles.inputLight}`}
          />
        </div>

        {/* Tabla */}
        {loading ? (
          <div className={styles.loading}>Cargando usuarios...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div
            className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <div
              className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
            >
              <span>Usuario</span>
              <span>Perfil</span>
              <span>Carrera</span>
              <span></span>
            </div>

            {usuariosFiltrados.map((usuario) => (
              <div key={usuario.id_usuario}>
                {/* Fila principal */}
                <div
                  onClick={() => toggleExpandido(usuario.id_usuario)}
                  className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight} ${expandido === usuario.id_usuario ? (isDark ? styles.tablaRowActive : styles.tablaRowActiveLight) : ""}`}
                >
                  <div className={styles.usuarioInfo}>
                    <div
                      className={styles.avatar}
                      style={{
                        backgroundColor: perfilLabel(usuario.cod_perfil).color,
                      }}
                    >
                      {usuario.nom?.charAt(0)}
                      {usuario.primer_apellido?.charAt(0)}
                    </div>
                    <div>
                      <p
                        className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                      >
                        {usuario.nom} {usuario.primer_apellido}
                      </p>
                      <p className={styles.login}>{usuario.login}</p>
                    </div>
                  </div>

                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor:
                        perfilLabel(usuario.cod_perfil).color + "22",
                      color: perfilLabel(usuario.cod_perfil).color,
                    }}
                  >
                    {perfilLabel(usuario.cod_perfil).label}
                  </span>

                  <span
                    className={`${styles.carrera} ${isDark ? styles.dark : styles.light}`}
                  >
                    Carrera {usuario.cod_carrera}
                  </span>

                  <span
                    className={`${styles.chevron} ${expandido === usuario.id_usuario ? styles.chevronOpen : ""}`}
                  >
                    ›
                  </span>
                </div>

                {/* Acordeón */}
                {expandido === usuario.id_usuario && (
                  <div
                    className={`${styles.acordeon} ${isDark ? styles.acordeonDark : styles.acordeonLight}`}
                  >
                    <div className={styles.acordeonGrid}>
                      <div className={styles.acordeonItem}>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          Nombre completo
                        </span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          {usuario.nom}{" "}
                          {usuario.nom_preferido
                            ? `(${usuario.nom_preferido})`
                            : ""}{" "}
                          {usuario.primer_apellido}{" "}
                          {usuario.segundo_apellido || ""}
                        </span>
                      </div>
                      <div className={styles.acordeonItem}>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          Correo institucional
                        </span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          {usuario.login}
                        </span>
                      </div>
                      <div className={styles.acordeonItem}>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          Perfil
                        </span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          {perfilLabel(usuario.cod_perfil).label}
                        </span>
                      </div>
                      <div className={styles.acordeonItem}>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          Carrera
                        </span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          Carrera {usuario.cod_carrera}
                        </span>
                      </div>
                      <div className={styles.acordeonItem}>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          ID Usuario
                        </span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          #{usuario.id_usuario}
                        </span>
                      </div>
                    </div>
                    <div className={styles.acordeonAcciones}>
                      <button
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUsuarioEditar(usuario);
                        }}
                      >
                        ✏️ Editar
                      </button>
                      {usuario.cod_perfil === 2 && (
                        <button
                          className={styles.editBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUsuarioReemplazar(usuario);
                          }}
                        >
                          🔄 Reemplazar
                        </button>
                      )}
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUsuarioEliminar(usuario);
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className={styles.tablaFooter}>
              <span className={styles.total}>
                Mostrando {usuariosFiltrados.length} de {usuarios.length}{" "}
                usuarios
              </span>
            </div>
          </div>
        )}
        {mostrarModal && (
          <UsuarioModal
            onClose={() => setMostrarModal(false)}
            onUsuarioCreado={recargarUsuarios}
          />
        )}
        {usuarioEditar && (
          <UsuarioEditModal
            usuario={usuarioEditar}
            onClose={() => setUsuarioEditar(null)}
            onUsuarioEditado={recargarUsuarios}
          />
        )}
        {usuarioReemplazar && (
          <div className={styles.overlay}>
            <div
              className={`${styles.confirmModal} ${isDark ? styles.tablaDark : styles.tablaLight}`}
            >
              <h3 className={`${isDark ? styles.dark : styles.light}`}>
                Reemplazar docente
              </h3>
              <p className={styles.login}>
                Selecciona el nuevo docente que reemplazará a{" "}
                <strong>
                  {usuarioReemplazar.nom} {usuarioReemplazar.primer_apellido}
                </strong>{" "}
                en todos sus talleres asignados.
              </p>

              {mensajeReemplazo ? (
                <p
                  style={{
                    color: "#22c55e",
                    fontWeight: 600,
                    margin: "16px 0",
                  }}
                >
                  ✅ {mensajeReemplazo}
                </p>
              ) : (
                <select
                  value={nuevoDocenteId}
                  onChange={(e) => setNuevoDocenteId(e.target.value)}
                  className={`${styles.busquedaInput} ${isDark ? styles.inputDark : styles.inputLight}`}
                  style={{ width: "100%", marginBottom: "16px" }}
                >
                  <option value="">Seleccionar docente</option>
                  {usuarios
                    .filter(
                      (u) =>
                        u.cod_perfil === 2 &&
                        u.id_usuario !== usuarioReemplazar.id_usuario,
                    )
                    .map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {u.nom} {u.primer_apellido}
                      </option>
                    ))}
                </select>
              )}

              {!mensajeReemplazo && (
                <div className={styles.acordeonAcciones}>
                  <button
                    className={`${styles.cancelBtn} ${isDark ? styles.cancelDark : styles.cancelLight}`}
                    onClick={() => {
                      setUsuarioReemplazar(null);
                      setNuevoDocenteId("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className={styles.submitBtn}
                    onClick={handleReemplazar}
                    disabled={!nuevoDocenteId || reemplazando}
                  >
                    {reemplazando ? "Reemplazando..." : "Confirmar Reemplazo"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UsuariosPage;
