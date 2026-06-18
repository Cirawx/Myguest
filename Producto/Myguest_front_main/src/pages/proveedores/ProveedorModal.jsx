import { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./ProveedorModal.module.css";

const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app';

const ProveedorModal = ({ proveedor, onClose, onGuardado }) => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const esEdicion = !!proveedor;

  const [form, setForm] = useState({
    nom_proveedor: proveedor?.nom_proveedor || "",
    rut: proveedor?.rut || "",
    contacto: proveedor?.contacto || "",
    email: proveedor?.email || "",
    telefono: proveedor?.telefono || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = esEdicion
        ? `${API_URL}/proveedores/${proveedor.id_proveedor}`
        : `${API_URL}/proveedores/`;
      const method = esEdicion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom_proveedor: form.nom_proveedor,
          rut: form.rut || null,
          contacto: form.contacto || null,
          email: form.email || null,
          telefono: form.telefono || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error al guardar el proveedor");
      }

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
            {esEdicion ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Nombre del proveedor *</label>
              <input
                name="nom_proveedor"
                value={form.nom_proveedor}
                onChange={handleChange}
                placeholder="Nombre del proveedor"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>RUT</label>
              <input
                name="rut"
                value={form.rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contacto</label>
              <input
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
                placeholder="Nombre del contacto"
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@proveedor.cl"
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>
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
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading
                ? "Guardando..."
                : esEdicion
                  ? "Guardar Cambios"
                  : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProveedorModal;
