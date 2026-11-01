import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://twcqvpgpzayjxiwzzesb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'
)

// List all files in ressources/n2/ to get exact paths
const { data: files } = await sb.storage.from('elearning').list('ressources/n2', { limit: 100 })
console.log(`Found ${files?.length} files in ressources/n2`)

const BASE = 'https://twcqvpgpzayjxiwzzesb.supabase.co/storage/v1/object/public/elearning/ressources/n2/'

for (let i = 0; i < files.length; i++) {
  const f = files[i]
  const title = f.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ')
  const url = BASE + encodeURIComponent(f.name)
  const { error } = await sb.from('elearning_docs').insert({
    title,
    file_url: url,
    level: 'N2',
    is_visible: true,
    order_index: i + 1,
  })
  if (error) console.error(`❌ ${f.name}: ${error.message}`)
  else console.log(`✅ [${i+1}/${files.length}] ${title}`)
}

console.log('\n✅ Terminé — N2 docs insérés (1 fois, niveau N2)')
