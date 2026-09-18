import { useState, FormEvent } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Negocio, EstadoSeguimiento, Visita } from '@/types/negocio'
import { useNegocioActions } from '@/hooks/useNegocioActions'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if telefono is a valid Peruvian mobile: 9 digits, starts with 9 */
function isValidPeruvianMobile(telefono: string | null): boolean {
  if (!telefono) return false
  const cleaned = telefono.replace(/[\s\-\(\)\+]/g, '')
  const local =
    cleaned.startsWith('51') && cleaned.length === 11
      ? cleaned.slice(2)
      : cleaned
  return /^9\d{8}$/.test(local)
}

/** Build a safe WhatsApp URL from a validated Peruvian phone */
function buildWhatsAppUrl(telefono: string): string {
  const cleaned = telefono.replace(/[\s\-\(\)\+]/g, '')
  const local =
    cleaned.startsWith('51') && cleaned.length === 11
      ? cleaned.slice(2)
      : cleaned
  return `https://wa.me/51${encodeURIComponent(local)}`
}

// ── Estado selector config ────────────────────────────────────────────────────

interface EstadoConfig {
  label: EstadoSeguimiento
  activeClass: string
  inactiveClass: string
}

const ESTADO_CONFIGS: EstadoConfig[] = [
  {
    label: 'Por contactar',
    activeClass: 'bg-blue-700 text-white border-blue-700',
    inactiveClass: 'bg-white text-blue-700 border-blue-300 hover:border-blue-500',
  },
  {
    label: 'En negociación',
    activeClass: 'bg-amber-700 text-white border-amber-700',
    inactiveClass: 'bg-white text-amber-700 border-amber-300 hover:border-amber-500',
  },
  {
    label: 'Descartado',
    activeClass: 'bg-gray-600 text-white border-gray-600',
    inactiveClass: 'bg-white text-gray-500 border-gray-300 hover:border-gray-400',
  },
]

// ── Visitas Section ───────────────────────────────────────────────────────────

interface VisitasSectionProps {
  negocioId: string
  visitas: Visita[]
  onAddVisita: (id: string, nota: string) => Promise<void>
}

