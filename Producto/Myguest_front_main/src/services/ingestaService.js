const API_URL = import.meta.env.VITE_API_URL || 'https://myguest-production-9e8f.up.railway.app'

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
})

/**
 * Sube un archivo de factura al backend.
 * @param {string} token - JWT del usuario
 * @param {File} archivo - PDF o imagen seleccionada por el usuario
 * @returns {Promise<Object>} { id_ingesta, storage_path, storage_url, hash_sha256, ... }
 */
export const uploadFactura = async (token, archivo) => {
  const formData = new FormData()
  formData.append('archivo', archivo)

  const res = await fetch(`${API_URL}/ingesta/upload`, {
    method: 'POST',
    headers: getHeaders(token), // NO ponemos Content-Type, fetch lo arma con boundary
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error al subir el archivo' }))
    throw new Error(error.detail || 'Error al subir el archivo')
  }
  return res.json()
}

/**
 * Procesa OCR sobre un archivo ya subido.
 * @param {string} token - JWT del usuario
 * @param {string} storagePath - storage_path retornado por uploadFactura
 * @param {string} tipoMime - "application/pdf", "image/jpeg", etc.
 * @returns {Promise<Object>} { proveedor_rut, folio, fecha_emision, total, texto_crudo, ... }
 */
export const extractFactura = async (token, storagePath, tipoMime) => {
  const res = await fetch(`${API_URL}/ingesta/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(token) },
    body: JSON.stringify({ storage_path: storagePath, tipo_mime: tipoMime }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error al extraer datos' }))
    throw new Error(error.detail || 'Error al extraer datos')
  }
  return res.json()
}

/**
 * Genera una URL firmada temporal para mostrar el archivo en el frontend.
 * @param {string} token - JWT del usuario
 * @param {string} storagePath - storage_path del archivo
 * @returns {Promise<string>} URL firmada (válida 1 hora)
 */
export const getPreviewUrl = async (token, storagePath) => {
  const params = new URLSearchParams({ storage_path: storagePath })
  const res = await fetch(`${API_URL}/ingesta/preview?${params}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) throw new Error('Error al generar preview')
  const data = await res.json()
  return data.storage_url
}

/**
 * Cancela una ingesta eliminando el archivo del storage.
 * @param {string} token - JWT del usuario
 * @param {string} storagePath - storage_path del archivo a borrar
 * @returns {Promise<void>}
 */
export const cancelarIngesta = async (token, storagePath) => {
  const res = await fetch(`${API_URL}/ingesta/cancelar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(token) },
    body: JSON.stringify({ storage_path: storagePath }),
  })
  if (!res.ok) throw new Error('Error al cancelar ingesta')
}