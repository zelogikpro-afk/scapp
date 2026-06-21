export type CompassProfileKey =
  | 'orange' | 'violet' | 'vert' | 'turquoise' | 'corail'
  | 'magenta' | 'sable' | 'indigo' | 'peche' | 'jade'

export interface CompassProfile {
  key: CompassProfileKey
  label: string       // color name in French
  name: string        // archetype title
  color: string       // hex color
  bgColor: string     // light bg for cards
  pdfFile: string     // filename in /public/pdfs/compass/
  traits: string
  pointsForts: string
  zonesDev: string
  strategies: string
  recommandations: string
  evolution: string[]
}

// Questions (JotForm: Q1=Nom, Q2..Q33 = 32 questions → our Q1..Q32)
// Scale: 1=Pas du tout, 2=Peu, 3=Modérément, 4=Beaucoup, 5=Complètement
export const COMPASS_QUESTIONS: { id: number; text: string }[] = [
  { id: 1,  text: "Lorsque je suis face à une décision importante, je préfère agir rapidement et sans hésitation." },
  { id: 2,  text: "J'aime analyser toutes les options avant de prendre une décision." },
  { id: 3,  text: "Je me sens à l'aise en prenant des initiatives sans attendre de directives." },
  { id: 4,  text: "Avant d'agir, je préfère obtenir un consensus auprès de mes collègues." },
  { id: 5,  text: "Je préfère explorer de nouvelles idées, même si elles sont risquées." },
  { id: 6,  text: "J'ai tendance à privilégier des approches structurées et bien établies plutôt que l'innovation." },
  { id: 7,  text: "J'aime trouver des solutions créatives et non conventionnelles aux problèmes." },
  { id: 8,  text: "Je suis plus à l'aise en améliorant des systèmes existants qu'en créant quelque chose de totalement nouveau." },
  { id: 9,  text: "Je préfère être direct et franc dans mes interactions avec les autres." },
  { id: 10, text: "Je fais attention à ne pas heurter les autres et préfère une approche diplomatique." },
  { id: 11, text: "Je me sens à l'aise dans les discussions où il faut concilier plusieurs points de vue." },
  { id: 12, text: "J'aime inspirer et motiver les autres par mon discours et mon attitude." },
  { id: 13, text: "En situation de conflit, je préfère résoudre les choses rapidement, même si cela peut être inconfortable." },
  { id: 14, text: "En période de stress, je me tourne vers les autres pour obtenir des conseils ou du soutien." },
  { id: 15, text: "Je suis souvent celui ou celle qui calme les tensions et encourage la médiation." },
  { id: 16, text: "Je gère bien la pression et je me concentre sur les solutions plutôt que sur les émotions." },
  { id: 17, text: "Je me sens à l'aise dans des rôles de leadership où je peux diriger les autres vers un objectif." },
  { id: 18, text: "Je préfère travailler en équipe et partager la responsabilité des résultats." },
  { id: 19, text: "Je prends naturellement le rôle de médiateur lorsque des conflits émergent au sein de l'équipe." },
  { id: 20, text: "J'aime travailler de manière indépendante et avoir le contrôle total sur le projet." },
  { id: 21, text: "Je suis à l'aise avec les changements soudains et je peux m'adapter rapidement." },
  { id: 22, text: "Je préfère travailler dans des environnements stables et prévisibles." },
  { id: 23, text: "Lorsque des imprévus surviennent, je préfère réévaluer et ajuster le plan de manière flexible." },
  { id: 24, text: "Je trouve difficile de changer de direction une fois qu'un plan est établi." },
  { id: 25, text: "Je fais attention au bien-être des autres et j'aime m'assurer que tout le monde se sent bien." },
  { id: 26, text: "Je préfère séparer mes émotions du travail pour rester concentré sur les résultats." },
  { id: 27, text: "Je suis à l'aise pour exprimer mes émotions au travail et j'encourage les autres à le faire également." },
  { id: 28, text: "Je préfère éviter de montrer mes émotions en milieu professionnel, même sous stress." },
  { id: 29, text: "Je n'hésite pas à prendre des risques calculés pour innover et créer quelque chose de nouveau." },
  { id: 30, text: "Je préfère éviter les risques et m'appuyer sur des méthodes éprouvées." },
  { id: 31, text: "Je préfère élaborer des plans à long terme et suivre une stratégie rigoureuse." },
  { id: 32, text: "Je suis à l'aise pour ajuster un plan en cours de route si les circonstances changent." },
]

