import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Negocio } from '@/types/negocio'

interface UseNegociosResult {
  negocios: Negocio[]
  loading: boolean
  error: string | null
}

export function useNegocios(): UseNegociosResult {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'negocios'), orderBy('nombre'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Negocio[]
        setNegocios(data)
        setLoading(false)
      },
      (err) => {
        console.error('Firestore snapshot error:', err)
        setError('Error al cargar los negocios. Verifica tu conexión.')
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  return { negocios, loading, error }
}
