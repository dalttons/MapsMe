import { Timestamp } from 'firebase/firestore'

export type EstadoSeguimiento = 'Por contactar' | 'En negociación' | 'Descartado'

export type CategoriaFuncional =
  | 'Retail con Pedido Ágil'
  | 'Servicios / Pre-agendamiento'
  | 'Gastronomía'
  | 'Adquisición / Prospectos'
  | 'Corporativo / B2B'

export const CATEGORIAS_ORDEN: CategoriaFuncional[] = [
  'Retail con Pedido Ágil',
  'Servicios / Pre-agendamiento',
  'Gastronomía',
  'Adquisición / Prospectos',
  'Corporativo / B2B',
]

export const ESTADOS_SEGUIMIENTO: EstadoSeguimiento[] = [
  'Por contactar',
  'En negociación',
  'Descartado',
]

export interface Visita {
  fecha: Timestamp
  nota: string
}

export interface Negocio {
  id: string
  nombre: string
  categoriaFuncional: CategoriaFuncional
  subcategoria: string
  direccion: string
  linkMaps: string
  telefono: string | null
  estadoWeb: string
  estadoSeguimiento: EstadoSeguimiento
  propuestaTecnica: string
  visitas: Visita[]
}
