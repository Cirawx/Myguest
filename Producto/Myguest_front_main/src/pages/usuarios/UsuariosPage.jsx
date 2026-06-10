import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./UsuariosPage.module.css";
import UsuarioModal from "./UsuarioModal";
import UsuarioEditModal from "./UsuarioEditModal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch(`${API_URL}/usuarios/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
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
      const response = await fetch(`${API_URL}/usuarios/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async () => {
    try {
      const response = await fetch(
        `${API_URL}/usuarios/${usuarioEliminar.id_usuario}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Error al eliminar");
      setUsuarioEliminar(null);
      setExpandido(null);
      recargarUsuarios();
    } catch (err) {
      alert("Error al eliminar el usuario");
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
                  className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight} ${expandido === usuario.id_usuario ? styles.tablaRowActive : ""}`}
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
                        <span className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}>
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
                        <span className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}>
                          Correo institucional
                        </span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          {usuario.login}
                        </span>
                      </div>
                      <div className={styles.acordeonItem}>
                        <span className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}>Perfil</span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          {perfilLabel(usuario.cod_perfil).label}
                        </span>
                      </div>
                      <div className={styles.acordeonItem}>
                        <span className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}>Carrera</span>
                        <span
                          className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                        >
                          Carrera {usuario.cod_carrera}
                        </span>
                      </div>
                      <div className={styles.acordeonItem}>
                        <span className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}>ID Usuario</span>
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
        {usuarioEliminar && (
          <div className={styles.overlay}>
            <div
              className={`${styles.confirmModal} ${isDark ? styles.tablaDark : styles.tablaLight}`}
            >
              <h3 className={`${isDark ? styles.dark : styles.light}`}>
                ¿Eliminar usuario?
              </h3>
              <p className={styles.login}>
                Esta acción no se puede deshacer. ¿Estás seguro de eliminar a{" "}
                <strong>
                  {usuarioEliminar.nom} {usuarioEliminar.primer_apellido}
                </strong>
                ?
              </p>
              <div className={styles.acordeonAcciones}>
                <button
                  className={`${styles.cancelBtn} ${isDark ? styles.cancelDark : styles.cancelLight}`}
                  onClick={() => setUsuarioEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  className={styles.deleteConfirmBtn}
                  onClick={eliminarUsuario}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UsuariosPage;
