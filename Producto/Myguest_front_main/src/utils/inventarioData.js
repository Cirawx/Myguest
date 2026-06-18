export const UNIDADES = [
  { cod: 1, nom: 'Kilogramos', abrev: 'Kg.' },
  { cod: 2, nom: 'Gramos', abrev: 'gr.' },
  { cod: 3, nom: 'Litros', abrev: 'lt.' },
  { cod: 4, nom: 'Mililitros', abrev: 'ml.' },
  { cod: 5, nom: 'Unidades', abrev: 'unid' },
  { cod: 6, nom: 'Metros', abrev: 'mt.' },
]

export const CATEGORIAS = [
  { cod: 0, nom: '(Sin categoría)' },
  { cod: 1, nom: 'Frutas y verduras' },
  { cod: 2, nom: 'Carnes, cecinas y embutidos' },
  { cod: 3, nom: 'Mariscos y pescados' },
  { cod: 4, nom: 'Congelados' },
  { cod: 5, nom: 'Ovo lácteos' },
  { cod: 6, nom: 'Abarrotes' },
  { cod: 7, nom: 'Vinos, licores y bebidas' },
  { cod: 8, nom: 'No alimenticios' },
  { cod: 9, nom: 'Artículos de aseo' },
  { cod: 10, nom: 'Equipos y otros' },
]

export const getNombreUnidad = (cod) => {
  const u = UNIDADES.find(u => u.cod === cod)
  return u ? u.abrev : `Unid. ${cod}`
}

export const getNombreCategoria = (cod) => {
  const c = CATEGORIAS.find(c => c.cod === cod)
  return c ? c.nom : `Cat. ${cod}`
}