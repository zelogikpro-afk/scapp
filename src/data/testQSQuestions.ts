export type QSPilier =
  | 'ie' | 'resilience' | 'communication' | 'strategie' | 'adaptabilite'
  | 'determination' | 'discipline' | 'creativite' | 'temps' | 'leadership'
  | 'confiance' | 'ethique' | 'stress' | 'motivation' | 'optimisme'

export interface QSQuestion {
  id: number
  pilier: QSPilier
  text: string
}

export interface QSPilierContent {
  forceTitle: string
  forceDesc: string
  axeTitle: string
  axeDesc: string
}

export interface QSPilierInfo {
  key: QSPilier
  label: string
  type: 'principal' | 'secondaire'
  content: QSPilierContent
}

export const QS_QUESTIONS: QSQuestion[] = [
  // 1. Intelligence Émotionnelle
  { id: 1,  pilier: 'ie',            text: "Comment évaluez-vous votre capacité à reconnaître et comprendre vos propres émotions ?" },
  { id: 2,  pilier: 'ie',            text: "Dans quelle mesure parvenez-vous à gérer vos émotions dans des situations de stress ?" },
  { id: 3,  pilier: 'ie',            text: "Pouvez-vous facilement percevoir et comprendre les émotions des autres ?" },
  // 2. Résilience
  { id: 4,  pilier: 'resilience',    text: "Comment réagissez-vous aux échecs ou aux situations difficiles ?" },
  { id: 5,  pilier: 'resilience',    text: "Êtes-vous capable de rester optimiste même après un revers important ?" },
  { id: 6,  pilier: 'resilience',    text: "Comment gérez-vous les périodes d'incertitude ?" },
  // 3. Communication
  { id: 7,  pilier: 'communication', text: "À quel point êtes-vous à l'aise pour exprimer vos idées clairement à l'oral ?" },
  { id: 8,  pilier: 'communication', text: "Êtes-vous capable de persuader ou d'influencer les autres avec vos mots ?" },
  { id: 9,  pilier: 'communication', text: "Comment évaluez-vous votre capacité à écouter activement les autres ?" },
  // 4. Pensée Stratégique
  { id: 10, pilier: 'strategie',     text: "Êtes-vous capable d'anticiper les défis futurs dans vos projets ?" },
  { id: 11, pilier: 'strategie',     text: "Comment élaborez-vous des plans pour atteindre des objectifs à long terme ?" },
  { id: 12, pilier: 'strategie',     text: "À quel point prenez-vous en compte les différentes options avant de prendre une décision importante ?" },
  // 5. Adaptabilité
  { id: 13, pilier: 'adaptabilite',  text: "Comment réagissez-vous lorsque vous êtes confronté à des changements inattendus ?" },
  { id: 14, pilier: 'adaptabilite',  text: "Êtes-vous capable de vous adapter rapidement à de nouveaux environnements ou situations ?" },
  { id: 15, pilier: 'adaptabilite',  text: "Comment gérez-vous les situations où vous devez sortir de votre zone de confort ?" },
  // 6. Détermination
  { id: 16, pilier: 'determination', text: "Êtes-vous capable de rester concentré sur vos objectifs malgré les distractions ?" },
  { id: 17, pilier: 'determination', text: "Comment faites-vous face aux obstacles qui pourraient vous empêcher d'atteindre vos objectifs ?" },
  { id: 18, pilier: 'determination', text: "Êtes-vous persévérant, même lorsque les résultats ne sont pas immédiats ?" },
  // 7. Discipline
  { id: 19, pilier: 'discipline',    text: "Comment maintenez-vous une routine ou un effort constant dans vos tâches quotidiennes ?" },
  { id: 20, pilier: 'discipline',    text: "Êtes-vous capable de résister aux tentations qui pourraient vous détourner de vos objectifs ?" },
  { id: 21, pilier: 'discipline',    text: "Comment gérez-vous la procrastination ?" },
  // 8. Créativité
  { id: 22, pilier: 'creativite',    text: "Êtes-vous capable de proposer des idées nouvelles et innovantes pour résoudre des problèmes ?" },
  { id: 23, pilier: 'creativite',    text: "Comment évaluez-vous votre capacité à penser de manière divergente ?" },
  { id: 24, pilier: 'creativite',    text: "Êtes-vous à l'aise pour explorer des solutions non conventionnelles ?" },
  // 9. Gestion du Temps
  { id: 25, pilier: 'temps',         text: "Êtes-vous capable de planifier et de hiérarchiser vos tâches de manière efficace ?" },
  { id: 26, pilier: 'temps',         text: "Comment gérez-vous les délais serrés ?" },
  { id: 27, pilier: 'temps',         text: "Avez-vous des techniques pour maximiser votre productivité ?" },
  // 10. Leadership
  { id: 28, pilier: 'leadership',    text: "Êtes-vous capable de motiver et d'inspirer les autres autour de vous ?" },
  { id: 29, pilier: 'leadership',    text: "Comment gérez-vous les conflits au sein d'une équipe ?" },
  { id: 30, pilier: 'leadership',    text: "Êtes-vous à l'aise pour prendre des décisions importantes pour un groupe ?" },
  // 11. Confiance en Soi
  { id: 31, pilier: 'confiance',     text: "Dans quelle mesure croyez-vous en vos capacités à réussir ?" },
  { id: 32, pilier: 'confiance',     text: "Êtes-vous prêt à prendre des risques calculés pour atteindre vos objectifs ?" },
  { id: 33, pilier: 'confiance',     text: "Comment réagissez-vous aux critiques ?" },
  // 12. Éthique et Intégrité
  { id: 34, pilier: 'ethique',       text: "Êtes-vous fidèle à vos principes, même face à des situations difficiles ?" },
  { id: 35, pilier: 'ethique',       text: "Comment évaluez-vous votre transparence dans vos actions ?" },
  { id: 36, pilier: 'ethique',       text: "Pouvez-vous prendre des décisions éthiques, même si elles sont impopulaires ?" },
  // 13. Gestion du Stress
  { id: 37, pilier: 'stress',        text: "Comment réagissez-vous sous pression ?" },
  { id: 38, pilier: 'stress',        text: "Avez-vous des techniques pour réduire votre stress dans les situations difficiles ?" },
  { id: 39, pilier: 'stress',        text: "Comment gérez-vous les responsabilités multiples sans être submergé ?" },
  // 14. Auto-motivation
  { id: 40, pilier: 'motivation',    text: "Êtes-vous capable de vous motiver même lorsque les circonstances sont défavorables ?" },
  { id: 41, pilier: 'motivation',    text: "Comment restez-vous concentré sur vos objectifs à long terme ?" },
  { id: 42, pilier: 'motivation',    text: "Êtes-vous proactif dans la poursuite de vos rêves, sans attendre l'influence des autres ?" },
  // 15. Optimisme
  { id: 43, pilier: 'optimisme',     text: "Êtes-vous naturellement porté à voir le bon côté des choses ?" },
  { id: 44, pilier: 'optimisme',     text: "Comment gérez-vous les situations où les résultats ne sont pas immédiatement positifs ?" },
  { id: 45, pilier: 'optimisme',     text: "Croyez-vous que vos efforts aboutiront finalement à des succès, même après plusieurs échecs ?" },
]

