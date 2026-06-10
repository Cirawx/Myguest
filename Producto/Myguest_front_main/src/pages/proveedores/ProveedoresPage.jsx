import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./ProveedoresPage.module.css";
import ProveedorModal from "./ProveedorModal";
import FamiliaModal from "./FamiliaModal";
import {
  getProveedores,
  getFamilias,
  desactivarProveedor as desactivarProveedorService,
  activarProveedor as activarProveedorService,
  eliminarFamilia as eliminarFamiliaService,
} from "../../services/proveedoresService";

const ProveedoresPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [pestana, setPestana] = useState("proveedores");
  const [proveedores, setProveedores] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [mostrarModalFamilia, setMostrarModalFamilia] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState(null);
  const [familiaEditar, setFamiliaEditar] = useState(null);
  const [itemEliminar, setItemEliminar] = useState(null);

  useEffect(() => {
    fetchData();
  }, [token, mostrarTodos]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [provRes, famRes] = await Promise.all([
        getProveedores(token, mostrarTodos),
        getFamilias(token),
      ]);
      setProveedores(provRes);
      setFamilias(famRes);
    } catch (err) {
      console.error("Error cargando proveedores:", err);
    } finally {
      setLoading(false);
    }
  };

  const desactivarProveedor = async (id) => {
    try {
      await desactivarProveedorService(token, id);
      setItemEliminar(null);
      setExpandido(null);
      fetchData();
    } catch (err) {
      console.error("Error desactivando proveedor:", err);
    }
  };

  const activarProveedor = async (id) => {
    try {
      await activarProveedorService(token, id, { activo: true });
      setItemEliminar(null);
      setExpandido(null);
      fetchData();
    } catch (err) {
      console.error("Error activando proveedor:", err);
    }
  };

  const eliminarFamilia = async (cod) => {
    try {
      await eliminarFamiliaService(token, cod);
      setItemEliminar(null);
      fetchData();
    } catch (err) {
      console.error("Error eliminando familia:", err);
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) =>
    p.nom_proveedor.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const familiasFiltradas = familias.filter((f) =>
    f.nom_familia.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1
              className={`${styles.title} ${isDark ? styles.dark : styles.light}`}
            >
              Proveedores
            </h1>
            <p className={styles.subtitle}>
              Gestión de proveedores y familias de productos
            </p>
          </div>
          <button
            className={styles.newBtn}
            onClick={() =>
              pestana === "proveedores"
                ? setMostrarModalProveedor(true)
                : setMostrarModalFamilia(true)
            }
          >
            {pestana === "proveedores"
              ? "+ Nuevo Proveedor"
              : "+ Nueva Familia"}
          </button>
        </div>

        {/* Pestañas */}
        <div className={styles.pestanas}>
          <button
            onClick={() => {
              setPestana("proveedores");
              setBusqueda("");
            }}
            className={`${styles.pestana} ${pestana === "proveedores" ? styles.pestanaActiva : isDark ? styles.pestanaDark : styles.pestanaLight}`}
          >
            🏭 Proveedores
          </button>
          <button
            onClick={() => {
              setPestana("familias");
              setBusqueda("");
            }}
            className={`${styles.pestana} ${pestana === "familias" ? styles.pestanaActiva : isDark ? styles.pestanaDark : styles.pestanaLight}`}
          >
            🏷️ Familias
          </button>
        </div>

        {/* Controles */}
        <div className={styles.controles}>
          <div className={styles.busqueda}>
            <span className={styles.busquedaIcon}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`${styles.busquedaInput} ${isDark ? styles.inputDark : styles.inputLight}`}
            />
          </div>
          {pestana === "proveedores" && (
            <button
              onClick={() => setMostrarTodos(!mostrarTodos)}
              className={`${styles.filtroBtn} ${mostrarTodos ? styles.filtroBtnActivo : isDark ? styles.filtroBtnDark : styles.filtroBtnLight}`}
            >
              {mostrarTodos ? "👁️ Mostrando todos" : "👁️ Solo activos"}
            </button>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : pestana === "proveedores" ? (
          <div
            className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <div
              className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
            >
              <span>Proveedor</span>
              <span>RUT</span>
              <span>Contacto</span>
              <span>Estado</span>
              <span></span>
            </div>
            {proveedoresFiltrados.length === 0 ? (
              <p className={styles.empty}>No hay proveedores</p>
            ) : (
              proveedoresFiltrados.map((p) => (
                <div key={p.id_proveedor}>
                  <div
                    onClick={() =>
                      setExpandido(
                        expandido === p.id_proveedor ? null : p.id_proveedor,
                      )
                    }
                    className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight} ${expandido === p.id_proveedor ? styles.tablaRowActive : ""}`}
                  >
                    <span
                      className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                    >
                      {p.nom_proveedor}
                    </span>
                    <span className={styles.cod}>{p.rut || "—"}</span>
                    <span className={styles.cod}>{p.contacto || "—"}</span>
                    <span
                      className={`${styles.badge} ${p.activo ? styles.badgeOk : styles.badgeInactivo}`}
                    >
                      {p.activo ? "✅ Activo" : "❌ Inactivo"}
                    </span>
                    <span
                      className={`${styles.chevron} ${expandido === p.id_proveedor ? styles.chevronOpen : ""}`}
                    >
                      ›
                    </span>
                  </div>

                  {expandido === p.id_proveedor && (
                    <div
                      className={`${styles.acordeon} ${isDark ? styles.acordeonDark : styles.acordeonLight}`}
                    >
                      <div className={styles.acordeonGrid}>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>Nombre</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {p.nom_proveedor}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>RUT</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {p.rut || "—"}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>Contacto</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {p.contacto || "—"}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>Email</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {p.email || "—"}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>Teléfono</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {p.telefono || "—"}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>Estado</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {p.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.acordeonAcciones}>
                        <button
                          className={styles.editBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProveedorEditar(p);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemEliminar({ tipo: "proveedor", item: p });
                          }}
                        >
                          {p.activo ? "🚫 Desactivar" : "✅ Activar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div className={styles.tablaFooter}>
              <span className={styles.total}>
                {proveedoresFiltrados.length} proveedores
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <div
              className={`${styles.tablaHeaderFamilias} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
            >
              <span>Familia</span>
              <span>Código</span>
              <span>Proveedor</span>
              <span></span>
            </div>
            {familiasFiltradas.length === 0 ? (
              <p className={styles.empty}>No hay familias</p>
            ) : (
              familiasFiltradas.map((f) => (
                <div key={f.cod_familia}>
                  <div
                    onClick={() =>
                      setExpandido(
                        expandido === f.cod_familia ? null : f.cod_familia,
                      )
                    }
                    className={`${styles.tablaRowFamilias} ${isDark ? styles.tablaRowDark : styles.tablaRowLight} ${expandido === f.cod_familia ? styles.tablaRowActive : ""}`}
                  >
                    <span
                      className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                    >
                      {f.nom_familia}
                    </span>
                    <span className={styles.cod}>#{f.cod_familia}</span>
                    <span className={styles.cod}>
                      {f.id_proveedor
                        ? proveedores.find(
                            (p) => p.id_proveedor === f.id_proveedor,
                          )?.nom_proveedor || "—"
                        : "—"}
                    </span>
                    <span
                      className={`${styles.chevron} ${expandido === f.cod_familia ? styles.chevronOpen : ""}`}
                    >
                      ›
                    </span>
                  </div>

                  {expandido === f.cod_familia && (
                    <div
                      className={`${styles.acordeon} ${isDark ? styles.acordeonDark : styles.acordeonLight}`}
                    >
                      <div className={styles.acordeonGrid}>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>
                            Nombre familia
                          </span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {f.nom_familia}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>Código</span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            #{f.cod_familia}
                          </span>
                        </div>
                        <div className={styles.acordeonItem}>
                          <span className={styles.acordeonLabel}>
                            Proveedor
                          </span>
                          <span
                            className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                          >
                            {f.id_proveedor
                              ? proveedores.find(
                                  (p) => p.id_proveedor === f.id_proveedor,
                                )?.nom_proveedor || "—"
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.acordeonAcciones}>
                        <button
                          className={styles.editBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFamiliaEditar(f);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemEliminar({ tipo: "familia", item: f });
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
              <span className={styles.total}>
                {familiasFiltradas.length} familias
              </span>
            </div>
          </div>
        )}

        {/* Modal confirmación */}
        {itemEliminar && (
          <div className={styles.overlay}>
            <div
              className={`${styles.confirmModal} ${isDark ? styles.tablaDark : styles.tablaLight}`}
            >
              <h3 className={`${isDark ? styles.dark : styles.light}`}>
                {itemEliminar.tipo === "proveedor"
                  ? itemEliminar.item.activo
                    ? "¿Desactivar proveedor?"
                    : "¿Activar proveedor?"
                  : "¿Eliminar familia?"}
              </h3>
              <p className={styles.confirmText}>
                {itemEliminar.tipo === "proveedor"
                  ? `¿Estás seguro de ${itemEliminar.item.activo ? "desactivar" : "activar"} a `
                  : "¿Estás seguro de eliminar la familia "}
                <strong>
                  {itemEliminar.tipo === "proveedor"
                    ? itemEliminar.item.nom_proveedor
                    : itemEliminar.item.nom_familia}
                </strong>
                ?
              </p>
              <div className={styles.acordeonAcciones}>
                <button
                  className={`${styles.cancelBtn} ${isDark ? styles.cancelDark : styles.cancelLight}`}
                  onClick={() => setItemEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  className={
                    itemEliminar.tipo === "familia"
                      ? styles.deleteConfirmBtn
                      : styles.submitBtn
                  }
                  onClick={() => {
                    if (itemEliminar.tipo === "proveedor") {
                      itemEliminar.item.activo
                        ? desactivarProveedor(itemEliminar.item.id_proveedor)
                        : activarProveedor(itemEliminar.item.id_proveedor);
                    } else {
                      eliminarFamilia(itemEliminar.item.cod_familia);
                    }
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarModalProveedor && (
          <ProveedorModal
            onClose={() => setMostrarModalProveedor(false)}
            onGuardado={fetchData}
          />
        )}

        {proveedorEditar && (
          <ProveedorModal
            proveedor={proveedorEditar}
            onClose={() => setProveedorEditar(null)}
            onGuardado={fetchData}
          />
        )}

        {mostrarModalFamilia && (
          <FamiliaModal
            proveedores={proveedores}
            onClose={() => setMostrarModalFamilia(false)}
            onGuardado={fetchData}
          />
        )}

        {familiaEditar && (
          <FamiliaModal
            familia={familiaEditar}
            proveedores={proveedores}
            onClose={() => setFamiliaEditar(null)}
            onGuardado={fetchData}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ProveedoresPage;
