import { useState, ReactNode } from 'react'
import { CategoriaFuncional } from '@/types/negocio'
import { NegocioCard } from './NegocioCard'
import { Negocio } from '@/types/negocio'

// Category accent colors (brand/category, NOT status colors)
const CATEGORIA_STYLES: Record<CategoriaFuncional, { bg: string; text: string; border: string; icon: string }> = {
  'Retail con Pedido Ágil': {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: '🛒',
  },
  'Servicios / Pre-agendamiento': {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: '📅',
  },
  'Gastronomía': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: '🍽️',
  },
  'Adquisición / Prospectos': {
    bg: 'bg-violet-50',
    text: 'text-violet-800',
    border: 'border-violet-200',
    icon: '🎯',
  },
  'Corporativo / B2B': {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
    icon: '🏢',
  },
}

interface CategorySectionProps {
  categoria: CategoriaFuncional
  negocios: Negocio[]
  defaultOpen?: boolean
  children?: ReactNode
}

export function CategorySection({
  categoria,
  negocios,
  defaultOpen = true,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const style = CATEGORIA_STYLES[categoria]
  const count = negocios.length

  if (count === 0) return null

  return (
    <section
      aria-label={`Sección: ${categoria}`}
      className="mb-4"
    >
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`section-header ${style.bg} ${style.text} border ${style.border} w-full`}
        aria-expanded={open}
        id={`section-${categoria.replace(/[\s/]+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none flex-shrink-0" aria-hidden="true">
            {style.icon}
          </span>
          <span className="font-semibold text-sm truncate">{categoria}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold border ${style.border} ${style.bg} ${style.text}`}
            aria-label={`${count} negocios`}
          >
            {count}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {/* Cards grid */}
      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 animate-fade-in">
          {negocios.map((negocio) => (
            <NegocioCard key={negocio.id} negocio={negocio} />
          ))}
        </div>
      )}
    </section>
  )
}
