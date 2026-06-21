export type QSPilier =
  | 'ie' | 'communication' | 'strategie' | 'discipline'
  | 'branding' | 'temps' | 'stress' | 'leadership'
  | 'creativite' | 'vision' | 'risque' | 'autonomie' | 'ethique'

export interface QSQuestion {
  id: number
  pilier: QSPilier
  text: string
}

export interface QSPilierInfo {
  key: QSPilier
  label: string
  maxScore: number
  forceTitle: string
  forceDesc: string
  axeTitle: string
  axeDesc: string
}

export interface QSGlobalContent {
  level: string
  para1: string
  para2: string
}

// ── SCALE ──────────────────────────────────────────────────────────────────────
export const QS_ANSWERS = [
  { value: 3, label: 'Toujours' },
  { value: 2, label: 'Parfois' },
  { value: 1, label: 'Rarement' },
] as const

// ── QUESTIONS (30 total) ───────────────────────────────────────────────────────
export const QS_QUESTIONS: QSQuestion[] = [
  { id: 1,  pilier: 'ie',            text: "Parvenez-vous à gérer calmement vos émotions dans des situations stressantes ?" },
  { id: 2,  pilier: 'ie',            text: "Êtes-vous capable de comprendre les émotions des autres dans une situation professionnelle ?" },
  { id: 3,  pilier: 'ie',            text: "Êtes-vous capable de rebondir rapidement après un échec ?" },
  { id: 4,  pilier: 'ie',            text: "Voyez-vous les défis comme des opportunités d'apprentissage ?" },
  { id: 5,  pilier: 'communication', text: "Vous exprimez-vous de manière claire et compréhensible dans vos échanges ?" },
  { id: 6,  pilier: 'communication', text: "Êtes-vous à l'aise pour parler en public ou lors de réunions importantes ?" },
  { id: 7,  pilier: 'strategie',     text: "Planifiez-vous vos actions avec une vision à long terme ?" },
  { id: 8,  pilier: 'strategie',     text: "Prenez-vous des décisions après une analyse approfondie des situations ?" },
  { id: 9,  pilier: 'strategie',     text: "Vous adaptez-vous facilement aux changements imprévus ?" },
  { id: 10, pilier: 'strategie',     text: "Êtes-vous à l'aise dans des environnements incertains ou en évolution constante ?" },
  { id: 11, pilier: 'discipline',    text: "Restez-vous concentré(e) sur vos objectifs à long terme ?" },
  { id: 12, pilier: 'discipline',    text: "Parvenez-vous à éviter les distractions dans votre travail quotidien ?" },
  { id: 13, pilier: 'branding',      text: "Travaillez-vous activement sur l'amélioration de votre image personnelle ou professionnelle ?" },
  { id: 14, pilier: 'branding',      text: "Tenez-vous compte de l'impact de votre réputation sur votre réussite ?" },
  { id: 15, pilier: 'temps',         text: "Gérez-vous efficacement votre emploi du temps quotidien ?" },
  { id: 16, pilier: 'temps',         text: "Priorisez-vous les tâches les plus importantes dans votre travail ?" },
  { id: 17, pilier: 'stress',        text: "Restez-vous calme et concentré(e) dans des situations de stress intense ?" },
  { id: 18, pilier: 'stress',        text: "Utilisez-vous régulièrement des techniques pour gérer le stress ?" },
  { id: 19, pilier: 'leadership',    text: "Prenez-vous naturellement le rôle de leader dans des équipes ?" },
  { id: 20, pilier: 'leadership',    text: "Gérez-vous efficacement les conflits au sein d'une équipe ?" },
  { id: 21, pilier: 'creativite',    text: "Trouvez-vous régulièrement des solutions créatives face aux problèmes ?" },
  { id: 22, pilier: 'creativite',    text: "Proposez-vous souvent de nouvelles idées dans un cadre professionnel ?" },
  { id: 23, pilier: 'vision',        text: "Avez-vous une vision claire de vos objectifs à long terme ?" },
  { id: 24, pilier: 'vision',        text: "Réévaluez-vous régulièrement vos objectifs et votre vision pour l'avenir ?" },
  { id: 25, pilier: 'risque',        text: "Prenez-vous des risques calculés pour atteindre vos objectifs ?" },
  { id: 26, pilier: 'risque',        text: "Sortez-vous souvent de votre zone de confort pour avancer dans votre carrière ou vie personnelle ?" },
  { id: 27, pilier: 'autonomie',     text: "Travaillez-vous de manière autonome sur des projets importants sans avoir besoin de supervision ?" },
  { id: 28, pilier: 'autonomie',     text: "Prenez-vous l'initiative d'agir sans attendre des instructions ?" },
  { id: 29, pilier: 'ethique',       text: "Intégrez-vous l'éthique dans toutes vos décisions professionnelles ?" },
  { id: 30, pilier: 'ethique',       text: "Défendez-vous vos valeurs même si cela implique de prendre des risques ?" },
]

