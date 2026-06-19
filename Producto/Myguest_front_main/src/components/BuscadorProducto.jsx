import { useState, useEffect, useRef } from "react";
import styles from "./BuscadorProducto.module.css";

const BuscadorProducto = ({
  productos,
  productoSeleccionadoId,
  onSeleccionar,
  isDark,
  placeholder = "Buscar producto...",
}) => {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const contenedorRef = useRef(null);

  const productoActual = productos.find(
    (p) => p.id_producto === productoSeleccionadoId,
  );

  useEffect(() => {
    if (productoActual) {
      setBusqueda(productoActual.nom_producto);
    } else {
      setBusqueda("");
    }
  }, [productoSeleccionadoId]);

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setMostrarLista(false);
        // Si no hay selección válida, restaurar texto del producto actual
        if (productoActual) {
          setBusqueda(productoActual.nom_producto);
        }
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [productoActual]);

  const coincidencias = busqueda.trim()
    ? productos
        .filter((p) =>
          p.nom_producto.toLowerCase().includes(busqueda.toLowerCase()),
        )
        .slice(0, 20)
    : productos.slice(0, 20);

  const handleSeleccionar = (producto) => {
    onSeleccionar(producto.id_producto);
    setBusqueda(producto.nom_producto);
    setMostrarLista(false);
  };

  return (
    <div className={styles.contenedor} ref={contenedorRef}>
      <input
        type="text"
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setMostrarLista(true);
          if (!e.target.value.trim()) {
            onSeleccionar(null);
          }
        }}
        onFocus={() => setMostrarLista(true)}
        placeholder={placeholder}
        className={`${styles.input} ${isDark ? styles.inputDark : ""} ${
          !productoSeleccionadoId ? styles.inputAlerta : ""
        }`}
      />
      {mostrarLista && (
        <div className={`${styles.lista} ${isDark ? styles.listaDark : ""}`}>
          {coincidencias.length === 0 ? (
            <div className={styles.sinResultados}>
              No se encontraron productos
            </div>
          ) : (
            coincidencias.map((p) => (
              <div
                key={p.id_producto}
                className={`${styles.opcion} ${isDark ? styles.opcionDark : ""} ${
                  p.id_producto === productoSeleccionadoId
                    ? styles.opcionActiva
                    : ""
                }`}
                onClick={() => handleSeleccionar(p)}
              >
                {p.nom_producto}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BuscadorProducto;
