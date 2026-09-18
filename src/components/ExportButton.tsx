import { useState } from 'react'
import { useNegocioActions } from '@/hooks/useNegocioActions'

export function ExportButton() {
  const { exportarJSON } = useNegocioActions()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      await exportarJSON()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      id="export-json-btn"
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700
                 text-sm font-medium rounded-lg hover:border-brand-teal hover:text-brand-teal
                 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-1"
      aria-label="Exportar todos los negocios como JSON"
      title="Exportar backup JSON"
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
      )}
      {loading ? 'Exportando…' : 'Exportar JSON'}
    </button>
  )
}
