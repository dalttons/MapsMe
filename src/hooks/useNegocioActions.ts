import { useState } from 'react'
import {
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { EstadoSeguimiento, Negocio } from '@/types/negocio'

export function useNegocioActions() {
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const updateEstado = async (id: string, estado: EstadoSeguimiento) => {
    setSaving((prev) => ({ ...prev, [id]: true }))
    try {
      await updateDoc(doc(db, 'negocios', id), { estadoSeguimiento: estado })
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }))
    }
  }

  const addVisita = async (id: string, nota: string) => {
    if (!nota.trim()) return
    const visita = {
      fecha: Timestamp.now(),
      nota: nota.trim(),
    }
    await updateDoc(doc(db, 'negocios', id), {
      visitas: arrayUnion(visita),
    })
  }

  const exportarJSON = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'negocios'))
      const data: Negocio[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Negocio[]

      // Convert Timestamps to ISO strings for JSON portability
      const serializable = data.map((n) => ({
        ...n,
        visitas: n.visitas.map((v) => ({
          fecha: v.fecha instanceof Timestamp
            ? v.fecha.toDate().toISOString()
            : v.fecha,
          nota: v.nota,
        })),
      }))

      const blob = new Blob([JSON.stringify(serializable, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mapsme-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando JSON:', err)
      alert('Error al exportar. Verifica tu conexión.')
    }
  }

  return { updateEstado, addVisita, exportarJSON, saving }
}
