import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNegocios } from '@/hooks/useNegocios'
import { LoginPage } from '@/components/LoginPage'
import { SearchBar } from '@/components/SearchBar'
import { CategorySection } from '@/components/CategorySection'
import { ExportButton } from '@/components/ExportButton'
import { CATEGORIAS_ORDEN, CategoriaFuncional, Negocio } from '@/types/negocio'

function AppHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-peach to-brand-peach-dark rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>
            </svg>
          </div>
          <span className="font-bold text-brand-dark text-base tracking-tight">MapsMe</span>
          <span className="hidden sm:inline text-xs text-gray-400 font-medium">· Tumbes</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ExportButton />
          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 font-medium
                       rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Cerrar sesión"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function MainView() {
  const { logout } = useAuth()
  const { negocios, loading, error } = useNegocios()
  const [search, setSearch] = useState('')
  const [subcategoria, setSubcategoria] = useState('')

  // Filter & group
  const grouped = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    const filtered = negocios.filter((n: Negocio) => {
      const matchSearch = !searchLower || n.nombre.toLowerCase().includes(searchLower)
      const matchSub = !subcategoria || n.subcategoria === subcategoria
      return matchSearch && matchSub
    })

    const byCategoria: Record<CategoriaFuncional, Negocio[]> = {
      'Retail con Pedido Ágil': [],
      'Servicios / Pre-agendamiento': [],
      'Gastronomía': [],
      'Adquisición / Prospectos': [],
      'Corporativo / B2B': [],
    }

    for (const n of filtered) {
      if (byCategoria[n.categoriaFuncional]) {
        byCategoria[n.categoriaFuncional].push(n)
      }
    }

    return byCategoria
  }, [negocios, search, subcategoria])

  const totalVisible = useMemo(
    () => Object.values(grouped).reduce((acc, arr) => acc + arr.length, 0),
    [grouped]
  )

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onLogout={logout} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Search + filters */}
        <div className="mb-6">
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            subcategoria={subcategoria}
            onSubcategoriaChange={setSubcategoria}
            negocios={negocios}
            totalVisible={totalVisible}
          />
        </div>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3" role="status" aria-live="polite">
            <svg className="animate-spin w-8 h-8 text-brand-peach" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <p className="text-sm text-gray-500">Cargando negocios…</p>
          </div>
        )}

        {error && !loading && (
          <div role="alert" className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-lg mx-auto">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {totalVisible === 0 && (search || subcategoria) ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2 text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z"/>
                </svg>
                <p className="text-sm font-medium">Sin resultados para tu búsqueda</p>
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSubcategoria('') }}
                  className="text-sm text-brand-peach hover:underline mt-1"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {CATEGORIAS_ORDEN.map((categoria) => (
                  <CategorySection
                    key={categoria}
                    categoria={categoria}
                    negocios={grouped[categoria]}
                    defaultOpen={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        MapsMe · Seguimiento comercial Tumbes · {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite">
        <svg className="animate-spin w-8 h-8 text-brand-peach" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    )
  }

  return user ? <MainView /> : <LoginPage />
}