export const QS_PILIER_ORDER: QSPilier[] = [
  'ie', 'communication', 'strategie', 'discipline',
  'branding', 'temps', 'stress', 'leadership',
  'creativite', 'vision', 'risque', 'autonomie', 'ethique',
]

// ── PILIER CONTENT ─────────────────────────────────────────────────────────────
export const QS_PILIERS: QSPilierInfo[] = [
  {
    key: 'ie', label: 'Intelligence Émotionnelle', maxScore: 12,
    forceTitle: 'Intelligence Émotionnelle Développée',
    forceDesc: "Vous gérez vos émotions avec maturité et comprenez celles des autres avec finesse. Vous rebondissez rapidement après les échecs et transformez les défis en opportunités d'apprentissage.",
    axeTitle: 'Intelligence Émotionnelle',
    axeDesc: "Travailler davantage la régulation émotionnelle dans les moments de forte pression vous permettra de gagner en stabilité et en clarté de décision, même dans les situations les plus exigeantes.",
  },
  {
    key: 'communication', label: 'Communication', maxScore: 6,
    forceTitle: 'Communication Claire & Impactante',
    forceDesc: "Vous vous exprimez de manière fluide, convaincante et professionnelle. Vous êtes à l'aise à l'oral, ce qui renforce votre crédibilité et votre capacité à influencer positivement votre entourage.",
    axeTitle: 'Communication & Prise de Parole',
    axeDesc: "Renforcer votre aisance à l'oral et affiner la clarté de vos messages, notamment lors des prises de parole en public, amplifiera considérablement votre impact professionnel.",
  },
  {
    key: 'strategie', label: 'Pensée Stratégique & Adaptabilité', maxScore: 12,
    forceTitle: 'Pensée Stratégique',
    forceDesc: "Vous analysez avant d'agir et planifiez vos actions avec une vision long terme. Cela vous confère une capacité décisionnelle forte et structurée, même dans des environnements complexes.",
    axeTitle: "Adaptabilité en Situation d'Incertitude",
    axeDesc: "Vous vous adaptez, mais cela peut varier selon les circonstances. Développer davantage votre flexibilité mentale renforcera votre agilité face aux changements imprévus.",
  },
  {
    key: 'discipline', label: 'Focus & Discipline', maxScore: 6,
    forceTitle: 'Discipline & Orientation Résultats',
    forceDesc: "Vous savez où vous allez et avez la capacité de maintenir vos efforts sur le long terme. Votre constance vous place dans une dynamique de réussite durable.",
    axeTitle: 'Focus & Discipline au Quotidien',
    axeDesc: "Renforcer votre régularité dans la concentration et votre résistance aux distractions du quotidien vous permettra d'accroître significativement votre productivité et vos résultats.",
  },
  {
    key: 'branding', label: 'Personal Branding', maxScore: 6,
    forceTitle: 'Personal Branding Maîtrisé',
    forceDesc: "Vous cultivez votre image et votre réputation professionnelle de manière intentionnelle. Vous comprenez l'impact de votre marque personnelle sur votre réussite et y travaillez activement.",
    axeTitle: 'Personal Branding & Image Professionnelle',
    axeDesc: "Travailler de manière plus structurée sur votre image professionnelle vous permettra de créer de nouvelles opportunités et d'accroître votre visibilité dans votre domaine.",
  },
  {
    key: 'temps', label: 'Gestion du Temps', maxScore: 6,
    forceTitle: 'Gestion du Temps Optimale',
    forceDesc: "Vous planifiez et priorisez vos tâches avec efficacité. Votre organisation quotidienne vous permet d'avancer sur vos priorités et de respecter vos engagements.",
    axeTitle: 'Gestion du Temps & Priorisation',
    axeDesc: "Affiner votre organisation quotidienne et renforcer votre capacité à prioriser les tâches importantes vous aidera à gagner en productivité et à mieux piloter votre énergie.",
  },
  {
    key: 'stress', label: 'Gestion du Stress', maxScore: 6,
    forceTitle: 'Maîtrise du Stress',
    forceDesc: "Vous restez calme et lucide sous pression et utilisez des techniques de régulation du stress de façon régulière, ce qui vous permet de prendre de meilleures décisions dans les moments critiques.",
    axeTitle: 'Gestion du Stress',
    axeDesc: "Vous gérez globalement bien la pression, mais des techniques régulières (respiration, ancrage, recentrage) pourraient encore améliorer votre stabilité dans les moments de stress intense.",
  },
  {
    key: 'leadership', label: 'Leadership', maxScore: 6,
    forceTitle: 'Leadership Naturel',
    forceDesc: "Vous prenez facilement le rôle de leader et inspirez les autres par votre clarté, votre posture et votre sens des responsabilités. Vous gérez les conflits avec efficacité.",
    axeTitle: "Leadership & Gestion d'Équipe",
    axeDesc: "Développer davantage votre posture de leader et vos compétences en gestion de conflits vous permettra d'exercer une influence plus forte et un impact plus structurant sur votre entourage.",
  },
  {
    key: 'creativite', label: 'Créativité & Innovation', maxScore: 6,
    forceTitle: 'Créativité & Innovation',
    forceDesc: "Vous générez des idées originales avec régularité et proposez des solutions créatives à vos problèmes professionnels. Cette capacité à penser différemment est un atout différenciateur réel.",
    axeTitle: 'Créativité et Recherche de Nouvelles Idées',
    axeDesc: "Vous êtes capable d'innovation, mais pas toujours de manière constante. Des exercices de pensée créative peuvent enrichir votre capacité à proposer des solutions originales.",
  },
  {
    key: 'vision', label: 'Vision & Objectifs', maxScore: 6,
    forceTitle: 'Vision Long Terme Claire',
    forceDesc: "Vous avez une vision précise de vos objectifs à long terme et la réévaluez régulièrement. Cette clarté stratégique est un moteur puissant de motivation et de résilience.",
    axeTitle: 'Clarification Continue de la Vision Long Terme',
    axeDesc: "Votre vision est présente, mais gagner en précision et en régularité d'alignement vous permettra de structurer encore mieux votre trajectoire professionnelle et personnelle.",
  },
  {
    key: 'risque', label: 'Prise de Risque & Audace', maxScore: 6,
    forceTitle: 'Audace & Prise de Risque Calculée',
    forceDesc: "Vous évaluez les opportunités avec discernement et osez sortir de votre zone de confort pour avancer. Cette volonté d'agir malgré l'incertitude distingue les profils qui réussissent.",
    axeTitle: 'Prise de Risque & Sortie de Zone de Confort',
    axeDesc: "Développer votre rapport au risque et l'habitude de sortir régulièrement de votre zone de confort vous permettra de saisir davantage d'opportunités et d'accélérer votre progression.",
  },
  {
    key: 'autonomie', label: 'Autonomie & Initiative', maxScore: 6,
    forceTitle: 'Autonomie & Proactivité',
    forceDesc: "Vous agissez sans attendre les instructions et prenez l'initiative sur les projets qui vous concernent. Cette proactivité vous positionne comme un acteur fiable et moteur.",
    axeTitle: 'Autonomie & Initiative Spontanée',
    axeDesc: "Vous travaillez bien seul, mais vous pourriez renforcer votre proactivité dans la prise d'initiative, notamment dans les projets complexes ou les situations qui demandent de l'audace.",
  },
  {
    key: 'ethique', label: 'Éthique & Intégrité', maxScore: 6,
    forceTitle: 'Intégrité & Valeurs Solides',
    forceDesc: "Vos décisions sont guidées par vos principes. Vous avez une éthique professionnelle forte, un atout majeur pour la confiance et le leadership.",
    axeTitle: 'Éthique & Alignement aux Valeurs',
    axeDesc: "Renforcer l'alignement systématique de vos décisions avec vos valeurs, notamment sous pression, consolidera votre intégrité et la confiance que les autres placent en vous.",
  },
]

