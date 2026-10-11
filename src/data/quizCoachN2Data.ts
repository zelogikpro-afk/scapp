export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correct: number // index 0-3
  theme: string
}

export const QUIZ_N2_THEMES = [
  'Psychologie & Troubles mentaux',
  'Coaching thérapeutique',
  'Approche Cognitive et Comportementale',
  'Méthode d\'Ancrage Positif (MAP)',
  'Pratique du coaching thérapeutique',
]

export const QUIZ_N2_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quel trouble est classé comme un trouble de l'humeur ?",
    options: [
      "La schizophrénie",
      "La dépression",
      "Le trouble obsessionnel-compulsif",
      "Le trouble bipolaire",
    ],
    correct: 1,
  },
  {
    id: 2,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quelle est la principale différence entre coaching thérapeutique et psychiatrie ?",
    options: [
      "Le coaching thérapeutique est un acte médical",
      "La psychiatrie implique des traitements médicaux, alors que le coaching thérapeutique se base sur l'accompagnement",
      "Les deux sont identiques",
      "Le coaching thérapeutique est réservé aux enfants",
    ],
    correct: 1,
  },
  {
    id: 3,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quel est un objectif du coaching thérapeutique ?",
    options: [
      "Diagnostiquer des troubles mentaux",
      "Accompagner le client à dépasser ses blocages émotionnels",
      "Prescrire des médicaments",
      "Remplacer la thérapie",
    ],
    correct: 1,
  },
  {
    id: 4,
    theme: 'Psychologie & Troubles mentaux',
    question: "Un trouble mental est défini comme :",
    options: [
      "Un déséquilibre physique",
      "Un état affectant les pensées, émotions et comportements d'un individu",
      "Une faiblesse mentale",
      "Une maladie incurable",
    ],
    correct: 1,
  },
  {
    id: 5,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quel trouble est lié à l'impulsivité et à l'inattention ?",
    options: [
      "Trouble bipolaire",
      "Trouble anxieux généralisé",
      "TDAH (Trouble Déficit de l'Attention avec Hyperactivité)",
      "Trouble de la personnalité borderline",
    ],
    correct: 2,
  },
  {
    id: 6,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quelle technique est utilisée en coaching thérapeutique pour travailler sur les croyances limitantes ?",
    options: [
      "La prescription médicamenteuse",
      "Le reframing (recadrage)",
      "La psychanalyse",
      "L'hypnose clinique",
    ],
    correct: 1,
  },
  {
    id: 7,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quels sont les principaux signes d'un trouble anxieux ?",
    options: [
      "Excès d'énergie et euphorie",
      "Désintérêt total pour la vie",
      "Peur excessive, tension musculaire, pensées envahissantes",
      "Difficulté à mémoriser des informations",
    ],
    correct: 2,
  },
  {
    id: 8,
    theme: 'Psychologie & Troubles mentaux',
    question: "Qu'est-ce que la résilience en psychologie ?",
    options: [
      "Une faiblesse émotionnelle",
      "La capacité à surmonter les épreuves et rebondir",
      "Une forme de dépression",
      "Un trouble mental",
    ],
    correct: 1,
  },
  {
    id: 9,
    theme: 'Psychologie & Troubles mentaux',
    question: "Qu'est-ce qu'un traumatisme psychologique ?",
    options: [
      "Un événement ayant un impact émotionnel profond",
      "Une simple peur passagère",
      "Une réaction normale à un stress quotidien",
      "Une faiblesse mentale",
    ],
    correct: 0,
  },
  {
    id: 10,
    theme: 'Psychologie & Troubles mentaux',
    question: "Un traumatisme de l'enfance peut être causé par :",
    options: [
      "Le manque de sommeil",
      "La négligence, la maltraitance ou des événements stressants",
      "Une mauvaise alimentation",
      "Le climat familial agréable",
    ],
    correct: 1,
  },
  {
    id: 11,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quels sont les symptômes à court terme d'un traumatisme ?",
    options: [
      "Forte motivation",
      "Peur, anxiété, cauchemars",
      "Augmentation des capacités cognitives",
      "Développement d'une intelligence supérieure",
    ],
    correct: 1,
  },
  {
    id: 12,
    theme: 'Psychologie & Troubles mentaux',
    question: "Quel est un des premiers outils d'évaluation d'un traumatisme ?",
    options: [
      "L'entretien structuré",
      "L'évaluation sanguine",
      "L'IRM cérébral",
      "La prise de médicaments",
    ],
    correct: 0,
  },
  {
    id: 13,
    theme: 'Coaching thérapeutique',
    question: "Quelle est une stratégie pour aider un client ayant vécu un traumatisme ?",
    options: [
      "Ignorer son vécu",
      "Mettre en place un cadre sécurisant et rassurant",
      "Lui demander de l'oublier rapidement",
      "L'encourager à en parler en détail dès la première séance",
    ],
    correct: 1,
  },
  {
    id: 14,
    theme: 'Coaching thérapeutique',
    question: "Le coaching thérapeutique s'appuie sur :",
    options: [
      "Une approche purement analytique",
      "Une démarche intégrative prenant en compte les émotions et comportements",
      "Une méthode uniquement rationnelle",
      "Un cadre rigide et strict",
    ],
    correct: 1,
  },
  {
    id: 15,
    theme: 'Coaching thérapeutique',
    question: "Pourquoi est-il important de fixer des objectifs clairs en coaching thérapeutique ?",
    options: [
      "Pour accélérer la guérison",
      "Pour mesurer les progrès et structurer l'accompagnement",
      "Pour limiter la communication avec le client",
      "Pour imposer une méthode unique",
    ],
    correct: 1,
  },
  {
    id: 16,
    theme: 'Coaching thérapeutique',
    question: "Quel outil permet de suivre l'évolution émotionnelle d'un client ?",
    options: [
      "Une évaluation médicale",
      "Le journal des émotions",
      "Un test de QI",
      "L'étude des rêves",
    ],
    correct: 1,
  },
  {
    id: 17,
    theme: 'Coaching thérapeutique',
    question: "Pourquoi le storytelling est-il utilisé en coaching thérapeutique ?",
    options: [
      "Pour recontextualiser les événements passés et en tirer une leçon positive",
      "Pour enseigner des histoires aux clients",
      "Pour distraire les personnes",
      "Pour créer un récit fictif",
    ],
    correct: 0,
  },
  {
    id: 18,
    theme: 'Coaching thérapeutique',
    question: "Quelle méthode permet de développer la résilience ?",
    options: [
      "La reprogrammation positive et la gratitude",
      "La suppression des souvenirs négatifs",
      "L'exposition constante aux traumatismes",
      "L'isolement social",
    ],
    correct: 0,
  },
  {
    id: 19,
    theme: 'Approche Cognitive et Comportementale',
    question: "L'Approche Cognitive et Comportementale (ACC) repose sur :",
    options: [
      "L'interprétation des rêves",
      "L'interaction entre pensées, émotions et comportements",
      "Une exploration uniquement corporelle",
      "Une suppression des émotions",
    ],
    correct: 1,
  },
  {
    id: 20,
    theme: 'Approche Cognitive et Comportementale',
    question: "Un exemple de croyance limitante est :",
    options: [
      '"Je ne suis pas assez compétent"',
      '"Je peux progresser avec de l\'effort"',
      '"Les échecs sont une opportunité d\'apprentissage"',
      '"Je contrôle totalement mon destin"',
    ],
    correct: 0,
  },
  {
    id: 21,
    theme: 'Approche Cognitive et Comportementale',
    question: "Quel est l'objectif principal de l'ACC ?",
    options: [
      "Supprimer les émotions négatives",
      "Modifier les comportements sans toucher aux pensées",
      "Restructurer les schémas de pensée négatifs en croyances plus réalistes",
      "Encourager la passivité face aux situations difficiles",
    ],
    correct: 2,
  },
  {
    id: 22,
    theme: 'Approche Cognitive et Comportementale',
    question: "Qu'est-ce que la restructuration cognitive ?",
    options: [
      "Une technique de méditation",
      "Un processus de remplacement des pensées négatives par des pensées aidantes",
      "Une suppression des souvenirs douloureux",
      "Une analyse clinique du subconscient",
    ],
    correct: 1,
  },
  {
    id: 23,
    theme: 'Approche Cognitive et Comportementale',
    question: "Un comportement évitant peut être causé par :",
    options: [
      "Un excès de confiance",
      "Une peur de l'échec associée à des pensées automatiques négatives",
      "Une prise de risque excessive",
      "Un désir de confrontation",
    ],
    correct: 1,
  },
  {
    id: 24,
    theme: "Méthode d'Ancrage Positif (MAP)",
    question: "L'objectif de la MAP est :",
    options: [
      "L'effacement des souvenirs traumatiques",
      "L'ancrage d'états émotionnels positifs",
      "La suppression des pensées négatives",
      "L'évitement des émotions difficiles",
    ],
    correct: 1,
  },
  {
    id: 25,
    theme: "Méthode d'Ancrage Positif (MAP)",
    question: "Quelle est une des techniques utilisées en MAP ?",
    options: [
      "La visualisation guidée",
      "La prise de médicaments",
      "L'interprétation des rêves",
      "La confrontation forcée",
    ],
    correct: 0,
  },
  {
    id: 26,
    theme: "Méthode d'Ancrage Positif (MAP)",
    question: "Quel est l'intérêt de l'ancrage physique ?",
    options: [
      "Augmenter la peur face aux émotions",
      "Associer une émotion positive à un geste corporel répétitif",
      "Encourager le client à ignorer ses émotions",
      "Bloquer toute réaction émotionnelle",
    ],
    correct: 1,
  },
  {
    id: 27,
    theme: "Méthode d'Ancrage Positif (MAP)",
    question: "La respiration rythmée dans la MAP permet :",
    options: [
      "De modifier les souvenirs",
      "De créer une dissociation émotionnelle",
      "D'équilibrer le système nerveux et réduire le stress",
      "D'accélérer les battements cardiaques",
    ],
    correct: 2,
  },
  {
    id: 28,
    theme: "Méthode d'Ancrage Positif (MAP)",
    question: "L'effet principal d'un ancrage sensoriel est :",
    options: [
      "Stabiliser l'état émotionnel en s'appuyant sur les sens",
      "Rendre les émotions plus intenses",
      "Supprimer l'anxiété instantanément",
      "Faire disparaître toute émotion",
    ],
    correct: 0,
  },
  {
    id: 29,
    theme: 'Pratique du coaching thérapeutique',
    question: "Pourquoi est-il important de ne pas poser de diagnostic médical en coaching thérapeutique ?",
    options: [
      "Parce que le coaching est une forme de thérapie médicale",
      "Parce que seuls les psychologues et psychiatres sont habilités à le faire",
      "Parce que les diagnostics n'aident pas les clients",
      "Parce que tout le monde peut poser un diagnostic",
    ],
    correct: 1,
  },
  {
    id: 30,
    theme: 'Pratique du coaching thérapeutique',
    question: "Une croyance limitante issue d'un traumatisme peut être :",
    options: [
      '"Je peux surmonter toutes les épreuves"',
      '"Je ne suis pas digne d\'amour"',
      '"Les erreurs sont normales dans la vie"',
      '"J\'ai toujours le choix dans mes décisions"',
    ],
    correct: 1,
  },
  {
    id: 31,
    theme: 'Pratique du coaching thérapeutique',
    question: "Une technique efficace pour dépasser un blocage émotionnel est :",
    options: [
      "Éviter complètement le sujet",
      "Utiliser le storytelling thérapeutique pour reformuler son vécu",
      "Bloquer toute réaction émotionnelle",
      "Ne pas en parler du tout",
    ],
    correct: 1,
  },
  {
    id: 32,
    theme: 'Pratique du coaching thérapeutique',
    question: "L'objectif de la gestion des traumatismes en coaching thérapeutique est :",
    options: [
      "Diagnostiquer un trouble psychiatrique",
      "Aider le client à intégrer ses expériences passées sans en être prisonnier",
      "Éviter de parler du passé",
      "Forcer le client à revivre ses émotions négatives",
    ],
    correct: 1,
  },
  {
    id: 33,
    theme: 'Pratique du coaching thérapeutique',
    question: "Quelle technique est efficace pour activer le système nerveux parasympathique et calmer le stress ?",
    options: [
      "La respiration 4-2-6 (inspiration 4 sec, rétention 2 sec, expiration 6 sec)",
      "La suppression des émotions",
      "L'auto-critique",
      "L'isolement social",
    ],
    correct: 0,
  },
  {
    id: 34,
    theme: 'Pratique du coaching thérapeutique',
    question: "Quel exercice peut aider à réduire l'anxiété avant une prise de parole en public ?",
    options: [
      "Ne pas se préparer",
      "Focaliser sur ses peurs",
      "Pratiquer la visualisation et la respiration rythmée",
      "Éviter complètement l'événement",
    ],
    correct: 2,
  },
  {
    id: 35,
    theme: 'Pratique du coaching thérapeutique',
    question: "Quelle est une des premières étapes pour aider un client à modifier une croyance limitante ?",
    options: [
      "Ignorer son ressenti",
      "Identifier et analyser les schémas de pensée automatiques",
      "Lui dire qu'il doit arrêter d'y croire",
      "Lui donner une solution toute faite",
    ],
    correct: 1,
  },
  {
    id: 36,
    theme: 'Pratique du coaching thérapeutique',
    question: "Pourquoi la gestion des émotions est-elle essentielle en coaching thérapeutique ?",
    options: [
      "Parce que les émotions doivent être supprimées",
      "Parce qu'elles influencent les pensées et les comportements",
      "Parce qu'elles empêchent de réussir",
      "Parce qu'elles ne jouent aucun rôle dans le coaching",
    ],
    correct: 1,
  },
  {
    id: 37,
    theme: 'Pratique du coaching thérapeutique',
    question: "Quelle technique permet de renforcer la résilience face aux épreuves de la vie ?",
    options: [
      "L'isolement social",
      "La reprogrammation cognitive et les ancrages positifs",
      "L'évitement des émotions négatives",
      "L'analyse rationnelle uniquement",
    ],
    correct: 1,
  },
  {
    id: 38,
    theme: 'Pratique du coaching thérapeutique',
    question: "Pourquoi est-il important d'adapter les techniques de coaching au client ?",
    options: [
      "Pour utiliser les mêmes méthodes pour tout le monde",
      "Parce que chaque individu a une histoire, des besoins et des objectifs uniques",
      "Parce que la flexibilité est inutile en coaching",
      "Pour limiter le nombre de séances",
    ],
    correct: 1,
  },
  {
    id: 39,
    theme: 'Pratique du coaching thérapeutique',
    question: "Quel est un élément clé pour garantir l'efficacité d'une séance de coaching thérapeutique ?",
    options: [
      "Laisser le client tout résoudre seul",
      "Lui donner des réponses toutes faites",
      "L'accompagner dans l'exploration de ses pensées et émotions avec des outils adaptés",
      "Lui imposer une méthode stricte",
    ],
    correct: 2,
  },
  {
    id: 40,
    theme: 'Pratique du coaching thérapeutique',
    question: "Quel est un indicateur que le coaching thérapeutique fonctionne bien pour un client ?",
    options: [
      "Il n'a plus aucune émotion négative",
      "Il devient plus autonome dans la gestion de ses pensées et émotions",
      "Il dépend totalement du coach pour aller mieux",
      "Il évite désormais toutes les situations stressantes",
    ],
    correct: 1,
  },
]

export function getQuizN2Score(answers: Record<number, number>): number {
  return QUIZ_N2_QUESTIONS.filter(q => answers[q.id] === q.correct).length
}

export function getQuizN2Level(score: number): { label: string; color: string; bg: string } {
  const pct = (score / QUIZ_N2_QUESTIONS.length) * 100
  if (pct >= 90) return { label: 'Excellent', color: '#166534', bg: '#dcfce7' }
  if (pct >= 70) return { label: 'Bien', color: '#1e40af', bg: '#dbeafe' }
  if (pct >= 50) return { label: 'Passable', color: '#92400e', bg: '#fef3c7' }
  return { label: 'À améliorer', color: '#991b1b', bg: '#fee2e2' }
}
