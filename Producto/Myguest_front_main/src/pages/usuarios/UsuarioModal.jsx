import { useState } from "react";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import styles from "./UsuarioModal.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const UsuarioModal = ({ onClose, onUsuarioCreado }) => {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    login: "",
    password: "",
    confirmar_password: "",
    nom: "",
    primer_apellido: "",
    segundo_apellido: "",
    cod_perfil: "2",
    cod_carrera: "1",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password !== form.confirmar_password) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número",
      );
      setLoading(false);
      return;
    }

    const dominiosValidos = ["@profesor.duoc.cl", "@duoc.cl"];
    const dominioValido = dominiosValidos.some((dominio) =>
      form.login.endsWith(dominio),
    );

    if (!dominioValido) {
      setError(
        "Solo se permiten correos institucionales (@duoc.cl o @profesor.duoc.cl)",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: form.nom,
          primer_apellido: form.primer_apellido,
          segundo_apellido: form.segundo_apellido,
          login: form.login,
          password: form.password,
          cod_perfil: parseInt(form.cod_perfil),
          cod_carrera: parseInt(form.cod_carrera),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error al crear el usuario");
      }

      onUsuarioCreado();
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
        {/* Header */}
        <div className={styles.header}>
          <h2
            className={`${styles.title} ${isDark ? styles.darkText : styles.lightText}`}
          >
            Nuevo Usuario
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre *</label>
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Nombre"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Apellido paterno *</label>
              <input
                name="primer_apellido"
                value={form.primer_apellido}
                onChange={handleChange}
                placeholder="Apellido paterno"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Apellido materno *</label>
              <input
                name="segundo_apellido"
                value={form.segundo_apellido}
                onChange={handleChange}
                placeholder="Apellido materno"
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Correo institucional *</label>
              <input
                name="login"
                type="email"
                value={form.login}
                onChange={handleChange}
                placeholder="usuario@duoc.cl"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Contraseña *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>Confirmar contraseña *</label>
              <input
                name="confirmar_password"
                type="password"
                value={form.confirmar_password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Perfil *</label>
              <select
                name="cod_perfil"
                value={form.cod_perfil}
                onChange={handleChange}
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              >
                <option value="0">Administrador TI</option>
                <option value="1">Admin Carrera</option>
                <option value="2">Docente</option>
                <option value="3">Bodeguero</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Código de carrera *</label>
              <input
                name="cod_carrera"
                type="number"
                value={form.cod_carrera}
                onChange={handleChange}
                placeholder="1"
                required
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
              {loading ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioModal;
