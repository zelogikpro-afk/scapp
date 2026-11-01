const pdf = require('pdf-parse')
const fs = require('fs')

const data = fs.readFileSync('C:/Users/Zineb Eddaqaqi/Downloads/DIPLOMES.pdf')
pdf(data).then(result => {
  console.log('Total pages:', result.numpages)
  // Save full text to file for analysis
  fs.writeFileSync('C:/Users/Zineb Eddaqaqi/Downloads/diplomes_text.txt', result.text, 'utf-8')
  console.log('Text saved to diplomes_text.txt')
  console.log('Text length:', result.text.length)
  // Show first 3000 chars
  console.log('=== SAMPLE ===')
  console.log(result.text.slice(0, 3000))
}).catch(e => console.error('Error:', e.message))
