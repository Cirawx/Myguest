import { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./FacturaModal.module.css";
import { actualizarFactura } from '../../services/facturacionService'

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "conciliada", label: "Conciliada" },
  { value: "con_diferencia", label: "Con diferencia" },
];

const FacturaEditModal = ({ factura, onClose, onGuardado }) => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    estado_conciliacion: factura.estado_conciliacion || "pendiente",
    obs: factura.obs || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await actualizarFactura(token, factura.id_factura, {
        estado_conciliacion: form.estado_conciliacion,
        obs: form.obs || null,
      });
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
        style={{ maxWidth: "420px" }}
      >
        <div className={styles.header}>
          <h2
            className={`${styles.title} ${isDark ? styles.darkText : styles.lightText}`}
          >
            Editar Estado — {factura.num_documento}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Estado de conciliación *</label>
            <select
              name="estado_conciliacion"
              value={form.estado_conciliacion}
              onChange={handleChange}
              className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Observaciones</label>
            <textarea
              name="obs"
              value={form.obs}
              onChange={handleChange}
              placeholder="Observaciones opcionales"
              rows={3}
              className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
            />
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
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacturaEditModal;
