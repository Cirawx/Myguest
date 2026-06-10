import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./InventarioPage.module.css";
import ProductoModal from "./ProductoModal";
import ProductoEditModal from "./ProductoEditModal";
import {
  getNombreUnidad,
  getNombreCategoria,
} from "../../utils/inventarioData";
import { getProductos, getInventario, getFamilias, eliminarProducto as eliminarProductoService, actualizarStockMinimo } from "../../services/inventarioService";

const InventarioPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [pestana, setPestana] = useState("productos");
  const [productos, setProductos] = useState([]);
  const [stock, setStock] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFamilia, setFiltroFamilia] = useState("todas");
  const [agrupar, setAgrupar] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productosRes, stockRes, familiasRes] = await Promise.all([
          getProductos(token),
          getInventario(token),
          getFamilias(token),
        ]);
        setProductos(productosRes);
        setStock(stockRes);
        setFamilias(familiasRes);
      } catch (err) {
        console.error("Error cargando inventario:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const productosFiltrados = productos
    .filter((p) =>
      p.nom_producto.toLowerCase().includes(busqueda.toLowerCase()),
    )
    .filter((p) =>
      filtroFamilia === "todas"
        ? true
        : p.cod_familia === parseInt(filtroFamilia),
    );

  const productosAgrupados = familias
    .map((f) => ({
      familia: f,
      productos: productosFiltrados.filter(
        (p) => p.cod_familia === f.cod_familia,
      ),
    }))
    .filter((g) => g.productos.length > 0);

  const stockFiltrado = stock.filter((s) =>
    s.nom_producto.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const recargarProductos = async () => {
    try {
      const data = await getProductos(token);
      setProductos(data);
    } catch (err) {
      console.error("Error recargando productos:", err);
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
              Inventario
            </h1>
            <p className={styles.subtitle}>Gestión de productos y stock</p>
          </div>
          <button
            className={styles.newBtn}
            onClick={() => setMostrarModal(true)}
          >
            + Nuevo Producto
          </button>
        </div>

        {/* Pestañas */}
        <div className={styles.pestanas}>
          <button
            onClick={() => {
              setPestana("productos");
              setBusqueda("");
              setAgrupar(false);
            }}
            className={`${styles.pestana} ${pestana === "productos" ? styles.pestanaActiva : isDark ? styles.pestanaDark : styles.pestanaLight}`}
          >
            📦 Productos
          </button>
          <button
            onClick={() => {
              setPestana("stock");
              setBusqueda("");
            }}
            className={`${styles.pestana} ${pestana === "stock" ? styles.pestanaActiva : isDark ? styles.pestanaDark : styles.pestanaLight}`}
          >
            📊 Stock
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

          {pestana === "productos" && (
            <div className={styles.controlesRight}>
              <select
                value={filtroFamilia}
                onChange={(e) => setFiltroFamilia(e.target.value)}
                className={`${styles.select} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="todas">Todas las familias</option>
                {familias.map((f) => (
                  <option key={f.cod_familia} value={f.cod_familia}>
                    {f.nom_familia}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAgrupar(!agrupar)}
                className={`${styles.agruparBtn} ${agrupar ? styles.agruparBtnActivo : isDark ? styles.agruparBtnDark : styles.agruparBtnLight}`}
              >
                {agrupar ? "📂 Agrupado" : "📁 Agrupar por familia"}
              </button>
            </div>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className={styles.loading}>Cargando inventario...</div>
        ) : pestana === "productos" ? (
          agrupar ? (
            <div className={styles.grupos}>
              {productosAgrupados.length === 0 ? (
                <p className={styles.empty}>No hay productos en esta familia</p>
              ) : (
                productosAgrupados.map((grupo) => (
                  <div key={grupo.familia.cod_familia} className={styles.grupo}>
                    <h3
                      className={`${styles.grupoTitulo} ${isDark ? styles.dark : styles.light}`}
                    >
                      🏷️ {grupo.familia.nom_familia}
                      <span className={styles.grupoBadge}>
                        {grupo.productos.length}
                      </span>
                    </h3>
                    <TablaProductos
                      productos={grupo.productos}
                      isDark={isDark}
                      familias={familias}
                      token={token}
                      onRecargar={recargarProductos}
                    />
                  </div>
                ))
              )}
            </div>
          ) : (
            <TablaProductos
              productos={productosFiltrados}
              isDark={isDark}
              familias={familias}
              token={token}
              onRecargar={recargarProductos}
            />
          )
        ) : (
          <TablaStock
            stock={stockFiltrado}
            isDark={isDark}
            token={token}
            onRecargar={recargarProductos}
          />
        )}

        {mostrarModal && (
          <ProductoModal
            onClose={() => setMostrarModal(false)}
            onProductoCreado={recargarProductos}
            familias={familias}
          />
        )}
      </div>
    </MainLayout>
  );
};

const TablaProductos = ({ productos, isDark, familias, token, onRecargar }) => {
  const [expandido, setExpandido] = useState(null);
  const [productoEliminar, setProductoEliminar] = useState(null);
  const [productoEditar, setProductoEditar] = useState(null);

  const eliminarProducto = async () => {
    try {
      await eliminarProductoService(token, productoEliminar.id_producto);
      setProductoEliminar(null);
      setExpandido(null);
      onRecargar();
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
  };
  return (
    <>
      <div
        className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
      >
        <div
          className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
        >
          <span>Producto</span>
          <span>Precio</span>
          <span>Categoría</span>
          <span>Unidad</span>
          <span></span>
        </div>
        {productos.length === 0 ? (
          <p className={styles.empty}>No hay productos</p>
        ) : (
          productos.map((p) => (
            <div key={p.id_producto}>
              <div
                onClick={() =>
                  setExpandido(
                    expandido === p.id_producto ? null : p.id_producto,
                  )
                }
                className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight} ${expandido === p.id_producto ? styles.tablaRowActive : ""}`}
              >
                <span
                  className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
                >
                  {p.nom_producto}
                </span>
                <span className={styles.precio}>
                  ${p.precio.toLocaleString()}
                </span>
                <span className={styles.cod}>
                  {getNombreCategoria(p.cod_categ_producto)}
                </span>
                <span className={styles.cod}>
                  {getNombreUnidad(p.cod_unidad_medida)}
                </span>
                <span
                  className={`${styles.chevron} ${expandido === p.id_producto ? styles.chevronOpen : ""}`}
                >
                  ›
                </span>
              </div>

              {expandido === p.id_producto && (
                <div
                  className={`${styles.acordeon} ${isDark ? styles.acordeonDark : styles.acordeonLight}`}
                >
                  <div className={styles.acordeonGrid}>
                    <div className={styles.acordeonItem}>
                      <span className={styles.acordeonLabel}>ID Producto</span>
                      <span
                        className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                      >
                        #{p.id_producto}
                      </span>
                    </div>
                    <div className={styles.acordeonItem}>
                      <span className={styles.acordeonLabel}>Precio</span>
                      <span
                        className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                      >
                        ${p.precio.toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.acordeonItem}>
                      <span className={styles.acordeonLabel}>Categoría</span>
                      <span
                        className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                      >
                        {getNombreCategoria(p.cod_categ_producto)}
                      </span>
                    </div>
                    <div className={styles.acordeonItem}>
                      <span className={styles.acordeonLabel}>
                        Unidad de medida
                      </span>
                      <span
                        className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                      >
                        {getNombreUnidad(p.cod_unidad_medida)}
                      </span>
                    </div>
                    <div className={styles.acordeonItem}>
                      <span className={styles.acordeonLabel}>Familia</span>
                      <span
                        className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                      >
                        {p.cod_familia
                          ? familias.find(
                              (f) => f.cod_familia === p.cod_familia,
                            )?.nom_familia || `Fam. ${p.cod_familia}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.acordeonAcciones}>
                    <button
                      className={styles.editBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductoEditar(p);
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductoEliminar(p);
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
          <span className={styles.total}>{productos.length} productos</span>
        </div>
      </div>

      {productoEliminar && (
        <div className={styles.overlay}>
          <div
            className={`${styles.confirmModal} ${isDark ? styles.tablaDark : styles.tablaLight}`}
          >
            <h3 className={`${isDark ? styles.dark : styles.light}`}>
              ¿Eliminar producto?
            </h3>
            <p className={styles.confirmText}>
              Esta acción no se puede deshacer. ¿Estás seguro de eliminar{" "}
              <strong>{productoEliminar.nom_producto}</strong>?
            </p>
            <div className={styles.acordeonAcciones}>
              <button
                className={`${styles.cancelBtn} ${isDark ? styles.cancelDark : styles.cancelLight}`}
                onClick={() => setProductoEliminar(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={eliminarProducto}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {productoEditar && (
        <ProductoEditModal
          producto={productoEditar}
          onClose={() => setProductoEditar(null)}
          onProductoEditado={onRecargar}
          familias={familias}
        />
      )}
    </>
  );
};

const TablaStock = ({ stock, isDark, token, onRecargar }) => {
  const [expandido, setExpandido] = useState(null);
  const [nuevoMinimo, setNuevoMinimo] = useState("");
  const [loading, setLoading] = useState(false);

  const actualizarStockMinimo = async (id_producto) => {
    setLoading(true);
    try {
      await actualizarStockMinimo(token, id_producto, {
        stock_minimo: parseFloat(nuevoMinimo),
      });
      setExpandido(null);
      setNuevoMinimo("");
      onRecargar();
    } catch (err) {
      console.error("Error actualizando stock mínimo:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${styles.tabla} ${isDark ? styles.tablaDark : styles.tablaLight}`}
    >
      <div
        className={`${styles.tablaHeader} ${isDark ? styles.tablaHeaderDark : styles.tablaHeaderLight}`}
      >
        <span>Producto</span>
        <span>Stock Actual</span>
        <span>Stock Mínimo</span>
        <span>Estado</span>
        <span></span>
      </div>
      {stock.length === 0 ? (
        <p className={styles.empty}>No hay datos de stock</p>
      ) : (
        stock.map((s) => (
          <div key={s.id_producto}>
            <div
              onClick={() => {
                setExpandido(
                  expandido === s.id_producto ? null : s.id_producto,
                );
                setNuevoMinimo(String(s.stock_minimo));
              }}
              className={`${styles.tablaRow} ${isDark ? styles.tablaRowDark : styles.tablaRowLight} ${expandido === s.id_producto ? styles.tablaRowActive : ""}`}
            >
              <span
                className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
              >
                {s.nom_producto}
              </span>
              <span
                className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
              >
                {s.stock_actual}
              </span>
              <span
                className={`${styles.nombre} ${isDark ? styles.dark : styles.light}`}
              >
                {s.stock_minimo}
              </span>
              <span
                className={`${styles.badge} ${s.stock_actual <= s.stock_minimo ? styles.badgeCritico : styles.badgeOk}`}
              >
                {s.stock_actual <= s.stock_minimo ? "⚠️ Crítico" : "✅ Ok"}
              </span>
              <span
                className={`${styles.chevron} ${expandido === s.id_producto ? styles.chevronOpen : ""}`}
              >
                ›
              </span>
            </div>

            {expandido === s.id_producto && (
              <div
                className={`${styles.acordeon} ${isDark ? styles.acordeonDark : styles.acordeonLight}`}
              >
                <div className={styles.acordeonGrid}>
                  <div className={styles.acordeonItem}>
                    <span className={styles.acordeonLabel}>Stock actual</span>
                    <span
                      className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                    >
                      {s.stock_actual}
                    </span>
                  </div>
                  <div className={styles.acordeonItem}>
                    <span className={styles.acordeonLabel}>
                      Stock mínimo actual
                    </span>
                    <span
                      className={`${styles.acordeonValue} ${isDark ? styles.dark : styles.light}`}
                    >
                      {s.stock_minimo}
                    </span>
                  </div>
                  <div className={styles.acordeonItem}>
                    <span className={styles.acordeonLabel}>Diferencia</span>
                    <span
                      className={`${styles.acordeonValue} ${s.diferencia < 0 ? styles.badgeCritico : styles.badgeOk}`}
                    >
                      {s.diferencia}
                    </span>
                  </div>
                </div>
                <div className={styles.stockMinimoForm}>
                  <label className={styles.acordeonLabel}>
                    Nuevo stock mínimo
                  </label>
                  <div className={styles.stockMinimoInput}>
                    <input
                      type="number"
                      value={nuevoMinimo}
                      onChange={(e) => setNuevoMinimo(e.target.value)}
                      className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className={styles.newBtn}
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        actualizarStockMinimo(s.id_producto);
                      }}
                    >
                      {loading ? "Guardando..." : "Actualizar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
      <div className={styles.tablaFooter}>
        <span className={styles.total}>{stock.length} productos</span>
      </div>
    </div>
  );
};

export default InventarioPage;