export const QS_PILIERS: QSPilierInfo[] = [
  {
    key: 'ie', label: 'Intelligence Émotionnelle', type: 'principal',
    content: {
      forceTitle: 'Intelligence Émotionnelle Développée',
      forceDesc: "Vous êtes en harmonie avec vos émotions et celles des autres. Cette conscience fine vous permet de naviguer avec aisance dans les relations interpersonnelles et de prendre des décisions équilibrées, même sous pression.",
      axeTitle: 'Intelligence Émotionnelle',
      axeDesc: "Développer davantage votre conscience émotionnelle vous permettra d'améliorer vos relations et votre capacité à gérer les situations complexes. Des pratiques de pleine conscience et de réflexion personnelle peuvent accélérer ce développement.",
    },
  },
  {
    key: 'resilience', label: 'Résilience', type: 'principal',
    content: {
      forceTitle: 'Résilience & Force Intérieure',
      forceDesc: "Vous savez rebondir face aux défis et aux revers. Votre capacité à transformer les obstacles en opportunités d'apprentissage fait de vous quelqu'un de solide et fiable dans les moments difficiles.",
      axeTitle: 'Renforcement de la Résilience',
      axeDesc: "Votre résilience peut être renforcée. Travailler sur votre rapport à l'échec et développer des stratégies de récupération émotionnelle vous aidera à traverser les périodes difficiles avec plus de stabilité et de confiance.",
    },
  },
  {
    key: 'communication', label: 'Communication', type: 'principal',
    content: {
      forceTitle: 'Communication Claire & Impactante',
      forceDesc: "Vous vous exprimez de manière fluide, convaincante et professionnelle. Vous êtes à l'aise à l'oral, ce qui renforce votre crédibilité et votre capacité à influencer positivement votre entourage.",
      axeTitle: 'Communication à Développer',
      axeDesc: "Améliorer votre aisance à l'oral et votre capacité d'écoute active renforcera votre impact dans vos échanges. Des exercices de prise de parole et de communication non violente peuvent être très bénéfiques.",
    },
  },
  {
    key: 'strategie', label: 'Pensée Stratégique', type: 'principal',
    content: {
      forceTitle: 'Pensée Stratégique',
      forceDesc: "Vous analysez avant d'agir et vous planifiez vos actions avec une vision long terme. Cela vous confère une capacité décisionnelle forte et structurée, un atout majeur dans la conduite de projets complexes.",
      axeTitle: 'Développement de la Vision Stratégique',
      axeDesc: "Structurer davantage votre réflexion prospective et travailler sur la planification à long terme vous permettra de prendre des décisions plus éclairées. Des outils comme la cartographie mentale ou l'analyse SWOT peuvent vous y aider.",
    },
  },
  {
    key: 'adaptabilite', label: 'Adaptabilité', type: 'principal',
    content: {
      forceTitle: 'Adaptabilité & Agilité',
      forceDesc: "Vous faites preuve d'une grande souplesse face aux changements et aux imprévus. Cette agilité mentale vous permet de rester performant même dans des environnements en constante évolution.",
      axeTitle: 'Adaptabilité en Situation d\'Incertitude',
      axeDesc: "Vous vous adaptez, mais cela peut varier selon les circonstances. Développer davantage votre flexibilité mentale renforcera votre agilité professionnelle et votre capacité à saisir les opportunités dans le changement.",
    },
  },
  {
    key: 'determination', label: 'Détermination', type: 'principal',
    content: {
      forceTitle: 'Détermination & Persévérance',
      forceDesc: "Votre capacité à rester focalisé sur vos objectifs malgré les obstacles est remarquable. Vous ne lâchez pas et cette ténacité est l'un des facteurs clés de votre succès à long terme.",
      axeTitle: 'Renforcement de la Détermination',
      axeDesc: "Travailler sur votre ancrage dans vos objectifs et développer des habitudes de persévérance vous permettra de maintenir le cap même face aux défis les plus exigeants. La clarté de vision est un levier essentiel.",
    },
  },
  {
    key: 'discipline', label: 'Discipline', type: 'principal',
    content: {
      forceTitle: 'Discipline & Orientation Résultats',
      forceDesc: "Vous savez où vous allez et vous avez la capacité de maintenir vos efforts sur le long terme. Votre constance vous place dans une dynamique de réussite durable et inspirante pour ceux qui vous entourent.",
      axeTitle: 'Construction de la Discipline',
      axeDesc: "Instaurer des routines plus structurées et travailler sur la gestion de la procrastination vous permettra de maximiser votre efficacité. De petits engagements quotidiens construisent une discipline solide sur le long terme.",
    },
  },
  {
    key: 'creativite', label: 'Créativité', type: 'secondaire',
    content: {
      forceTitle: 'Créativité & Innovation',
      forceDesc: "Vous avez une capacité naturelle à penser hors des sentiers battus et à proposer des solutions originales. Cette créativité est un atout précieux pour innover et vous différencier dans votre domaine.",
      axeTitle: 'Créativité et Recherche de Nouvelles Idées',
      axeDesc: "Vous êtes capable d'innovation, mais pas toujours de manière constante. Des exercices de pensée créative (brainstorming, mind mapping, exploration de nouvelles disciplines) peuvent enrichir votre capacité à proposer des solutions originales.",
    },
  },
  {
    key: 'temps', label: 'Gestion du Temps', type: 'secondaire',
    content: {
      forceTitle: 'Maîtrise du Temps & Productivité',
      forceDesc: "Vous organisez votre temps avec efficacité et priorisez vos actions de manière stratégique. Cette maîtrise vous permet d'être productif tout en maintenant un équilibre sain entre vos différentes responsabilités.",
      axeTitle: 'Organisation & Gestion du Temps',
      axeDesc: "Améliorer votre planification et l'utilisation de techniques de gestion du temps (time blocking, matrice d'Eisenhower) vous permettra de gagner en efficacité et de réduire le stress lié aux délais.",
    },
  },
  {
    key: 'leadership', label: 'Leadership', type: 'secondaire',
    content: {
      forceTitle: 'Leadership Naturel',
      forceDesc: "Vous prenez facilement le rôle de leader et vous inspirez les autres par votre clarté, votre posture et votre sens des responsabilités. Votre capacité à fédérer est un atout majeur pour conduire des équipes vers le succès.",
      axeTitle: 'Développement du Leadership',
      axeDesc: "Renforcer vos compétences en gestion d'équipe et en prise de décision collective vous permettra d'affirmer davantage votre posture de leader. La pratique régulière dans des contextes variés est la clé du développement du leadership.",
    },
  },
  {
    key: 'confiance', label: 'Confiance en Soi', type: 'secondaire',
    content: {
      forceTitle: 'Confiance en Soi & Audace',
      forceDesc: "Vous croyez en vos capacités et vous n'hésitez pas à prendre des risques calculés pour atteindre vos ambitions. Cette assurance vous permet d'avancer avec détermination et d'inspirer confiance autour de vous.",
      axeTitle: 'Renforcement de la Confiance en Soi',
      axeDesc: "Travailler sur votre estime de soi et apprendre à accueillir les critiques constructives vous permettra de développer une confiance plus solide. Chaque petit succès conscientisé renforce votre confiance en vos capacités.",
    },
  },
  {
    key: 'ethique', label: 'Éthique & Intégrité', type: 'secondaire',
    content: {
      forceTitle: 'Intégrité & Valeurs Solides',
      forceDesc: "Vos décisions sont guidées par vos principes. Vous avez une éthique professionnelle forte, un atout majeur pour la confiance et le leadership. Votre intégrité vous confère une crédibilité durable.",
      axeTitle: 'Alignement Éthique',
      axeDesc: "Renforcer votre alignement entre vos valeurs et vos actions vous permettra de prendre des décisions plus cohérentes et d'inspirer davantage confiance. La clarification de vos valeurs fondamentales est une étape clé.",
    },
  },
  {
    key: 'stress', label: 'Gestion du Stress', type: 'secondaire',
    content: {
      forceTitle: 'Gestion du Stress & Sérénité',
      forceDesc: "Vous faites preuve d'une grande stabilité émotionnelle face à la pression. Vos techniques de gestion du stress vous permettent de maintenir votre performance même dans les situations les plus exigeantes.",
      axeTitle: 'Gestion du Stress',
      axeDesc: "Vous gérez globalement bien vos émotions, mais des techniques régulières (respiration, ancrage, recentrage) pourraient encore améliorer votre stabilité dans les moments de pression intense. La régularité de la pratique est essentielle.",
    },
  },
  {
    key: 'motivation', label: 'Auto-motivation', type: 'secondaire',
    content: {
      forceTitle: 'Auto-motivation & Initiative',
      forceDesc: "Vous êtes votre propre moteur. Vous n'attendez pas la validation extérieure pour avancer et vous savez puiser en vous-même l'énergie nécessaire pour poursuivre vos objectifs, même dans les moments difficiles.",
      axeTitle: 'Autonomie & Initiative Spontanée',
      axeDesc: "Vous travaillez bien seul, mais vous pourriez renforcer votre proactivité dans la prise d'initiative, notamment dans les projets complexes. Identifier vos sources de motivation intrinsèque est une clé pour développer cet axe.",
    },
  },
  {
    key: 'optimisme', label: 'Optimisme', type: 'secondaire',
    content: {
      forceTitle: 'Optimisme & Vision Positive',
      forceDesc: "Vous avez une vision naturellement positive de l'avenir et vous croyez en votre capacité à transformer les défis en opportunités. Cet état d'esprit est un carburant puissant pour la réussite et l'attraction des bonnes opportunités.",
      axeTitle: 'Clarification Continue de la Vision Long Terme',
      axeDesc: "Votre vision est présente, mais gagner en précision et en régularité d'alignement vous permettra de structurer encore mieux votre trajectoire. Visualiser régulièrement vos objectifs renforce l'optimisme et la motivation.",
    },
  },
]

