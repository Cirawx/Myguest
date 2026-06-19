import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./IngestaFacturaPage.module.css";
import {
  uploadFactura,
  extractFactura,
  cancelarIngesta,
  homologarFactura,
  commitFactura,
} from "../../services/ingestaService";
import { getProductos } from "../../services/inventarioService";
import BuscadorProducto from "../../components/BuscadorProducto";

const ESTADOS = {
  INICIO: "inicio", // sin archivo aun
  SUBIENDO: "subiendo", // upload en curso
  PROCESANDO: "procesando", // OCR en curso
  VALIDANDO: "validando", // mostrar split-screen
  ENVIANDO: "enviando", // confirmando factura
};

const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const IngestaFacturaPage = () => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [estado, setEstado] = useState(ESTADOS.INICIO);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mostrarDebug, setMostrarDebug] = useState(false);
  const [productos, setProductos] = useState([]);

  // Datos del flujo
  const [archivo, setArchivo] = useState(null);
  const [archivoUrl, setArchivoUrl] = useState(null); // URL local para preview
  const [ingestaData, setIngestaData] = useState(null); // respuesta del upload

  // Formulario editable (resultado del OCR)
  const [formData, setFormData] = useState({
    proveedor_rut: "",
    proveedor_razon_social: "",
    folio: "",
    fecha_emision: "",
    subtotal: "",
    iva: "",
    total: "",
    texto_crudo: "",
    items: [],
    confianza: 0,
  });

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await getProductos(token);
        setProductos(data);
      } catch (err) {
        console.error("Error cargando catálogo de productos:", err);
      }
    };
    cargarProductos();
  }, [token]);

  // ============================================================
  // PASO 1: SUBIR Y EXTRAER
  // ============================================================
  const procesarArchivo = async (file) => {
    setError(null);

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setError("Tipo de archivo no soportado. Solo PDF, JPG o PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera los 10 MB.");
      return;
    }

    setArchivo(file);
    setArchivoUrl(URL.createObjectURL(file));

    try {
      // Paso 1: Upload
      setEstado(ESTADOS.SUBIENDO);
      const upload = await uploadFactura(token, file);
      setIngestaData(upload);

      // Paso 2: OCR
      setEstado(ESTADOS.PROCESANDO);
      const ocr = await extractFactura(
        token,
        upload.storage_path,
        upload.tipo_mime,
      );

      // Paso 3: Homologar items contra catálogo
      const homologado = await homologarFactura(token, {
        id_ingesta: upload.id_ingesta,
        proveedor_rut: ocr.proveedor_rut || null,
        proveedor_razon_social: ocr.proveedor_razon_social || null,
        folio: ocr.folio || null,
        fecha_emision: ocr.fecha_emision || null,
        subtotal: ocr.subtotal || null,
        iva: ocr.iva || null,
        total: ocr.total || null,
        items: (ocr.items || []).map((item) => ({
          descripcion_raw: item.descripcion_raw || "",
          cantidad: item.cantidad || null,
          unidad: item.unidad || null,
          precio_unitario: item.precio_unitario || null,
          subtotal: item.subtotal || null,
        })),
      });

      // Pasar al formulario con homologación
      setFormData({
        proveedor_rut: homologado.proveedor_rut || "",
        proveedor_razon_social: homologado.proveedor_razon_social || "",
        folio: homologado.folio || "",
        fecha_emision: homologado.fecha_emision || "",
        subtotal: homologado.subtotal || "",
        iva: homologado.iva || "",
        total: homologado.total || "",
        texto_crudo: ocr.texto_crudo || "",
        items: (homologado.items || []).map((item) => ({
          descripcion: item.descripcion_raw || "",
          cantidad: item.cantidad || "",
          unidad: item.unidad || "",
          precio_unitario: item.precio_unitario || "",
          subtotal: item.subtotal || "",
          sugerencias: item.sugerencias || [],
          id_producto_seleccionado: item.id_producto_seleccionado || null,
          requiere_revision: item.requiere_revision ?? true,
        })),
        confianza: ocr.confianza_global || 0,
      });

      setEstado(ESTADOS.VALIDANDO);
    } catch (err) {
      console.error("Error en ingesta:", err);
      setError(err.message || "Error procesando el archivo");
      setEstado(ESTADOS.INICIO);
    }
  };

  // ============================================================
  // HANDLERS DE UPLOAD
  // ============================================================
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  // ============================================================
  // CANCELAR / CONFIRMAR
  // ============================================================
  const handleCancelar = async () => {
    if (ingestaData?.storage_path) {
      try {
        await cancelarIngesta(token, ingestaData.storage_path);
      } catch (err) {
        console.error("No se pudo eliminar del storage:", err);
      }
    }
    resetEstado();
  };

  const resetEstado = () => {
    setEstado(ESTADOS.INICIO);
    setArchivo(null);
    if (archivoUrl) URL.revokeObjectURL(archivoUrl);
    setArchivoUrl(null);
    setIngestaData(null);
    setError(null);
    setFormData({
      proveedor_rut: "",
      proveedor_razon_social: "",
      folio: "",
      fecha_emision: "",
      subtotal: "",
      iva: "",
      total: "",
      texto_crudo: "",
      items: [],
      confianza: 0,
    });
  };

  const handleConfirmar = async () => {
    // Validar que todos los items tengan producto asignado
    const itemsSinProducto = formData.items.filter(
      (item) => !item.id_producto_seleccionado,
    );
    if (itemsSinProducto.length > 0) {
      setError(
        `Hay ${itemsSinProducto.length} item(s) sin producto asignado. Selecciona un producto para cada uno.`,
      );
      return;
    }

    if (!formData.folio || !formData.fecha_emision) {
      setError("Folio y fecha de emisión son obligatorios.");
      return;
    }

    try {
      setEstado(ESTADOS.ENVIANDO);
      const resultado = await commitFactura(token, {
        id_ingesta: ingestaData.id_ingesta,
        id_proveedor: ingestaData.id_proveedor || 1, // TODO: resolver proveedor
        folio: formData.folio,
        fecha_emision: formData.fecha_emision,
        subtotal: Number(formData.subtotal) || 0,
        iva: Number(formData.iva) || 0,
        total: Number(formData.total) || 0,
        items: formData.items.map((item) => ({
          id_producto: item.id_producto_seleccionado,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
        })),
      });

      alert(
        `✅ Factura #${resultado.id_factura} registrada correctamente. Stock actualizado.`,
      );
      navigate("/facturacion");
    } catch (err) {
      setError(err.message || "Error al confirmar la factura");
      setEstado(ESTADOS.VALIDANDO);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          descripcion: "",
          cantidad: "",
          unidad: "",
          precio_unitario: "",
          subtotal: "",
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const stepClass = (paso) => {
    const base = `${styles.step} ${isDark ? styles.stepDark : ""}`;
    if (estado === ESTADOS.INICIO && paso === 1)
      return `${base} ${isDark ? styles.stepActiveDark : styles.stepActive}`;
    if (
      (estado === ESTADOS.SUBIENDO || estado === ESTADOS.PROCESANDO) &&
      paso === 2
    )
      return `${base} ${isDark ? styles.stepActiveDark : styles.stepActive}`;
    if (estado === ESTADOS.VALIDANDO && paso === 3)
      return `${base} ${isDark ? styles.stepActiveDark : styles.stepActive}`;
    if (estado === ESTADOS.VALIDANDO && paso < 3)
      return `${base} ${styles.stepDone}`;
    if (
      (estado === ESTADOS.SUBIENDO || estado === ESTADOS.PROCESANDO) &&
      paso === 1
    )
      return `${base} ${styles.stepDone}`;
    return base;
  };

  const stepNumber = (paso, done) => {
    const base = styles.stepNumber;
    if (done) return `${base} ${styles.stepNumberDone}`;
    if (
      (estado === ESTADOS.INICIO && paso === 1) ||
      ((estado === ESTADOS.SUBIENDO || estado === ESTADOS.PROCESANDO) &&
        paso === 2) ||
      (estado === ESTADOS.VALIDANDO && paso === 3)
    ) {
      return `${base} ${styles.stepNumberActive}`;
    }
    return base;
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
              📥 Ingesta inteligente de facturas
            </h1>
            <p className={styles.subtitle}>
              Sube un PDF o foto de factura y extrae automáticamente los datos
              con OCR
            </p>
          </div>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/facturacion")}
          >
            ← Volver a Facturación
          </button>
        </div>

        {/* Pasos */}
        <div className={styles.steps}>
          <div className={stepClass(1)}>
            <div className={stepNumber(1, estado !== ESTADOS.INICIO)}>1</div>
            <span className={styles.stepLabel}>Subir archivo</span>
          </div>
          <div className={stepClass(2)}>
            <div className={stepNumber(2, estado === ESTADOS.VALIDANDO)}>2</div>
            <span className={styles.stepLabel}>Procesar OCR</span>
          </div>
          <div className={stepClass(3)}>
            <div className={stepNumber(3, false)}>3</div>
            <span className={styles.stepLabel}>Validar y confirmar</span>
          </div>
        </div>

        {/* Mensajes */}
        {error && <div className={styles.error}>⚠️ {error}</div>}

        {/* ESTADO: INICIO -> Zona de upload */}
        {estado === ESTADOS.INICIO && (
          <div
            className={`${styles.uploadZone} ${isDark ? styles.uploadZoneDark : ""} ${dragging ? styles.uploadZoneDragging : ""}`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className={styles.uploadIcon}>📄</div>
            <div
              className={`${styles.uploadText} ${isDark ? styles.dark : styles.light}`}
            >
              Arrastra el archivo aquí o haz clic para seleccionar
            </div>
            <div className={styles.uploadHint}>
              Formatos permitidos: PDF, JPG, PNG · Máximo 10 MB
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className={styles.hiddenInput}
            />
          </div>
        )}

        {/* ESTADO: SUBIENDO o PROCESANDO -> Loading */}
        {(estado === ESTADOS.SUBIENDO || estado === ESTADOS.PROCESANDO) && (
          <div className={styles.loading}>
            <span className={styles.spinner}></span>
            {estado === ESTADOS.SUBIENDO
              ? "Subiendo archivo al servidor..."
              : "Procesando con OCR... (puede tardar 5-15 segundos)"}
          </div>
        )}

        {/* ESTADO: VALIDANDO -> Split-screen */}
        {estado === ESTADOS.VALIDANDO && (
          <div className={styles.splitScreen}>
            {/* PANEL IZQUIERDO: Preview del archivo */}
            <div
              className={`${styles.panel} ${isDark ? styles.panelDark : ""}`}
            >
              <h3
                className={`${styles.panelTitle} ${isDark ? styles.panelTitleDark : ""} ${isDark ? styles.dark : styles.light}`}
              >
                Archivo original
              </h3>
              {archivo?.type === "application/pdf" ? (
                <iframe
                  src={archivoUrl}
                  className={styles.previewFrame}
                  title="Preview factura PDF"
                />
              ) : (
                <img
                  src={archivoUrl}
                  alt="Preview factura"
                  className={styles.previewImage}
                />
              )}
            </div>

            {/* PANEL DERECHO: Formulario editable */}
            <div
              className={`${styles.panel} ${isDark ? styles.panelDark : ""}`}
            >
              <h3
                className={`${styles.panelTitle} ${isDark ? styles.panelTitleDark : ""} ${isDark ? styles.dark : styles.light}`}
              >
                Datos extraídos
                <span className={styles.badgeAuto}>
                  {formData.confianza >= 0.9 ? "🤖 IA" : "📄 OCR"}
                </span>
                <span
                  className={`${styles.confianzaBadge} ${
                    formData.confianza >= 0.9
                      ? styles.confianzaAlta
                      : styles.confianzaMedia
                  }`}
                >
                  Confianza {Math.round(formData.confianza * 100)}%
                </span>
              </h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label
                    className={`${styles.label} ${isDark ? styles.labelDark : ""}`}
                  >
                    RUT proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor_rut}
                    onChange={(e) =>
                      handleChange("proveedor_rut", e.target.value)
                    }
                    className={`${styles.input} ${isDark ? styles.inputDark : ""}`}
                    placeholder="12345678-9"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.label} ${isDark ? styles.labelDark : ""}`}
                  >
                    Folio
                  </label>
                  <input
                    type="text"
                    value={formData.folio}
                    onChange={(e) => handleChange("folio", e.target.value)}
                    className={`${styles.input} ${isDark ? styles.inputDark : ""}`}
                    placeholder="123456"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label
                    className={`${styles.label} ${isDark ? styles.labelDark : ""}`}
                  >
                    Razón social
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor_razon_social}
                    onChange={(e) =>
                      handleChange("proveedor_razon_social", e.target.value)
                    }
                    className={`${styles.input} ${isDark ? styles.inputDark : ""}`}
                    placeholder="Ej. EZO HUERTO URBANO SPA"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.label} ${isDark ? styles.labelDark : ""}`}
                  >
                    Fecha emisión
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_emision}
                    onChange={(e) =>
                      handleChange("fecha_emision", e.target.value)
                    }
                    className={`${styles.input} ${isDark ? styles.inputDark : ""}`}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.label} ${isDark ? styles.labelDark : ""}`}
                  >
                    Subtotal
                  </label>
                  <input
                    type="number"
                    value={formData.subtotal}
                    onChange={(e) => handleChange("subtotal", e.target.value)}
                    className={`${styles.input} ${isDark ? styles.inputDark : ""}`}
                    placeholder="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.label} ${isDark ? styles.labelDark : ""}`}
                  >
                    IVA
                  </label>
                  <input
                    type="number"
                    value={formData.iva}
                    onChange={(e) => handleChange("iva", e.target.value)}
                    className={`${styles.input} ${isDark ? styles.inputDark : ""}`}
                    placeholder="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label
                    className={`${styles.label} ${isDark ? styles.labelDark : ""}`}
                  >
                    Total
                  </label>
                  <input
                    type="number"
                    value={formData.total}
                    onChange={(e) => handleChange("total", e.target.value)}
                    className={`${styles.input} ${isDark ? styles.inputDark : ""}`}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* === Tabla de items === */}
              <div
                className={`${styles.itemsSection} ${isDark ? styles.itemsSectionDark : ""}`}
              >
                <div className={styles.itemsSectionTitle}>
                  <span className={isDark ? styles.dark : styles.light}>
                    🛒 Productos / Servicios
                  </span>
                  <span className={styles.itemsCount}>
                    {formData.items.length}{" "}
                    {formData.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {formData.items.length === 0 ? (
                  <div className={styles.itemsEmpty}>
                    No se detectaron items. Agrega uno manualmente abajo.
                  </div>
                ) : (
                  <table
                    className={`${styles.itemsTable} ${isDark ? styles.itemsTableDark : ""}`}
                  >
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>Unidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={item.descripcion}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "descripcion",
                                  e.target.value,
                                )
                              }
                              className={`${styles.itemInput} ${styles.itemInputDescripcion} ${isDark ? styles.itemInputDark : ""}`}
                            />
                            <div style={{ marginTop: "4px" }}>
                              <BuscadorProducto
                                productos={productos}
                                productoSeleccionadoId={
                                  item.id_producto_seleccionado
                                }
                                onSeleccionar={(idProducto) =>
                                  handleItemChange(
                                    index,
                                    "id_producto_seleccionado",
                                    idProducto,
                                  )
                                }
                                isDark={isDark}
                                placeholder={
                                  item.requiere_revision
                                    ? "⚠️ Buscar producto..."
                                    : "Buscar producto..."
                                }
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={item.cantidad}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "cantidad",
                                  e.target.value,
                                )
                              }
                              className={`${styles.itemInput} ${styles.itemInputCantidad} ${isDark ? styles.itemInputDark : ""}`}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.unidad}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unidad",
                                  e.target.value,
                                )
                              }
                              className={`${styles.itemInput} ${styles.itemInputUnidad} ${isDark ? styles.itemInputDark : ""}`}
                              placeholder="UN"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.precio_unitario}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "precio_unitario",
                                  e.target.value,
                                )
                              }
                              className={`${styles.itemInput} ${styles.itemInputPrecio} ${isDark ? styles.itemInputDark : ""}`}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.subtotal}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "subtotal",
                                  e.target.value,
                                )
                              }
                              className={`${styles.itemInput} ${styles.itemInputPrecio} ${isDark ? styles.itemInputDark : ""}`}
                            />
                          </td>
                          <td>
                            <button
                              className={styles.itemRemoveBtn}
                              onClick={() => handleRemoveItem(index)}
                              title="Eliminar item"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <button className={styles.addItemBtn} onClick={handleAddItem}>
                  + Agregar item manualmente
                </button>
              </div>

              {/* Debug OCR */}
              <button
                className={styles.debugToggle}
                onClick={() => setMostrarDebug(!mostrarDebug)}
              >
                {mostrarDebug ? "▼ Ocultar" : "▶ Mostrar"} texto OCR crudo
                (debug)
              </button>
              {mostrarDebug && (
                <div
                  className={`${styles.debugSection} ${isDark ? styles.debugSectionDark : ""}`}
                >
                  {formData.texto_crudo || "(vacío)"}
                </div>
              )}

              {/* Acciones */}
              <div
                className={`${styles.actions} ${isDark ? styles.actionsDark : ""}`}
              >
                <button className={styles.dangerBtn} onClick={handleCancelar}>
                  Cancelar
                </button>
                <button className={styles.primaryBtn} onClick={handleConfirmar}>
                  Confirmar factura
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IngestaFacturaPage;