// ── GLOBAL LEVEL DESCRIPTIONS ─────────────────────────────────────────────────
export const QS_GLOBAL_CONTENT: Record<string, QSGlobalContent> = {
  EXCELLENT: {
    level: 'EXCELLENT',
    para1: "Votre score reflète un profil exceptionnel, caractérisé par une grande cohérence, un haut niveau de maturité personnelle et professionnelle, ainsi qu'un potentiel de réussite très élevé.",
    para2: "Vous démontrez des compétences solides dans la plupart des dimensions mesurées : leadership, discipline, intelligence émotionnelle, pensée stratégique, gestion du temps et prise d'initiative.",
  },
  'TRÈS BON': {
    level: 'TRÈS BON',
    para1: "Votre score révèle un profil très solide, avec des compétences bien développées dans la majorité des dimensions clés du succès personnel et professionnel.",
    para2: "Vous disposez d'atouts réels en matière de leadership, de discipline et de pensée stratégique. Quelques axes ciblés vous permettront d'atteindre votre plein potentiel.",
  },
  BON: {
    level: 'BON',
    para1: "Votre profil montre une bonne maîtrise générale des compétences de succès, avec des points forts significatifs et des axes d'amélioration identifiés.",
    para2: "En travaillant de manière ciblée sur vos axes de développement, vous avez tout le potentiel pour progresser rapidement et construire un profil de succès encore plus solide.",
  },
  'EN DÉVELOPPEMENT': {
    level: 'EN DÉVELOPPEMENT',
    para1: "Votre profil révèle un potentiel en cours de construction. Vous avez des bases sérieuses sur lesquelles vous appuyer pour développer les compétences clés du succès.",
    para2: "En investissant dans les dimensions identifiées comme axes de travail, vous pouvez transformer significativement votre trajectoire personnelle et professionnelle.",
  },
  'À RENFORCER': {
    level: 'À RENFORCER',
    para1: "Votre profil indique un potentiel important encore à activer. Les compétences évaluées constituent des leviers puissants qui, une fois développés, changeront votre trajectoire.",
    para2: "Ce résultat est un point de départ, pas une limite. En vous concentrant sur les axes prioritaires identifiés, vous engagez un processus de transformation durable.",
  },
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
export function getPilierInfo(key: QSPilier): QSPilierInfo {
  return QS_PILIERS.find(p => p.key === key)!
}

export function getPilierScore(pilier: QSPilier, answers: Record<number, number>): number {
  return QS_QUESTIONS
    .filter(q => q.pilier === pilier)
    .reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
}

export function getQSLevel(score: number, maxScore: number): 'forte' | 'moyenne' | 'faible' {
  const pct = score / maxScore
  if (pct >= 0.75) return 'forte'
  if (pct >= 0.50) return 'moyenne'
  return 'faible'
}

export function getTotalScore(answers: Record<number, number>): number {
  return QS_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
}

export function getQSGlobalLevel(total: number): string {
  const pct = total / 90
  if (pct >= 0.85) return 'EXCELLENT'
  if (pct >= 0.70) return 'TRÈS BON'
  if (pct >= 0.55) return 'BON'
  if (pct >= 0.40) return 'EN DÉVELOPPEMENT'
  return 'À RENFORCER'
}

export function getTop5Forces(answers: Record<number, number>): QSPilier[] {
  return [...QS_PILIER_ORDER]
    .sort((a, b) => {
      const pctA = getPilierScore(a, answers) / getPilierInfo(a).maxScore
      const pctB = getPilierScore(b, answers) / getPilierInfo(b).maxScore
      return pctB - pctA
    })
    .slice(0, 5)
}

export function getBottom5Axes(answers: Record<number, number>): QSPilier[] {
  return [...QS_PILIER_ORDER]
    .sort((a, b) => {
      const pctA = getPilierScore(a, answers) / getPilierInfo(a).maxScore
      const pctB = getPilierScore(b, answers) / getPilierInfo(b).maxScore
      return pctA - pctB
    })
    .slice(0, 5)
}