function VisitasSection({ negocioId, visitas, onAddVisita }: VisitasSectionProps) {
  const [open, setOpen] = useState(false)
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  const sorted = [...visitas].sort((a, b) => {
    const aTime = a.fecha instanceof Timestamp ? a.fecha.toMillis() : 0
    const bTime = b.fecha instanceof Timestamp ? b.fecha.toMillis() : 0
    return bTime - aTime
  })

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!nota.trim()) return
    setSaving(true)
    try {
      await onAddVisita(negocioId, nota)
      setNota('')
    } finally {
      setSaving(false)
    }
  }

  const formatFecha = (ts: Timestamp | unknown): string => {
    try {
      const date =
        ts instanceof Timestamp ? ts.toDate() : new Date(ts as string)
      return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-medium text-brand-teal hover:text-brand-teal-dark transition-colors"
        aria-expanded={open}
        id={`visitas-toggle-${negocioId}`}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Historial de visitas
        {visitas.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 bg-brand-teal/10 text-brand-teal text-xs font-bold rounded-full">
            {visitas.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* Add nota form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nueva nota de visita…"
              className="input flex-1 text-sm py-1.5"
              maxLength={500}
              disabled={saving}
              id={`nota-input-${negocioId}`}
              aria-label="Nueva nota de visita"
            />
            <button
              type="submit"
              disabled={!nota.trim() || saving}
              className="px-3 py-1.5 bg-brand-teal text-white text-sm font-semibold rounded-lg
                         hover:bg-brand-teal-dark transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed focus:outline-none focus:ring-2
                         focus:ring-brand-teal focus:ring-offset-1"
              aria-label="Agregar nota de visita"
            >
              {saving ? '…' : 'Agregar'}
            </button>
          </form>

          {/* Visitas list */}
          {sorted.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Sin visitas registradas.</p>
          ) : (
            <ul
              className="space-y-2"
              role="list"
              aria-label="Historial de visitas"
            >
              {sorted.map((v, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm bg-gray-50 rounded-lg p-2.5"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-1.5"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-800 break-words">{v.nota}</p>
                    <time className="text-xs text-gray-400 mt-0.5 block">
                      {formatFecha(v.fecha)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main NegocioCard ──────────────────────────────────────────────────────────

interface NegocioCardProps {
  negocio: Negocio
}

export function NegocioCard({ negocio }: NegocioCardProps) {
  const { updateEstado, addVisita, saving } = useNegocioActions()
  const isSaving = saving[negocio.id] ?? false

  const hasWhatsApp = isValidPeruvianMobile(negocio.telefono)
  const hasMapLink = Boolean(negocio.linkMaps?.trim())

  const handleEstado = async (estado: EstadoSeguimiento) => {
    if (estado === negocio.estadoSeguimiento) return
    await updateEstado(negocio.id, estado)
  }

  return (
    <article
      className="card p-4 animate-fade-in"
      aria-label={`Negocio: ${negocio.nombre}`}
    >
      {/* Header: nombre + subcategoria badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-base text-gray-900 leading-tight">
          {negocio.nombre}
        </h3>
        <span className="text-xs text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 flex-shrink-0">
          {negocio.subcategoria}
        </span>
      </div>

      {/* estadoWeb — read-only reference */}
      {negocio.estadoWeb && (
        <div className="mb-2">
          <span className="text-xs text-gray-400 font-medium">Web: </span>
          <span className="text-xs text-gray-500">{negocio.estadoWeb}</span>
        </div>
      )}

      {/* Dirección */}
      {negocio.direccion && (
        <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-3">
          <svg
            className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {negocio.direccion}
        </p>
      )}

      {/* propuestaTecnica */}
      {negocio.propuestaTecnica && (
        <div className="mb-3 p-2.5 bg-gradient-to-r from-brand-peach/5 to-brand-teal/5 rounded-lg border border-brand-peach/10">
          <p className="text-xs font-medium text-brand-dark mb-0.5">
            Propuesta técnica
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {negocio.propuestaTecnica}
          </p>
        </div>
      )}

      {/* Action buttons: Maps + WhatsApp */}
      {(hasMapLink || hasWhatsApp) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {hasMapLink && (
            <a
              href={negocio.linkMaps}
              target="_blank"
              rel="noopener noreferrer"
              id={`maps-${negocio.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                         text-gray-700 text-xs font-medium rounded-lg hover:border-brand-peach
                         hover:text-brand-peach transition-all duration-150 focus:outline-none
                         focus:ring-2 focus:ring-brand-peach focus:ring-offset-1"
              aria-label={`Abrir en Google Maps: ${negocio.nombre}`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
              📍 Maps
            </a>
          )}
          {hasWhatsApp && (
            <a
              href={buildWhatsAppUrl(negocio.telefono!)}
              target="_blank"
              rel="noopener noreferrer"
              id={`wa-${negocio.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                         text-gray-700 text-xs font-medium rounded-lg hover:border-green-500
                         hover:text-green-700 transition-all duration-150 focus:outline-none
                         focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              aria-label={`WhatsApp: ${negocio.nombre}`}
            >
              <svg
                className="w-3.5 h-3.5 text-green-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.898.53 3.671 1.449 5.18L2.05 22l4.98-1.376A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm.001 18a7.96 7.96 0 0 1-4.09-1.129l-.293-.174-3.037.838.823-3.02-.19-.31A7.956 7.956 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
              </svg>
              💬 WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Estado seguimiento selector */}
      <div className="mb-1">
        <p className="text-xs font-medium text-gray-500 mb-1.5">
          Estado seguimiento
        </p>
        <div
          className="flex gap-1.5"
          role="group"
          aria-label="Estado de seguimiento"
        >
          {ESTADO_CONFIGS.map((cfg) => {
            const isActive = negocio.estadoSeguimiento === cfg.label
            return (
              <button
                key={cfg.label}
                type="button"
                onClick={() => handleEstado(cfg.label)}
                disabled={isSaving}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-md border-2 transition-all duration-150
                             cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed
                             focus:outline-none focus:ring-2 focus:ring-offset-1
                             ${isActive ? cfg.activeClass : cfg.inactiveClass}`}
                aria-pressed={isActive}
                id={`estado-${cfg.label.replace(/[\s/]+/g, '-').toLowerCase()}-${negocio.id}`}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Visitas */}
      <VisitasSection
        negocioId={negocio.id}
        visitas={negocio.visitas ?? []}
        onAddVisita={addVisita}
      />
    </article>
  )
}