export const COMPASS_SCALE = [
  { value: 1, label: 'Pas du tout' },
  { value: 2, label: 'Peu' },
  { value: 3, label: 'Modérément' },
  { value: 4, label: 'Beaucoup' },
  { value: 5, label: 'Complètement' },
]

// Scoring: which questions (1-indexed) count for each profile
export const COMPASS_SCORING: Record<CompassProfileKey, number[]> = {
  orange:    [1, 3, 5, 7, 12, 29],
  violet:    [2, 6, 16, 31, 32],
  vert:      [4, 9, 10, 11, 19, 23],
  turquoise: [10, 15, 19, 25, 27],
  corail:    [1, 9, 12, 17, 18, 19],
  magenta:   [2, 6, 13, 15, 16],
  sable:     [8, 14, 21, 23, 29],
  indigo:    [2, 6, 31, 32],
  peche:     [1, 12, 17, 20, 29],
  jade:      [21, 23, 28, 32],
}

export const COMPASS_PROFILES: Record<CompassProfileKey, CompassProfile> = {
  orange: {
    key: 'orange', label: 'Orange', name: "Le Visionnaire Proactif",
    color: '#E8660A', bgColor: '#FFF4ED',
    pdfFile: '_Orange - Le Visionnaire Proactif.pdf',
    traits: "Ambitieux, orienté vers l’action, visionnaire et entrepreneur dans l’âme.",
    pointsForts: "Capacité à anticiper les opportunités et à mobiliser les équipes autour d’une vision audacieuse.",
    zonesDev: "Peut manquer de patience face aux processus lents ou aux détails opérationnels.",
    strategies: "Canaliser l’énergie créatrice vers des projets concrets avec des jalons mesurables.",
    recommandations: "Proposer des missions stratégiques avec une grande latitude d’action.",
    evolution: [
      "Développer la capacité à déléguer les détails opérationnels.",
      "Renforcer la patience face aux processus décisionnels collectifs.",
      "Apprendre à structurer les idées visionnaires en plans d’action réalistes.",
    ],
  },
  violet: {
    key: 'violet', label: 'Violet', name: "Le Stratège Décisionnel",
    color: '#6B21A8', bgColor: '#F5F0FF',
    pdfFile: 'Violet – Le Stratège Décisionnel.pdf',
    traits: "Analytique, rigoureux, orienté vers la planification à long terme et la prise de décision éclairée.",
    pointsForts: "Excellente capacité à construire des stratégies solides et à anticiper les risques.",
    zonesDev: "Peut parfois sur-analyser et retarder la mise en action par excès de prudence.",
    strategies: "Associer la rigueur analytique à des délais décisionnels clairs pour éviter la paralysie.",
    recommandations: "Confier des missions de planification stratégique avec des livrables précis.",
    evolution: [
      "Travailler la rapidité d’exécution une fois la stratégie définie.",
      "Apprendre à prendre des décisions avec des informations imparfaites.",
      "Développer la flexibilité pour ajuster les plans face aux imprévus.",
    ],
  },
  vert: {
    key: 'vert', label: 'Vert', name: "Le Facilitateur Adaptable",
    color: '#16A34A', bgColor: '#F0FDF4',
    pdfFile: 'Vert – Le Facilitateur Adaptable.pdf',
    traits: "Flexible, orienté vers l’équipe, à l’écoute et capable de s’adapter à tout contexte.",
    pointsForts: "Aptitude naturelle à faciliter la coopération et à trouver des compromis constructifs.",
    zonesDev: "Peut manquer d’affirmation de soi et avoir du mal à défendre ses propres positions.",
    strategies: "Valoriser son rôle de facilitateur tout en développant son leadership personnel.",
    recommandations: "Placer dans des rôles de coordination d’équipe ou de gestion de projets transversaux.",
    evolution: [
      "Développer sa capacité à défendre ses idées avec conviction.",
      "Renforcer la prise de décision indépendante sans validation externe.",
      "Apprendre à fixer des limites claires pour préserver son énergie.",
    ],
  },
  turquoise: {
    key: 'turquoise', label: 'Turquoise', name: "Le Médiateur Humaniste",
    color: '#0891B2', bgColor: '#F0FDFF',
    pdfFile: 'Turquoise – Le Médiateur Humaniste.pdf',
    traits: "Empathique, bienveillant, orienté vers le bien-être collectif et la résolution pacifique des conflits.",
    pointsForts: "Intelligence émotionnelle élevée, excellente capacité d’écoute et de médiation.",
    zonesDev: "Peut trop prioriser les besoins des autres au détriment des objectifs de performance.",
    strategies: "Equilibrer l’empathie avec l’exigence de résultats concrets.",
    recommandations: "Confier des missions liées au bien-être des équipes et à la gestion des relations interpersonnelles.",
    evolution: [
      "Apprendre à s’affirmer davantage dans les situations de négociation.",
      "Développer une approche plus orientée résultats sans sacrifier l’humain.",
      "Renforcer sa résilience face aux situations conflictuelles persistantes.",
    ],
  },
  corail: {
    key: 'corail', label: 'Corail', name: "Le Leader Collaboratif",
    color: '#E84545', bgColor: '#FFF0F0',
    pdfFile: 'Corail – Le Leader Collaboratif.pdf',
    traits: "Inspirant, orienté vers les résultats, attentif aux dynamiques d’équipe.",
    pointsForts: "Capacité à gérer une équipe tout en maintenant des relations positives.",
    zonesDev: "Peut hésiter à prendre des décisions difficiles ou être trop indulgent.",
    strategies: "Favoriser la collaboration tout en fixant des objectifs clairs et mesurables.",
    recommandations: "Proposer des formations en leadership direct et en gestion de la performance.",
    evolution: [
      "Travailler sur la prise de décisions fermes dans des situations critiques.",
      "Suivre les résultats de l’équipe de manière plus rigoureuse.",
      "Etablir un cadre de travail plus structuré.",
    ],
  },
  magenta: {
    key: 'magenta', label: 'Magenta', name: "L’Analyste Diplomate",
    color: '#C026D3', bgColor: '#FDF0FF',
    pdfFile: 'Magenta – L’Analyste Diplomate.pdf',
    traits: "Précis, diplomate, capable de marier l’analyse rigoureuse et la gestion des relations humaines.",
    pointsForts: "Sait naviguer dans des environnements complexes en restant neutre et constructif.",
    zonesDev: "Peut hésiter à trancher clairement par peur de froisser les sensibilités.",
    strategies: "Encourager une prise de position plus affirmée tout en maintenant la diplomatie.",
    recommandations: "Solliciter pour des missions d’audit, d’analyse ou de médiation organisationnelle.",
    evolution: [
      "Développer la capacité à communiquer des analyses difficiles avec assertivité.",
      "Renforcer la rapidité de décision dans les contextes ambigus.",
      "Apprendre à défendre ses conclusions face à des parties prenantes résistantes.",
    ],
  },
  sable: {
    key: 'sable', label: 'Sable', name: "Le Créateur Prudent",
    color: '#B45309', bgColor: '#FFFBF0',
    pdfFile: 'Sable – Le Créateur Prudent.pdf',
    traits: "Créatif mais méthodique, combine l’innovation et la prudence pour produire des résultats durables.",
    pointsForts: "Capacité à concevoir des solutions originales tout en anticipant les risques.",
    zonesDev: "Peut sous-évaluer ses idées par excès de prudence ou manquer d’audace dans l’exécution.",
    strategies: "Encourager la prise de risque mesurée dans un cadre sécurisé.",
    recommandations: "Confier des projets de conception ou d’amélioration où la créativité est valorisée.",
    evolution: [
      "Développer la confiance en ses propres idées et leur potentiel.",
      "Apprendre à partager ses créations plus tôt dans le processus.",
      "Renforcer la capacité à expérimenter sans garantie de succès.",
    ],
  },
  indigo: {
    key: 'indigo', label: 'Indigo', name: "L’Architecte Logique",
    color: '#3730A3', bgColor: '#F0F0FF',
    pdfFile: "Indigo – L’Architecte Logique.pdf",
    traits: "Logique, structuré, orienté vers la construction de systèmes cohérents et efficaces.",
    pointsForts: "Maîtrise des processus complexes, rigueur intellectuelle et sens de l’organisation.",
    zonesDev: "Peut avoir du mal à s’adapter quand les situations sortent de son cadre logique préétabli.",
    strategies: "Valoriser la rigueur logique tout en encourageant l’ouverture aux approches intuitives.",
    recommandations: "Proposer des missions de structuration, d’architecture de processus ou de gestion de projets.",
    evolution: [
      "Développer la flexibilité face aux situations non structurées.",
      "Apprendre à intégrer les dimensions humaines et émotionnelles dans ses analyses.",
      "Renforcer la communication pour rendre ses analyses accessibles à tous.",
    ],
  },
  peche: {
    key: 'peche', label: 'Pêche', name: "Le Pionnier Charismatique",
    color: '#F97316', bgColor: '#FFF7ED',
    pdfFile: "Pêche – Le Pionnier Charismatique.pdf",
    traits: "Charismatique, dynamique, orienté vers la prise d’initiative et le leadership inspirant.",
    pointsForts: "Fort pouvoir de persuasion, sait diriger des initiatives audacieuses.",
    zonesDev: "Manque parfois de suivi rigoureux, peut se concentrer davantage sur l’image que sur les résultats.",
    strategies: "Encourager la prise d’initiative tout en assurant un suivi régulier des projets.",
    recommandations: "Fournir des outils de gestion de projet et de suivi rigoureux.",
    evolution: [
      "Travailler sur le suivi des projets jusqu’à leur finalisation.",
      "Développer des compétences organisationnelles pour les projets complexes.",
      "Participer à des formations de gestion de projet.",
    ],
  },
  jade: {
    key: 'jade', label: 'Jade', name: "L’Equilibriste Innovant",
    color: '#059669', bgColor: '#F0FFF9',
    pdfFile: "Jade – L’Équilibriste Innovant.pdf",
    traits: "Créatif, équilibré, capable de conjuguer innovation et stabilité pour avancer sereinement.",
    pointsForts: "Aptitude à trouver des solutions nouvelles tout en préservant la cohésion du groupe.",
    zonesDev: "Peut parfois osciller trop longtemps entre différentes options sans trancher.",
    strategies: "Encourager la prise de décision dans les situations d’ambiguïté tout en valorisant la créativité.",
    recommandations: "Solliciter pour des projets d’innovation où l’équilibre entre exploration et rigueur est clé.",
    evolution: [
      "Développer la capacité à trancher dans les situations d’incertitude.",
      "Renforcer la confiance en ses propositions innovantes.",
      "Apprendre à faire avancer les projets même sans consensus parfait.",
    ],
  },
}

export function getCompassScore(answers: Record<number, number>, profile: CompassProfileKey): number {
  const qs = COMPASS_SCORING[profile]
  return qs.reduce((sum, q) => sum + (answers[q] || 0), 0)
}

export function getDominantProfile(answers: Record<number, number>): CompassProfileKey {
  const profiles = Object.keys(COMPASS_SCORING) as CompassProfileKey[]
  let best: CompassProfileKey = 'orange'
  let bestScore = -1
  for (const p of profiles) {
    const s = getCompassScore(answers, p)
    if (s > bestScore) { bestScore = s; best = p }
  }
  return best
}

export function getAllScores(answers: Record<number, number>): Record<CompassProfileKey, number> {
  const result = {} as Record<CompassProfileKey, number>
  for (const p of Object.keys(COMPASS_SCORING) as CompassProfileKey[]) {
    result[p] = getCompassScore(answers, p)
  }
  return result
}
