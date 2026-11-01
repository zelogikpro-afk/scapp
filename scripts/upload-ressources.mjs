import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, basename, extname } from 'path'

const sb = createClient(
  'https://twcqvpgpzayjxiwzzesb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'
)

const N1_DIR = 'C:/Users/Zineb Eddaqaqi/Downloads/Coach de vie niveau 1'
const N2_DIR = 'C:/Users/Zineb Eddaqaqi/Downloads/MALETTE SCA Master Coach thérapeute'

function mimeType(file) {
  const ext = extname(file).toLowerCase()
  if (ext === '.pdf') return 'application/pdf'
  if (ext === '.mp4') return 'video/mp4'
  return 'application/octet-stream'
}

function sanitize(filename) {
  return filename
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9._\-() ]/g, '_')             // replace special chars
    .replace(/\s+/g, '_')                              // spaces to underscores
    .replace(/__+/g, '_')                              // collapse multiple _
}

function storagePath(folder, filename) {
  return `ressources/${folder}/${sanitize(filename)}`
}

async function uploadFile(localPath, storagePth, mime) {
  const file = readFileSync(localPath)
  const { error } = await sb.storage.from('elearning').upload(storagePth, file, {
    contentType: mime,
    upsert: true,
  })
  if (error) throw new Error(`Upload failed ${storagePth}: ${error.message}`)
  const { data } = sb.storage.from('elearning').getPublicUrl(storagePth)
  return data.publicUrl
}

async function insertDoc({ title, fileUrl, level, orderIndex }) {
  const { error } = await sb.from('elearning_docs').insert({
    title,
    file_url: fileUrl,
    level,
    is_visible: true,
    order_index: orderIndex,
  })
  if (error && !error.message.includes('duplicate')) throw new Error(`Insert failed ${title} [${level}]: ${error.message}`)
}

// Delete existing ressources entries to avoid duplicates
async function cleanOldEntries() {
  await sb.from('elearning_docs').delete().like('file_url', '%ressources%')
}

async function run() {
  console.log('🧹 Nettoyage anciens enregistrements ressources...')
  await cleanOldEntries()

  // ---- COACH DE VIE N1 (visible N1, N2, N3) ----
  const n1Files = readdirSync(N1_DIR).filter(f => f !== 'desktop.ini')
  console.log(`\n📁 Coach de vie niveau 1 (${n1Files.length} fichiers) → N1, N2, N3`)

  const n1Docs = []
  for (let i = 0; i < n1Files.length; i++) {
    const filename = n1Files[i]
    const localPath = join(N1_DIR, filename)
    const spath = storagePath('n1', filename)
    const mime = mimeType(filename)
    process.stdout.write(`  Uploading [${i+1}/${n1Files.length}] ${filename}...`)
    const url = await uploadFile(localPath, spath, mime)
    console.log(' ✅')
    n1Docs.push({ title: basename(filename, extname(filename)), url, mime, order: i + 1 })
  }

  for (const doc of n1Docs) {
    for (const level of ['N1', 'N2', 'N3']) {
      await insertDoc({ title: doc.title, fileUrl: doc.url, level, orderIndex: doc.order })
    }
  }
  console.log(`  ✅ ${n1Docs.length} docs insérés pour N1, N2, N3`)

  // ---- MALETTE MASTER COACH (visible N2, N3 seulement) ----
  const n2Files = readdirSync(N2_DIR).filter(f => f !== 'desktop.ini' && f !== 'REC livres' && !f.endsWith('.mp4'))
  console.log(`\n📁 Malette Master Coach Thérapeute (${n2Files.length} fichiers) → N2, N3`)

  const n2Docs = []
  for (let i = 0; i < n2Files.length; i++) {
    const filename = n2Files[i]
    const localPath = join(N2_DIR, filename)
    const spath = storagePath('n2', filename)
    const mime = mimeType(filename)
    process.stdout.write(`  Uploading [${i+1}/${n2Files.length}] ${filename}...`)
    const url = await uploadFile(localPath, spath, mime)
    console.log(' ✅')
    n2Docs.push({ title: basename(filename, extname(filename)), url, mime, order: i + 1 })
  }

  for (const doc of n2Docs) {
    for (const level of ['N2', 'N3']) {
      await insertDoc({ title: doc.title, fileUrl: doc.url, level, orderIndex: doc.order })
    }
  }
  console.log(`  ✅ ${n2Docs.length} docs insérés pour N2, N3`)

  console.log('\n🎉 Terminé !')
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
