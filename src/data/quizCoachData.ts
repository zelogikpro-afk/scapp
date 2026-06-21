export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correct: number // index 0-3
  theme: string
}

export const QUIZ_THEMES = [
  'Fondamentaux du coaching',
  'Communication & écoute',
  'Techniques & outils',
  'Gestion des situations',
  'Reprogrammation & lois',
  'Life Book & séance',
]

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    theme: 'Fondamentaux du coaching',
    question: "Quel est le principal rôle d'un coach de vie ?",
    options: [
      "Aider à résoudre les problèmes psychologiques",
      "Accompagner le client vers ses objectifs",
      "Donner des conseils professionnels",
      "Analyser le comportement des clients",
    ],
    correct: 1,
  },
  {
    id: 2,
    theme: 'Fondamentaux du coaching',
    question: "Quelle est la première étape dans un processus de coaching ?",
    options: [
      "Établir une relation de confiance",
      "Résoudre les problèmes personnels du client",
      "Fixer des objectifs inatteignables",
      "Donner des solutions immédiates",
    ],
    correct: 0,
  },
  {
    id: 3,
    theme: 'Fondamentaux du coaching',
    question: "Quels sont les trois piliers fondamentaux du coaching ?",
    options: [
      "Confiance, directives, contrôle",
      "Motivation, communication, évaluation",
      "Écoute active, questionnement, accompagnement",
      "Analyse, formation, résultats",
    ],
    correct: 2,
  },
  {
    id: 4,
    theme: 'Communication & écoute',
    question: "Qu'est-ce que l'écoute active implique ?",
    options: [
      "Porter attention sans interruption au client",
      "Donner des conseils pendant que le client parle",
      "Reformuler tout ce que dit le client",
      "Parler autant que le client",
    ],
    correct: 0,
  },
  {
    id: 5,
    theme: 'Communication & écoute',
    question: "Quelle est une technique clé pour établir un bon rapport avec le client ?",
    options: [
      "Poser des questions fermées",
      "Utiliser des techniques d'écoute active",
      "Montrer un langage corporel neutre",
      "Donner des conseils directement",
    ],
    correct: 1,
  },
  {
    id: 6,
    theme: 'Communication & écoute',
    question: "Quel type de question est idéal pour explorer en profondeur le problème d'un client ?",
    options: [
      "Questions fermées",
      "Questions ouvertes",
      "Questions à choix multiple",
      "Questions suggestives",
    ],
    correct: 1,
  },
  {
    id: 7,
    theme: 'Communication & écoute',
    question: "Qu'est-ce qu'une reformulation en coaching ?",
    options: [
      "Répéter ce que le client a dit dans ses propres mots",
      "Répéter les mots exacts du client",
      "Donner une interprétation de ce que dit le client",
      "Apporter une solution immédiate au problème",
    ],
    correct: 0,
  },
  {
    id: 8,
    theme: 'Communication & écoute',
    question: "Comment le coach doit-il réagir lorsqu'un client devient émotif ?",
    options: [
      "Interrompre le client",
      "Accueillir ses émotions et le laisser s'exprimer",
      "Changer rapidement de sujet",
      "Proposer une solution rapide",
    ],
    correct: 1,
  },
  {
    id: 9,
    theme: 'Communication & écoute',
    question: "Lequel des comportements suivants est un obstacle à une communication efficace ?",
    options: [
      "Interrompre régulièrement le client",
      "Encourager le client à parler de ses sentiments",
      "Reformuler les propos du client",
      "Poser des questions ouvertes",
    ],
    correct: 0,
  },
  {
    id: 10,
    theme: 'Techniques & outils',
    question: "Quelle est la technique la plus efficace pour aider un client à clarifier ses idées ?",
    options: [
      "Le questionnement puissant",
      "La prise de notes détaillée",
      "La lecture à haute voix",
      "Le feedback direct",
    ],
    correct: 0,
  },
  {
    id: 11,
    theme: 'Techniques & outils',
    question: "Lors d'une session de coaching, quel est l'élément essentiel pour que le client s'engage activement ?",
    options: [
      "Fournir des réponses au client",
      "Laisser le client trouver ses propres solutions",
      "Dire au client quoi faire",
      "Se concentrer uniquement sur ses échecs",
    ],
    correct: 1,
  },
  {
    id: 12,
    theme: 'Techniques & outils',
    question: "Qu'est-ce qui permet d'évaluer le progrès d'un client au cours du coaching ?",
    options: [
      "Des objectifs spécifiques et mesurables",
      "Des discussions ouvertes sans objectifs précis",
      "Des conseils fréquents du coach",
      "Des évaluations hebdomadaires fixes",
    ],
    correct: 0,
  },
  {
    id: 13,
    theme: 'Techniques & outils',
    question: "Comment un coach peut-il encourager la responsabilisation du client ?",
    options: [
      "En lui donnant des actions concrètes à réaliser entre les sessions",
      "En surveillant constamment ses progrès",
      "En décidant pour le client",
      "En lui donnant des solutions toutes faites",
    ],
    correct: 0,
  },
  {
    id: 14,
    theme: 'Techniques & outils',
    question: "Qu'est-ce qu'un feedback constructif ?",
    options: [
      "Un retour d'information basé sur l'observation et sans jugement",
      "Des critiques pour corriger le comportement",
      "Des suggestions pour changer immédiatement",
      "Des conseils stricts sur les actions à prendre",
    ],
    correct: 0,
  },
  {
    id: 15,
    theme: 'Techniques & outils',
    question: "Lequel des aspects suivants est primordial dans la réussite d'un entretien de coaching ?",
    options: [
      "Établir une bonne connexion dès le début",
      "Offrir des conseils pratiques dès la première session",
      "Analyser le passé du client en détail",
      "Ne poser que des questions fermées",
    ],
    correct: 0,
  },
  {
    id: 16,
    theme: 'Gestion des situations',
    question: "Lors d'un exercice, un client n'a pas respecté ses engagements entre les sessions. Comment devriez-vous réagir ?",
    options: [
      "Explorer les raisons pour lesquelles il n'a pas agi et ajuster le plan d'action ensemble",
      "Lui dire qu'il doit faire plus d'efforts",
      "Ignorer le problème et passer à autre chose",
      "Fixer des objectifs plus faciles",
    ],
    correct: 0,
  },
  {
    id: 17,
    theme: 'Gestion des situations',
    question: "Vous avez donné à un client un exercice sur la gestion du stress, mais il semble toujours très tendu. Quelle serait la meilleure approche ?",
    options: [
      "Lui donner un autre exercice",
      "Explorer les obstacles à l'application de l'exercice et proposer un ajustement",
      "Passer à un autre sujet",
      "Lui conseiller de consulter un thérapeute",
    ],
    correct: 1,
  },
  {
    id: 18,
    theme: 'Gestion des situations',
    question: "Un client exprime des croyances limitantes pendant un exercice de réflexion sur ses compétences. Comment l'aider ?",
    options: [
      "Explorer ces croyances avec des questions ouvertes et les remettre en question",
      "Lui proposer des affirmations positives",
      "Lui dire d'ignorer ses pensées limitantes",
      "Passer à un autre exercice",
    ],
    correct: 0,
  },
  {
    id: 19,
    theme: 'Gestion des situations',
    question: "Lors d'un exercice sur les objectifs SMART, un client a du mal à définir ses priorités. Quelle est la bonne approche ?",
    options: [
      "Lui fixer des priorités vous-même",
      "L'aider à clarifier ce qui est le plus important pour lui grâce à des questions ouvertes",
      "Lui demander de choisir rapidement",
      "Proposer de laisser de côté cet objectif",
    ],
    correct: 1,
  },
  {
    id: 20,
    theme: 'Gestion des situations',
    question: "Un client a des difficultés à appliquer les techniques apprises lors des exercices pratiques. Comment l'accompagner ?",
    options: [
      "Lui proposer de réessayer seul",
      "Réviser les techniques avec lui et identifier les blocages éventuels",
      "Lui dire qu'il doit faire plus d'efforts",
      "L'encourager à passer à un autre exercice plus simple",
    ],
    correct: 1,
  },
  {
    id: 21,
    theme: 'Gestion des situations',
    question: "Lors d'un exercice sur la gestion des émotions, un client devient soudainement émotif. Quelle est la meilleure réaction ?",
    options: [
      "Ignorer l'émotion et continuer l'exercice",
      "Accueillir son émotion et lui permettre de s'exprimer avant de continuer l'exercice",
      "Lui proposer une solution rapide pour son problème émotionnel",
      "Terminer l'exercice sans en discuter",
    ],
    correct: 1,
  },
  {
    id: 22,
    theme: 'Gestion des situations',
    question: "Un client se sent bloqué sur un exercice d'auto-réflexion. Que pouvez-vous faire pour l'aider ?",
    options: [
      "Lui demander de passer à un autre exercice",
      "Poser des questions pour l'aider à explorer pourquoi il se sent bloqué",
      "Lui donner un autre exercice plus facile",
      "Le laisser gérer cela seul",
    ],
    correct: 1,
  },
  {
    id: 23,
    theme: 'Gestion des situations',
    question: "Vous avez donné un exercice de priorisation des tâches, mais le client semble submergé. Comment l'accompagner ?",
    options: [
      "Lui demander d'aller plus vite",
      "Réviser l'exercice avec lui pour simplifier et structurer ses tâches de manière plus réaliste",
      "Lui proposer d'abandonner certaines tâches",
      "Lui dire de persévérer sans ajustement",
    ],
    correct: 1,
  },
  {
    id: 24,
    theme: 'Gestion des situations',
    question: "Lors d'un exercice sur l'identification des forces, un client se dévalorise constamment. Comment gérer cette situation ?",
    options: [
      "Lui faire remarquer ses forces et l'aider à les valoriser à travers des exemples concrets",
      "Passer à un autre exercice",
      "Lui dire d'arrêter de se dévaloriser",
      "Ignorer ce comportement",
    ],
    correct: 0,
  },
  {
    id: 25,
    theme: 'Reprogrammation & lois',
    question: "Qu'est-ce que la reprogrammation du cerveau en coaching ?",
    options: [
      "Un processus visant à modifier les schémas de pensée et croyances limitantes pour créer des comportements plus positifs",
      "Une méthode pour diagnostiquer les problèmes psychologiques",
      "Un traitement médical pour les troubles émotionnels",
      "Une technique de relaxation profonde",
    ],
    correct: 0,
  },
  {
    id: 26,
    theme: 'Reprogrammation & lois',
    question: "Quelle technique de coaching peut être utilisée pour reprogrammer les croyances limitantes d'un client ?",
    options: [
      "La thérapie cognitive",
      "Le recadrage et le questionnement des croyances du client",
      "La visualisation immédiate des objectifs",
      "L'analyse des rêves",
    ],
    correct: 1,
  },
  {
    id: 27,
    theme: 'Reprogrammation & lois',
    question: "Dans le cadre de la reprogrammation du cerveau, quel est le rôle des affirmations positives ?",
    options: [
      "Elles aident à remplacer les pensées négatives par des croyances plus constructives",
      "Elles sont une manière de donner des conseils directs",
      "Elles servent à créer des objectifs financiers",
      "Elles sont utilisées pour analyser les émotions passées",
    ],
    correct: 0,
  },
  {
    id: 28,
    theme: 'Reprogrammation & lois',
    question: "Lors d'une session de reprogrammation du cerveau, qu'est-ce qu'un client doit faire pour commencer à modifier ses schémas de pensée ?",
    options: [
      "Se concentrer sur ses échecs passés",
      "Prendre conscience de ses pensées négatives et les remplacer par des pensées positives",
      "Fixer des objectifs irréalistes",
      "Ignorer ses croyances limitantes",
    ],
    correct: 1,
  },
  {
    id: 29,
    theme: 'Reprogrammation & lois',
    question: 'Comment un coach peut-il aider un client à reprogrammer son cerveau face à une croyance limitante comme "je ne suis pas capable" ?',
    options: [
      "Lui demander de se concentrer sur ses erreurs passées",
      "L'aider à identifier l'origine de cette croyance et à reformuler une nouvelle pensée plus constructive",
      "L'encourager à ignorer cette croyance sans discuter",
      "Lui donner des exemples de réussite d'autres clients",
    ],
    correct: 1,
  },
  {
    id: 30,
    theme: 'Reprogrammation & lois',
    question: "Quelle loi de l'univers est associée à l'idée que ce que vous émettez vous revient ?",
    options: [
      "La loi de la vibration",
      "La loi de cause à effet",
      "La loi de l'attraction",
      "La loi du genre",
    ],
    correct: 1,
  },
  {
    id: 31,
    theme: 'Reprogrammation & lois',
    question: "Laquelle des lois de l'univers est basée sur l'idée que tout est en constante évolution ?",
    options: [
      "La loi de la polarité",
      "La loi de la compensation",
      "La loi du rythme",
      "La loi de l'attraction",
    ],
    correct: 2,
  },
  {
    id: 32,
    theme: 'Reprogrammation & lois',
    question: "Quelle loi de l'univers met l'accent sur la connexion entre tous les êtres et toutes les choses ?",
    options: [
      "La loi de l'unité divine",
      "La loi de la relativité",
      "La loi de l'attraction",
      "La loi de la compensation",
    ],
    correct: 0,
  },
  {
    id: 33,
    theme: 'Life Book & séance',
    question: "Qu'est-ce que le Life Book dans un processus de coaching ?",
    options: [
      "Un guide pour fixer des objectifs financiers",
      "Un outil permettant de faire un bilan global des différentes dimensions de la vie du client (personnelle, professionnelle, spirituelle, etc.)",
      "Une technique pour analyser les émotions",
      "Un plan d'action pour améliorer la communication",
    ],
    correct: 1,
  },
  {
    id: 34,
    theme: 'Life Book & séance',
    question: "Quel est l'objectif principal du Life Book en coaching ?",
    options: [
      "Établir des stratégies financières",
      "Aider le client à avoir une vision holistique de sa vie et à fixer des objectifs dans chaque domaine",
      "Créer un programme de santé",
      "Résoudre les problèmes relationnels",
    ],
    correct: 1,
  },
  {
    id: 35,
    theme: 'Life Book & séance',
    question: "Dans quel cas utiliseriez-vous le Life Book ?",
    options: [
      "Lors d'une crise professionnelle",
      "Pour explorer les différentes dimensions de la vie d'un client et établir des objectifs à long terme",
      "Pour la gestion du temps",
      "Lors d'un désaccord familial",
    ],
    correct: 1,
  },
  {
    id: 36,
    theme: 'Life Book & séance',
    question: "Le Life Book peut être utilisé pour explorer quelles dimensions de la vie d'un client ?",
    options: [
      "La santé, les relations, la carrière, la spiritualité, le développement personnel, etc.",
      "Les dimensions en relation avec l'objectif du client",
      "Les aspects matériels de la vie",
      "Les aspects émotionnels uniquement",
    ],
    correct: 0,
  },
  {
    id: 37,
    theme: 'Life Book & séance',
    question: "Quelle est la première étape dans une séance de coaching ?",
    options: [
      "Fixer des objectifs",
      "Établir une relation de confiance avec le client",
      "Proposer des solutions immédiates",
      "Analyser les erreurs du passé",
    ],
    correct: 1,
  },
  {
    id: 38,
    theme: 'Life Book & séance',
    question: "À quel moment de la séance de coaching le coach doit-il clarifier les objectifs du client ?",
    options: [
      "À la fin de la séance",
      "Au début, après avoir établi la relation de confiance",
      "Lors du feedback final",
      "Avant la séance suivante",
    ],
    correct: 1,
  },
  {
    id: 39,
    theme: 'Life Book & séance',
    question: "Quel est le rôle du feedback en fin de séance de coaching ?",
    options: [
      "Donner des instructions précises pour l'avenir",
      "Évaluer les progrès du client et ajuster les actions à entreprendre",
      "Encourager le client à faire plus d'efforts",
      "Proposer un bilan psychologique",
    ],
    correct: 1,
  },
  {
    id: 40,
    theme: 'Life Book & séance',
    question: "Quelle étape est essentielle pour assurer l'autonomie du client après la séance ?",
    options: [
      "La responsabilisation du client avec des actions concrètes à réaliser entre les sessions",
      "Donner des conseils pratiques pour le futur",
      "Fixer de nouveaux objectifs",
      "Proposer un suivi thérapeutique",
    ],
    correct: 0,
  },
]

export function getQuizScore(answers: Record<number, number>): number {
  return QUIZ_QUESTIONS.filter(q => answers[q.id] === q.correct).length
}

export function getQuizLevel(score: number): { label: string; color: string; bg: string } {
  const pct = (score / QUIZ_QUESTIONS.length) * 100
  if (pct >= 90) return { label: 'Excellent', color: '#166534', bg: '#dcfce7' }
  if (pct >= 70) return { label: 'Bien', color: '#1e40af', bg: '#dbeafe' }
  if (pct >= 50) return { label: 'Passable', color: '#92400e', bg: '#fef3c7' }
  return { label: 'À améliorer', color: '#991b1b', bg: '#fee2e2' }
}
