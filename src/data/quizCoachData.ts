export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correct: number // index 0-3
  theme: string
}

export const QUIZ_THEMES = [
  'Développement Personnel',
  'Coaching de Vie',
]

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── DÉVELOPPEMENT PERSONNEL (Q1–20) ──────────────────────────────────────
  {
    id: 1,
    theme: 'Développement Personnel',
    question: "Le développement personnel est :",
    options: [
      "Une démarche volontaire et un processus continu d'amélioration",
      "Une méthode uniquement destinée à atteindre des objectifs professionnels",
      "Une technique ponctuelle utilisée uniquement en période de difficulté",
      "Un ensemble de tests permettant de déterminer la personnalité",
    ],
    correct: 0,
  },
  {
    id: 2,
    theme: 'Développement Personnel',
    question: "Lequel des éléments suivants fait partie des cinq piliers du développement personnel ?",
    options: [
      "La gestion financière",
      "La connaissance de soi",
      "La gestion de projet",
      "Le personal branding",
    ],
    correct: 1,
  },
  {
    id: 3,
    theme: 'Développement Personnel',
    question: "Quel outil permet d'évaluer le niveau de satisfaction dans différents domaines de vie sur une échelle de 1 à 10 ?",
    options: [
      "Le Life Book",
      "Le Test Compass",
      "La Roue de la Vie",
      "La matrice d'Eisenhower",
    ],
    correct: 2,
  },
  {
    id: 4,
    theme: 'Développement Personnel',
    question: "Laquelle de ces propositions fait partie des composantes de l'identité ?",
    options: [
      "Les valeurs",
      "Le chiffre d'affaires",
      "La productivité",
      "La popularité",
    ],
    correct: 0,
  },
  {
    id: 5,
    theme: 'Développement Personnel',
    question: "Quel type de question ne peut pas être répondu simplement par « oui » ou « non » ?",
    options: [
      "La question fermée",
      "La question ouverte",
      "La question de confirmation",
      "La question de contrôle",
    ],
    correct: 1,
  },
  {
    id: 6,
    theme: 'Développement Personnel',
    question: "Quel est l'objectif principal d'une question de clarification ?",
    options: [
      "Donner directement une solution au client",
      "Dissiper une ambiguïté ou une confusion",
      "Classer les tâches selon leur urgence",
      "Mesurer le niveau d'intelligence émotionnelle",
    ],
    correct: 1,
  },
  {
    id: 7,
    theme: 'Développement Personnel',
    question: "Qu'est-ce que la plasticité cérébrale ?",
    options: [
      "La capacité du cerveau à se modifier et à se réorganiser",
      "La capacité à supprimer définitivement toutes les émotions",
      "La capacité à mémoriser uniquement les informations positives",
      "La capacité à éviter toute modification des habitudes",
    ],
    correct: 0,
  },
  {
    id: 8,
    theme: 'Développement Personnel',
    question: "Dans le modèle des cercles de contrôle, d'influence et de préoccupation, lequel regroupe ce sur quoi une personne possède un pouvoir direct ?",
    options: [
      "Le cercle de préoccupation",
      "Le cercle d'influence",
      "Le cercle de contrôle",
      "Le cercle extérieur",
    ],
    correct: 2,
  },
  {
    id: 9,
    theme: 'Développement Personnel',
    question: "Lequel de ces éléments fait partie des cinq composantes de l'intelligence émotionnelle ?",
    options: [
      "La conscience de soi",
      "La gestion financière",
      "La créativité artistique",
      "La vitesse de décision",
    ],
    correct: 0,
  },
  {
    id: 10,
    theme: 'Développement Personnel',
    question: "Dans le coaching, que peut signaler la colère ?",
    options: [
      "Qu'une situation est nécessairement positive",
      "Qu'une situation doit toujours être évitée",
      "Qu'une injustice ou une frustration peut nécessiter un changement",
      "Qu'une personne ne possède aucune émotion",
    ],
    correct: 2,
  },
  {
    id: 11,
    theme: 'Développement Personnel',
    question: "Qu'est-ce que le cadre de référence en communication ?",
    options: [
      "L'ensemble des règles imposées par le coach",
      "L'ensemble des expériences, croyances et valeurs qui influencent la perception",
      "La liste des objectifs professionnels du client",
      "Le protocole utilisé pour mesurer le stress",
    ],
    correct: 1,
  },
  {
    id: 12,
    theme: 'Développement Personnel',
    question: "Quelle est la structure de la prise de parole en public travaillée dans la formation ?",
    options: [
      "Introduction, questionnaire, conclusion",
      "Accroche, développement, conclusion inspirante",
      "Présentation, test, correction",
      "Question, réponse, débat",
    ],
    correct: 1,
  },
  {
    id: 13,
    theme: 'Développement Personnel',
    question: "Laquelle des propositions correspond à la Loi de la Cause et de l'Effet ?",
    options: [
      "Chaque action a une conséquence",
      "Tout est uniquement déterminé par le hasard",
      "Toutes les personnes ont exactement la même perception",
      "Les objectifs ne nécessitent aucune action",
    ],
    correct: 0,
  },
  {
    id: 14,
    theme: 'Développement Personnel',
    question: "Quelle succession correspond aux grandes étapes de construction du Life Book ?",
    options: [
      "Valeurs → Vision → Objectifs → Plan d'action → Suivi et évaluation",
      "Stress → Émotions → Communication → Test → Diagnostic",
      "Personnalité → Recrutement → Budget → Marketing → Vente",
      "Observation → Diagnostic → Recrutement → Formation → Certification",
    ],
    correct: 0,
  },
  {
    id: 15,
    theme: 'Développement Personnel',
    question: "Quelle différence entre l'eustress et le distress est enseignée dans la formation ?",
    options: [
      "L'eustress est positif et le distress est négatif",
      "L'eustress est toujours nuisible et le distress toujours motivant",
      "Les deux termes désignent exactement le même phénomène",
      "L'eustress concerne uniquement les émotions et le distress uniquement les pensées",
    ],
    correct: 0,
  },
  {
    id: 16,
    theme: 'Développement Personnel',
    question: "Dans la matrice d'Eisenhower, que faut-il faire d'une tâche importante mais non urgente ?",
    options: [
      "L'éliminer",
      "La déléguer systématiquement",
      "La planifier",
      "La faire immédiatement",
    ],
    correct: 2,
  },
  {
    id: 17,
    theme: 'Développement Personnel',
    question: "Quel test est basé sur quatre axes : Dominance, Influence, Stabilité et Conformité ?",
    options: [
      "MBTI",
      "DISC",
      "Big Five",
      "Test des valeurs",
    ],
    correct: 1,
  },
  {
    id: 18,
    theme: 'Développement Personnel',
    question: "Combien de dimensions sont prises en compte dans le Quotient du Succès ?",
    options: [
      "5 dimensions",
      "10 dimensions",
      "15 dimensions",
      "20 dimensions",
    ],
    correct: 2,
  },
  {
    id: 19,
    theme: 'Développement Personnel',
    question: "Quelle précaution éthique est essentielle lors de l'utilisation d'un test de personnalité en coaching ?",
    options: [
      "Présenter le résultat comme une vérité définitive sur la personne",
      "Obtenir le consentement éclairé du client",
      "Communiquer systématiquement les résultats à l'entourage du client",
      "Utiliser le résultat du test comme unique base du coaching",
    ],
    correct: 1,
  },
  {
    id: 20,
    theme: 'Développement Personnel',
    question: "Quelle technique de gestion du stress consiste à classer les tâches selon leur importance et leur urgence ?",
    options: [
      "La visualisation positive",
      "La respiration diaphragmatique",
      "La matrice d'Eisenhower",
      "L'ancrage émotionnel",
    ],
    correct: 2,
  },

  // ── COACHING DE VIE (Q21–40) ──────────────────────────────────────────────
  {
    id: 21,
    theme: 'Coaching de Vie',
    question: "Quelle est la principale caractéristique de la maïeutique de Socrate ?",
    options: [
      "Donner directement une solution au problème",
      "Faire émerger les propres réponses de la personne par le questionnement",
      "Analyser uniquement les expériences passées",
      "Établir un diagnostic médical",
    ],
    correct: 1,
  },
  {
    id: 22,
    theme: 'Coaching de Vie',
    question: "Dans le modèle GROW, que signifie la lettre R ?",
    options: [
      "Resources",
      "Reality",
      "Results",
      "Response",
    ],
    correct: 1,
  },
  {
    id: 23,
    theme: 'Coaching de Vie',
    question: "Quel est le rôle principal du coach dans une posture professionnelle ?",
    options: [
      "Décider à la place du coaché",
      "Imposer une méthode identique à chaque personne",
      "Accompagner et faciliter le changement",
      "Remplacer les professionnels de santé",
    ],
    correct: 2,
  },
  {
    id: 24,
    theme: 'Coaching de Vie',
    question: "Quel principe déontologique impose au coach de reconnaître les limites de son intervention ?",
    options: [
      "Confidentialité",
      "Respect du champ de compétence",
      "Développement professionnel continu",
      "Équité et non-discrimination",
    ],
    correct: 1,
  },
  {
    id: 25,
    theme: 'Coaching de Vie',
    question: "Sur quoi le coaching orienté solutions concentre-t-il prioritairement l'attention ?",
    options: [
      "Les erreurs passées uniquement",
      "Les forces, les ressources et les solutions",
      "Les problèmes sans recherche de solutions",
      "Le diagnostic des difficultés",
    ],
    correct: 1,
  },
  {
    id: 26,
    theme: 'Coaching de Vie',
    question: "Quelle approche considère la personne comme faisant partie de plusieurs systèmes et environnements ?",
    options: [
      "Coaching analytique",
      "Coaching émotionnel",
      "Coaching systémique",
      "Coaching transformatif",
    ],
    correct: 2,
  },
  {
    id: 27,
    theme: 'Coaching de Vie',
    question: "Quelle affirmation décrit correctement une croyance ?",
    options: [
      "Une vérité objective qui ne peut jamais évoluer",
      "Une conviction considérée comme vraie",
      "Une émotion temporaire",
      "Un comportement automatique",
    ],
    correct: 1,
  },
  {
    id: 28,
    theme: 'Coaching de Vie',
    question: "Quelle question permet principalement d'explorer les valeurs d'une personne ?",
    options: [
      "Quel est mon diagnostic ?",
      "Quelle sera ma prochaine émotion ?",
      "Qu'est-ce qui est important pour moi ?",
      "Quel comportement dois-je adopter ?",
    ],
    correct: 2,
  },
  {
    id: 29,
    theme: 'Coaching de Vie',
    question: "Quelle est l'une des fonctions principales des émotions ?",
    options: [
      "Supprimer les besoins",
      "Informer sur les besoins, les valeurs ou les limites",
      "Garantir que toutes les décisions sont rationnelles",
      "Remplacer les comportements",
    ],
    correct: 1,
  },
  {
    id: 30,
    theme: 'Coaching de Vie',
    question: "Quelle affirmation distingue correctement une pensée d'un fait ?",
    options: [
      "Une pensée est toujours une preuve objective",
      "Un fait dépend toujours de l'interprétation",
      "Une pensée n'est pas nécessairement un fait",
      "Un fait est toujours une émotion",
    ],
    correct: 2,
  },
  {
    id: 31,
    theme: 'Coaching de Vie',
    question: "Quel enchaînement correspond au processus présenté pour la formation d'une habitude ?",
    options: [
      "Émotion → Valeur → Identité → Habitude",
      "Situation → Pensée → Émotion → Comportement → Répétition → Habitude",
      "Identité → Habitude → Pensée → Situation",
      "Besoin → Valeur → Habitude → Situation",
    ],
    correct: 1,
  },
  {
    id: 32,
    theme: 'Coaching de Vie',
    question: "Pourquoi un comportement limitant peut-il persister malgré ses conséquences négatives ?",
    options: [
      "Parce qu'il n'a aucune fonction",
      "Parce qu'il peut procurer un bénéfice secondaire",
      "Parce qu'il est toujours rationnel",
      "Parce qu'il constitue toujours une valeur",
    ],
    correct: 1,
  },
  {
    id: 33,
    theme: 'Coaching de Vie',
    question: "Que peut révéler un conflit interne ?",
    options: [
      "Une opposition entre deux besoins, valeurs, croyances ou objectifs",
      "Uniquement un manque de motivation",
      "Uniquement une difficulté extérieure",
      "Une absence totale de besoins",
    ],
    correct: 0,
  },
  {
    id: 34,
    theme: 'Coaching de Vie',
    question: "Dans l'approche Success Compass, que représente un nœud ?",
    options: [
      "Une simple émotion isolée",
      "Un ensemble de mécanismes liés entre eux",
      "Un objectif professionnel",
      "Une technique de communication",
    ],
    correct: 1,
  },
  {
    id: 35,
    theme: 'Coaching de Vie',
    question: "Quels sont les deux principes fondamentaux de l'ICA ?",
    options: [
      "Diagnostic et traitement",
      "Adaptation et intégration",
      "Motivation et compétition",
      "Analyse et prescription",
    ],
    correct: 1,
  },
  {
    id: 36,
    theme: 'Coaching de Vie',
    question: "Quelle est la progression centrale du modèle Success Compass ?",
    options: [
      "Réussir → Se connaître → Intégrer",
      "Intégrer → Réussir → Se connaître",
      "Se connaître → Intégrer → Réussir",
      "Agir → Réussir → Comprendre",
    ],
    correct: 2,
  },
  {
    id: 37,
    theme: 'Coaching de Vie',
    question: "Quelle étape vient immédiatement après le dénouement dans les 14 étapes de l'intégration ?",
    options: [
      "Confiance",
      "Cohérence intérieure",
      "Résilience",
      "Reconstruction",
    ],
    correct: 1,
  },
  {
    id: 38,
    theme: 'Coaching de Vie',
    question: "Que signifie l'acceptation dans le processus d'intégration ?",
    options: [
      "Approuver tout ce qui s'est produit",
      "Se résigner à une situation",
      "Reconnaître la réalité telle qu'elle est",
      "Renoncer à toute action",
    ],
    correct: 2,
  },
  {
    id: 39,
    theme: 'Coaching de Vie',
    question: "Quelle est la fonction du maintien dans le processus de réussite ?",
    options: [
      "Remplacer l'objectif initial",
      "Consolider les nouveaux comportements et préserver les acquis",
      "Revenir aux anciens comportements",
      "Éviter toute nouvelle adaptation",
    ],
    correct: 1,
  },
  {
    id: 40,
    theme: 'Coaching de Vie',
    question: "Quel est l'objectif de l'automatisation dans le modèle présenté ?",
    options: [
      "Rendre les nouveaux comportements naturels et intégrés au quotidien",
      "Supprimer toute capacité d'adaptation",
      "Revenir aux anciens automatismes",
      "Remplacer les objectifs par des habitudes",
    ],
    correct: 0,
  },
]

export function getQuizScore(answers: Record<number, number>): number {
  return QUIZ_QUESTIONS.filter(q => answers[q.id] === q.correct).length
}
