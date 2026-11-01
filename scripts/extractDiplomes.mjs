import { readFileSync } from 'fs'

// Use pdf-parse
const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js')

const data = readFileSync('C:/Users/Zineb Eddaqaqi/Downloads/DIPLOMES.pdf')
const result = await pdf(data, { max: 8 })

console.log('Total pages:', result.numpages)
console.log('=== TEXT SAMPLE (first 6000 chars) ===')
console.log(result.text.slice(0, 6000))
