import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://twcqvpgpzayjxiwzzesb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3Y3F2cGdwemF5anhpd3p6ZXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI3MjQ1NiwiZXhwIjoyMDk2ODQ4NDU2fQ.zwln8YTyONVLwGjVQl9P0Of-u83WiF6U6rsvV98mO3E'
)

const mct = [
  '64080e87-089f-4518-9060-5932de675d7a', // NAOUAL CHERKAOUI
  '87abe7e6-3492-46cd-b202-01940030cae3', // ABDERRAHIM MOUTANA
  '45d2e17b-d983-4667-a727-bcb23d635527', // KHALID BARGACH
  'ef76b9db-bae4-42a3-8288-feb275ebbafc', // Oumaima El Bouchtaoui
  'c0a0bfaf-56a6-4074-9313-24d2f5a4a87d', // WIDAD TERRAFI
  '46702a27-381a-4234-906f-30c96ea61192', // Naoual Hourri
  'ac1c72bb-281d-4b56-ae95-8d343dc7b7a7', // AMAL ABDOU
  '872c21a2-d0f1-48aa-aff0-a0848ae3c657', // Aicha Agnaou
  '488b24b1-f7c5-4d76-bc45-7be1b5b3b6ef', // Khadija Talbi
  '62fb7d11-d326-4de7-889f-b10bf1f179aa', // Intissar Lahsaini
  'ea728555-f0ae-4d05-84be-aacb8900c404', // Meryam Aator
  'cabfc193-79f7-4851-8df5-7861334dd37c', // Fatima-ezzahra El Khalfi
]

const cvd = [
  'bb95013b-f13a-4059-874b-0dbdc62d7bf0', // Hind Kamil
  'e1922bec-3cbb-4193-97ac-082b32f01898', // Bouchra Oumhamed
  '357f3750-5d49-4408-b07b-d652b08d185c', // Jessica Rodrigues Pavao
  '32049f4f-fe66-4366-94bb-c4497eaaf1ce', // Oumaima Tatlalou
  '80113540-0ec5-4967-8b8c-1e3398075518', // Hanane El Hadri
  'c0997187-d0e0-4a2b-9758-8141dcb464ca', // Raji Nora
  'df975a7e-ddf6-4ec8-b0ea-0bce9236e831', // NAJAT HAIDOURI
  '7cb339dc-ed7a-41b1-948a-82221201cd47', // Najat Ghazi Jerniti
]

const { error: e1 } = await supabase.from('participants').update({ promotion_id: 'c4' }).in('id', mct)
if (e1) console.error('MCT error:', e1.message)
else console.log(`✓ MCT (c4): ${mct.length} participants mis à jour`)

const { error: e2 } = await supabase.from('participants').update({ promotion_id: 'c5' }).in('id', cvd)
if (e2) console.error('CVD error:', e2.message)
else console.log(`✓ CVD (c5): ${cvd.length} participants mis à jour`)
