// Definición de permisos por rol (cod_perfil)
// 0 = Administrador TI
// 2 = Profesor / Docente

export const PERMISOS = {
  0: { // Administrador
    dashboard:    { ver: true, crear: true, editar: true, eliminar: true },
    usuarios:     { ver: true, crear: true, editar: true, eliminar: true },
    inventario:   { ver: true, crear: true, editar: true, eliminar: true },
    proveedores:  { ver: true, crear: true, editar: true, eliminar: true },
    academico:    { ver: true, crear: true, editar: true, eliminar: true },
    compras:      { ver: true, crear: true, editar: true, eliminar: true },
    facturacion:  { ver: true, crear: true, editar: true, eliminar: true },
    mermas:       { ver: true, crear: true, editar: true, eliminar: true },
    devoluciones: { ver: true, crear: true, editar: true, eliminar: true },
    reportes:     { ver: true, crear: true, editar: true, eliminar: true },
    recetario:    { ver: true, crear: true, editar: true, eliminar: true },
  },
  2: { // Profesor / Docente
    dashboard:    { ver: true,  crear: false, editar: false, eliminar: false },
    usuarios:     { ver: false, crear: false, editar: false, eliminar: false },
    inventario:   { ver: true,  crear: false, editar: false, eliminar: false },
    proveedores:  { ver: false, crear: false, editar: false, eliminar: false },
    academico:    { ver: false, crear: false, editar: false, eliminar: false },
    compras:      { ver: false, crear: false, editar: false, eliminar: false },
    facturacion:  { ver: false, crear: false, editar: false, eliminar: false },
    mermas:       { ver: true,  crear: true,  editar: false, eliminar: false },
    devoluciones: { ver: false, crear: false, editar: false, eliminar: false },
    reportes:     { ver: true,  crear: false, editar: false, eliminar: false },
    recetario:    { ver: true,  crear: true,  editar: true,  eliminar: false },
  },
}

export const tienePermiso = (cod_perfil, modulo, accion) => {
  return PERMISOS[cod_perfil]?.[modulo]?.[accion] ?? false
}