import { useMemo } from 'react'
import { Negocio } from '@/types/negocio'

interface SearchBarProps {
  search: string
  onSearchChange: (v: string) => void
  subcategoria: string
  onSubcategoriaChange: (v: string) => void
  negocios: Negocio[]
  totalVisible: number
}

export function SearchBar({
  search,
  onSearchChange,
  subcategoria,
  onSubcategoriaChange,
  negocios,
  totalVisible,
}: SearchBarProps) {
  // Unique subcategories from data, sorted
  const subcategorias = useMemo(() => {
    const set = new Set(negocios.map((n) => n.subcategoria).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [negocios])

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" aria-hidden="true">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z"/>
          </svg>
        </div>
        <input
          id="search-negocios"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar negocio…"
          className="input pl-9 pr-4"
          aria-label="Buscar negocio por nombre"
        />
      </div>

      {/* Subcategory filter */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label htmlFor="filter-subcategoria" className="text-sm text-gray-500 whitespace-nowrap font-medium">
          Rubro:
        </label>
        <select
          id="filter-subcategoria"
          value={subcategoria}
          onChange={(e) => onSubcategoriaChange(e.target.value)}
          className="input flex-1 sm:w-48 cursor-pointer"
          aria-label="Filtrar por subcategoría"
        >
          <option value="">Todos los rubros</option>
          {subcategorias.map((sc) => (
            <option key={sc} value={sc}>{sc}</option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <span className="text-xs text-gray-400 whitespace-nowrap self-center">
        {totalVisible} negocio{totalVisible !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
