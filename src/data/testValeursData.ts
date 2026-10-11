export type ValeurKey =
  | 'liberte' | 'famille' | 'sante' | 'succes' | 'amour'
  | 'connaissance' | 'contribution' | 'creativite' | 'spiritualite'
  | 'independance_financiere' | 'reconnaissance' | 'equilibre'
  | 'respect' | 'aventure' | 'securite'

export interface Valeur {
  key: ValeurKey
  label: string
  color: string
  bg: string
  questions: number[]
}

export const VALEURS: Valeur[] = [
  { key: 'liberte',               label: 'Liberté',                        color: '#7c3aed', bg: '#f5f3ff', questions: [1, 2, 3] },
  { key: 'famille',               label: 'Famille',                        color: '#dc2626', bg: '#fff1f2', questions: [4, 5, 6] },
  { key: 'sante',                 label: 'Santé',                          color: '#16a34a', bg: '#f0fdf4', questions: [7, 8, 9] },
  { key: 'succes',                label: 'Succès',                         color: '#d97706', bg: '#fffbeb', questions: [10, 11, 12] },
  { key: 'amour',                 label: 'Amour',                          color: '#db2777', bg: '#fdf2f8', questions: [13, 14, 15] },
  { key: 'connaissance',          label: 'Connaissance',                   color: '#0284c7', bg: '#f0f9ff', questions: [16, 17, 18] },
  { key: 'contribution',          label: 'Contribution',                   color: '#0891b2', bg: '#ecfeff', questions: [19, 20, 21] },
  { key: 'creativite',            label: 'Créativité',                     color: '#7c3aed', bg: '#faf5ff', questions: [22, 23, 24] },
  { key: 'spiritualite',          label: 'Spiritualité',                   color: '#9333ea', bg: '#fdf4ff', questions: [25, 26, 27] },
  { key: 'independance_financiere', label: 'Indépendance financière',      color: '#15803d', bg: '#f0fdf4', questions: [28, 29, 30] },
  { key: 'reconnaissance',        label: 'Reconnaissance',                 color: '#b45309', bg: '#fef3c7', questions: [31, 32, 33] },
  { key: 'equilibre',             label: 'Équilibre travail / vie privée', color: '#0369a1', bg: '#e0f2fe', questions: [34, 35, 36] },
  { key: 'respect',               label: 'Respect',                        color: '#1d4ed8', bg: '#eff6ff', questions: [37, 38, 39] },
  { key: 'aventure',              label: 'Aventure',                       color: '#ea580c', bg: '#fff7ed', questions: [40, 41, 42] },
  { key: 'securite',              label: 'Sécurité',                       color: '#1D3462', bg: '#f0f4ff', questions: [43, 44, 45] },
]

export const VALEURS_QUESTIONS: { id: number; question: string }[] = [
  { id: 1,  question: "Je veux faire mes propres choix." },
  { id: 2,  question: "Je souhaite être indépendant(e) dans mes actions." },
  { id: 3,  question: "La liberté de pensée est essentielle pour moi." },
  { id: 4,  question: "Passer du temps avec ma famille est ma priorité." },
  { id: 5,  question: "Je veux que ma famille soit au centre de mes décisions." },
  { id: 6,  question: "L'harmonie familiale est cruciale pour mon bien-être." },
  { id: 7,  question: "Maintenir une bonne santé est essentiel." },
  { id: 8,  question: "Je fais attention à mon bien-être physique." },
  { id: 9,  question: "Je cherche à améliorer ma condition mentale." },
  { id: 10, question: "Atteindre mes objectifs est une source de motivation." },
  { id: 11, question: "Je veux réussir dans ma carrière." },
  { id: 12, question: "La réussite financière est un objectif clé." },
  { id: 13, question: "Je veux que mes relations affectives soient harmonieuses." },
  { id: 14, question: "L'amour est une priorité dans ma vie." },
  { id: 15, question: "Je souhaite construire des relations stables." },
  { id: 16, question: "Apprendre continuellement est essentiel pour moi." },
  { id: 17, question: "Je veux élargir mes connaissances." },
  { id: 18, question: "La curiosité intellectuelle me guide." },
  { id: 19, question: "Je veux contribuer positivement à la société." },
  { id: 20, question: "Aider les autres est un objectif important." },
  { id: 21, question: "Je cherche à avoir un impact social positif." },
  { id: 22, question: "La création et l'innovation sont importantes dans ma vie." },
  { id: 23, question: "Je veux pouvoir exprimer ma créativité librement." },
  { id: 24, question: "Je cherche des opportunités pour innover." },
  { id: 25, question: "Ma spiritualité me guide dans mes choix." },
  { id: 26, question: "Je vis en accord avec mes croyances." },
  { id: 27, question: "La méditation ou la prière font partie de mon quotidien." },
  { id: 28, question: "Avoir une stabilité financière est important pour moi." },
  { id: 29, question: "Je veux être financièrement indépendant(e)." },
  { id: 30, question: "L'argent est une source de sécurité." },
  { id: 31, question: "Je veux être reconnu(e) pour mes réalisations." },
  { id: 32, question: "Je recherche la validation sociale." },
  { id: 33, question: "L'opinion des autres sur mes actions compte pour moi." },
  { id: 34, question: "Trouver un équilibre entre vie personnelle et professionnelle est crucial." },
  { id: 35, question: "Je souhaite gérer mon temps efficacement." },
  { id: 36, question: "Je veux éviter le stress au travail." },
  { id: 37, question: "Je souhaite être respecté(e) par mes pairs." },
  { id: 38, question: "Je traite les autres avec respect." },
  { id: 39, question: "Le respect est un pilier de mes valeurs." },
  { id: 40, question: "J'aime vivre des expériences nouvelles." },
  { id: 41, question: "Je cherche à sortir de ma zone de confort." },
  { id: 42, question: "L'aventure est une source d'épanouissement pour moi." },
  { id: 43, question: "Je cherche à garantir la sécurité de ma famille." },
  { id: 44, question: "Je veux une stabilité émotionnelle et matérielle." },
  { id: 45, question: "La sécurité est essentielle pour mon bien-être." },
]

export const VALEURS_SCALE = [
  { value: 1, label: 'Pas important' },
  { value: 2, label: 'Peu important' },
  { value: 3, label: 'Modérément important' },
  { value: 4, label: 'Important' },
  { value: 5, label: 'Très important' },
]

export function getValeurScore(key: ValeurKey, answers: Record<number, number>): number {
  const v = VALEURS.find(v => v.key === key)
  if (!v) return 0
  return v.questions.reduce((sum, qId) => sum + (answers[qId] || 0), 0)
}

export function getAllValeurScores(answers: Record<number, number>): Record<ValeurKey, number> {
  const result = {} as Record<ValeurKey, number>
  VALEURS.forEach(v => { result[v.key] = getValeurScore(v.key, answers) })
  return result
}

export function getTopValeurs(answers: Record<number, number>, n = 5): Valeur[] {
  const scores = getAllValeurScores(answers)
  return [...VALEURS]
    .sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))
    .slice(0, n)
}
