import { useState } from 'react'
import useThemeStore from '../../store/themeStore'
import useAuthStore from '../../store/authStore'
import styles from './UsuarioModal.module.css'

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const UsuarioEditModal = ({ usuario, onClose, onUsuarioEditado }) => {
  const { isDark } = useThemeStore()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nom: usuario.nom || '',
    nom_preferido: usuario.nom_preferido || '',
    primer_apellido: usuario.primer_apellido || '',
    segundo_apellido: usuario.segundo_apellido || '',
    login: usuario.login || '',
    cod_perfil: String(usuario.cod_perfil),
    cod_carrera: String(usuario.cod_carrera)
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/usuarios/${usuario.id_usuario}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          cod_perfil: parseInt(form.cod_perfil),
          cod_carrera: parseInt(form.cod_carrera)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Error al editar el usuario')
      }

      onUsuarioEditado()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${isDark ? styles.dark : styles.light}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={`${styles.title} ${isDark ? styles.darkText : styles.lightText}`}>
            Editar Usuario
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
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
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Apellido materno *</label>
              <input
                name="segundo_apellido"
                value={form.segundo_apellido}
                onChange={handleChange}
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
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Código de carrera *</label>
              <input
                name="cod_carrera"
                type="number"
                value={form.cod_carrera}
                onChange={handleChange}
                required
                className={`${styles.input} ${isDark ? styles.inputDark : styles.inputLight}`}
              />
            </div>

          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default UsuarioEditModal