/**
 * MapsMe — Script de Importación Idempotente
 * ==========================================
 * Lee Mapeo_de_Negocios_Tumbes.xlsx y sincroniza con Firestore.
 *
 * Uso:
 *   npm run import
 *   (o directamente: npx tsx scripts/import.ts)
 *
 * Requiere .env.local con:
 *   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
 *   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
 *   VITE_IMPORT_EMAIL, VITE_IMPORT_PASSWORD
 *
 * Idempotencia:
 *   - Doc EXISTENTE → actualiza solo campos maestros (NO toca estadoSeguimiento ni visitas)
 *   - Doc NUEVO     → crea completo con estadoSeguimiento="Por contactar", visitas=[]
 */

//  Usa createRequire para cargar el módulo CommonJS sin conflictos de interop:
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import path from 'node:path'
import fs from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth'

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.error(`❌  No se encontró ${filePath}. Copia .env.example → .env.local y completa los valores.`)
    process.exit(1)
  }
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key) process.env[key] = value
  }
}

loadEnv(path.resolve(process.cwd(), '.env.local'))

// ── Constants ────────────────────────────────────────────────────────────────
const XLSX_PATH = path.resolve(process.cwd(), 'Mapeo_de_Negocios_Tumbes.xlsx')

const VALID_CATEGORIAS = new Set([
  'Retail con Pedido Ágil',
  'Servicios / Pre-agendamiento',
  'Gastronomía',
  'Adquisición / Prospectos',
  'Corporativo / B2B',
])

// Columnas del Excel (nombres exactos de encabezado)
const COL = {
  categoriaFuncional: 'Categoría Funcional',
  subcategoria: 'Subcategoría',
  nombre: 'Nombre del Negocio',
  linkMaps: 'Link de Google Maps',
  direccion: 'Dirección',
  telefono: 'Teléfono',
  estadoWeb: 'Estado Web',
  propuestaTecnica: 'Ángulo de Propuesta / Solución Técnica',
} as const

// ── Slug determinístico ───────────────────────────────────────────────────────
function toSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, '')    // remove special chars
    .trim()
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .slice(0, 100)                   // max length
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🗂️  MapsMe — Importación de negocios\n')

  // 1. Verify Excel exists
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌  No se encontró el archivo Excel en:\n    ${XLSX_PATH}`)
    process.exit(1)
  }

  // 2. Read Excel
  console.log(`📄  Leyendo: ${XLSX_PATH}`)
  const workbook = XLSX.readFile(XLSX_PATH)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  })
  console.log(`    ${rows.length} filas encontradas en hoja "${sheetName}"\n`)

  // 3. Initialize Firebase
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  }

  const missingVars = Object.entries(firebaseConfig)
    .filter(([, v]) => !v || v.startsWith('TU_'))
    .map(([k]) => k)

  if (missingVars.length > 0) {
    console.error('❌  Variables de entorno Firebase no configuradas:')
    missingVars.forEach((v) => console.error(`    • ${v}`))
    console.error('\n    Edita .env.local con los valores reales de tu proyecto Firebase.')
    process.exit(1)
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  // 4. Auth
  const email = process.env.VITE_IMPORT_EMAIL ?? ''
  const password = process.env.VITE_IMPORT_PASSWORD ?? ''

  if (!email || !password || email === 'tu@email.com') {
    console.error('❌  VITE_IMPORT_EMAIL / VITE_IMPORT_PASSWORD no configurados en .env.local')
    process.exit(1)
  }

  console.log(`🔐  Autenticando como ${email}…`)
  try {
    await signInWithEmailAndPassword(auth, email, password)
    console.log('    ✅  Autenticado correctamente\n')
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    console.error(`❌  Error de autenticación (${e.code ?? 'unknown'}): ${e.message}`)
    process.exit(1)
  }

  // 5. Process rows
  let created = 0
  let updated = 0
  let skippedCategory = 0
  let skippedEmpty = 0
  const categoryWarnings: string[] = []

  for (const row of rows) {
    const getString = (col: string): string =>
      String(row[col] ?? '').trim()

    const nombreRaw = getString(COL.nombre)
    if (!nombreRaw) {
      skippedEmpty++
      continue
    }

    const id = toSlug(nombreRaw)
    if (!id) {
      console.warn(`⚠️   Slug vacío para nombre: "${nombreRaw}" — omitido`)
      skippedEmpty++
      continue
    }

    // Validate categoriaFuncional
    let categoriaRaw = getString(COL.categoriaFuncional)
    if (categoriaRaw === 'Gastronomía (Menú Interactivo)') {
      categoriaRaw = 'Gastronomía'
    }

    if (!VALID_CATEGORIAS.has(categoriaRaw)) {
      const warning = `  • "${nombreRaw}" → categoría no reconocida: "${categoriaRaw}"`
      categoryWarnings.push(warning)
      skippedCategory++
      continue
    }

    // Master data fields (never touch estadoSeguimiento or visitas on existing docs)
    const masterData = {
      nombre: nombreRaw,
      categoriaFuncional: categoriaRaw,
      subcategoria: getString(COL.subcategoria),
      direccion: getString(COL.direccion),
      linkMaps: getString(COL.linkMaps),
      telefono: getString(COL.telefono) || null,
      estadoWeb: getString(COL.estadoWeb),
      propuestaTecnica: getString(COL.propuestaTecnica),
    }

    const docRef = doc(db, 'negocios', id)
    const existing = await getDoc(docRef)

    if (existing.exists()) {
      // UPDATE: only master fields
      await updateDoc(docRef, masterData)
      updated++
      console.log(`  🔄  Actualizado: ${nombreRaw}`)
    } else {
      // CREATE: full document
      await setDoc(docRef, {
        id,
        ...masterData,
        estadoSeguimiento: 'Por contactar',
        visitas: [],
      })
      created++
      console.log(`  ✅  Creado: ${nombreRaw}`)
    }
  }

  // 6. Summary
  console.log('\n' + '─'.repeat(50))
  console.log('📊  Resumen de importación:')
  console.log(`    ✅  Creados:          ${created}`)
  console.log(`    🔄  Actualizados:     ${updated}`)
  console.log(`    ⏭️   Sin nombre:       ${skippedEmpty}`)
  console.log(`    ⚠️   Cat. no reconocida: ${skippedCategory}`)

  if (categoryWarnings.length > 0) {
    console.log('\n⚠️  Negocios con categoría no reconocida (revisar manualmente):')
    categoryWarnings.forEach((w) => console.log(w))
  }

  console.log('\n✅  Importación completada.')
  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌  Error inesperado:', err)
  process.exit(1)
})