export const QS_PILIER_ORDER: QSPilier[] = [
  'ie', 'resilience', 'communication', 'strategie', 'adaptabilite',
  'determination', 'discipline', 'creativite', 'temps', 'leadership',
  'confiance', 'ethique', 'stress', 'motivation', 'optimisme',
]

export interface QSLevel {
  label: string
  color: string
  bg: string
  description: string
}

export function getQSLevel(total: number): QSLevel {
  if (total >= 382) return {
    label: 'EXCELLENT',
    color: '#16a34a',
    bg: '#f0fdf4',
    description: "Votre score dépasse la grille maximale du QS, ce qui indique un profil exceptionnel, caractérisé par une grande cohérence, un haut niveau de maturité personnelle et professionnelle, ainsi qu'un potentiel de réussite très élevé. Vous démontrez des compétences solides dans la plupart des dimensions mesurées : leadership, discipline, intelligence émotionnelle, pensée stratégique, gestion du temps et prise d'initiative.",
  }
  if (total >= 315) return {
    label: 'TRÈS BON',
    color: '#0284c7',
    bg: '#f0f9ff',
    description: "Votre QS révèle un profil solide et équilibré. Vous possédez de nombreuses compétences clés qui vous permettent d'avancer efficacement vers vos objectifs. Quelques axes de développement ciblés vous permettront d'atteindre un niveau d'excellence.",
  }
  if (total >= 225) return {
    label: 'BON',
    color: '#7c3aed',
    bg: '#faf5ff',
    description: "Votre QS indique un profil en progression avec de belles bases. Vous disposez de compétences réelles que vous pouvez amplifier. Un travail ciblé sur vos axes d'amélioration vous permettra d'accélérer significativement votre trajectoire de succès.",
  }
  if (total >= 135) return {
    label: 'EN DÉVELOPPEMENT',
    color: '#d97706',
    bg: '#fffbeb',
    description: "Votre QS révèle un potentiel en cours d'éveil. Vous êtes dans une phase de développement importante. Avec un accompagnement adapté et un engagement personnel soutenu, vous avez toutes les ressources pour progresser et révéler votre plein potentiel.",
  }
  return {
    label: 'À RENFORCER',
    color: '#dc2626',
    bg: '#fef2f2',
    description: "Votre QS indique un terrain fertile pour une transformation profonde. Cette prise de conscience est déjà une force. Un travail méthodique sur les piliers fondamentaux vous permettra de construire des bases solides pour votre succès futur.",
  }
}

export function getPilierScore(pilier: QSPilier, answers: Record<number, number>): number {
  return QS_QUESTIONS
    .filter(q => q.pilier === pilier)
    .reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
}

export function getTop5Forces(scores: Record<QSPilier, number>): QSPilier[] {
  return [...QS_PILIER_ORDER]
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 5)
}

export function getBottom5Axes(scores: Record<QSPilier, number>): QSPilier[] {
  return [...QS_PILIER_ORDER]
    .sort((a, b) => scores[a] - scores[b])
    .slice(0, 5)
}

export function getPilierInfo(key: QSPilier): QSPilierInfo {
  return QS_PILIERS.find(p => p.key === key)!
}
