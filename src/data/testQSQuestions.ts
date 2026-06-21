export type QSPilier =
  | 'ie' | 'communication' | 'strategie' | 'discipline'
  | 'branding' | 'temps' | 'stress' | 'leadership'
  | 'creativite' | 'vision' | 'risque' | 'autonomie' | 'ethique'

export type QSLevel = 'forte' | 'moyenne' | 'faible'

export interface QSQuestion {
  id: number
  pilier: QSPilier
  text: string
}

export interface QSLevelContent {
  summary: string
  description: string
  planTitle: string
  plan: string[]
  exercice: string
}

export interface QSPilierInfo {
  key: QSPilier
  label: string
  maxScore: number   // 3 × nbQuestions
  forte: QSLevelContent
  moyenne: QSLevelContent
  faible: QSLevelContent
}

// ── SCALE ──────────────────────────────────────────────────────────────────────
export const QS_ANSWERS = [
  { value: 3, label: 'Toujours' },
  { value: 2, label: 'Parfois' },
  { value: 1, label: 'Rarement' },
] as const

// ── QUESTIONS (30 total) ───────────────────────────────────────────────────────
export const QS_QUESTIONS: QSQuestion[] = [
  // Intelligence Émotionnelle (4 questions → max 12)
  { id: 1,  pilier: 'ie',            text: "Parvenez-vous à gérer calmement vos émotions dans des situations stressantes ?" },
  { id: 2,  pilier: 'ie',            text: "Êtes-vous capable de comprendre les émotions des autres dans une situation professionnelle ?" },
  { id: 3,  pilier: 'ie',            text: "Êtes-vous capable de rebondir rapidement après un échec ?" },
  { id: 4,  pilier: 'ie',            text: "Voyez-vous les défis comme des opportunités d'apprentissage ?" },
  // Communication (2 questions → max 6)
  { id: 5,  pilier: 'communication', text: "Vous exprimez-vous de manière claire et compréhensible dans vos échanges ?" },
  { id: 6,  pilier: 'communication', text: "Êtes-vous à l'aise pour parler en public ou lors de réunions importantes ?" },
  // Pensée Stratégique & Adaptabilité (4 questions → max 12)
  { id: 7,  pilier: 'strategie',     text: "Planifiez-vous vos actions avec une vision à long terme ?" },
  { id: 8,  pilier: 'strategie',     text: "Prenez-vous des décisions après une analyse approfondie des situations ?" },
  { id: 9,  pilier: 'strategie',     text: "Vous adaptez-vous facilement aux changements imprévus ?" },
  { id: 10, pilier: 'strategie',     text: "Êtes-vous à l'aise dans des environnements incertains ou en évolution constante ?" },
  // Focus & Discipline (2 questions → max 6)
  { id: 11, pilier: 'discipline',    text: "Restez-vous concentré(e) sur vos objectifs à long terme ?" },
  { id: 12, pilier: 'discipline',    text: "Parvenez-vous à éviter les distractions dans votre travail quotidien ?" },
  // Personal Branding (2 questions → max 6)
  { id: 13, pilier: 'branding',      text: "Travaillez-vous activement sur l'amélioration de votre image personnelle ou professionnelle ?" },
  { id: 14, pilier: 'branding',      text: "Tenez-vous compte de l'impact de votre réputation sur votre réussite ?" },
  // Gestion du Temps (2 questions → max 6)
  { id: 15, pilier: 'temps',         text: "Gérez-vous efficacement votre emploi du temps quotidien ?" },
  { id: 16, pilier: 'temps',         text: "Priorisez-vous les tâches les plus importantes dans votre travail ?" },
  // Gestion du Stress (2 questions → max 6)
  { id: 17, pilier: 'stress',        text: "Restez-vous calme et concentré(e) dans des situations de stress intense ?" },
  { id: 18, pilier: 'stress',        text: "Utilisez-vous régulièrement des techniques pour gérer le stress ?" },
  // Leadership (2 questions → max 6)
  { id: 19, pilier: 'leadership',    text: "Prenez-vous naturellement le rôle de leader dans des équipes ?" },
  { id: 20, pilier: 'leadership',    text: "Gérez-vous efficacement les conflits au sein d'une équipe ?" },
  // Créativité (2 questions → max 6)
  { id: 21, pilier: 'creativite',    text: "Trouvez-vous régulièrement des solutions créatives face aux problèmes ?" },
  { id: 22, pilier: 'creativite',    text: "Proposez-vous souvent de nouvelles idées dans un cadre professionnel ?" },
  // Vision (2 questions → max 6)
  { id: 23, pilier: 'vision',        text: "Avez-vous une vision claire de vos objectifs à long terme ?" },
  { id: 24, pilier: 'vision',        text: "Réévaluez-vous régulièrement vos objectifs et votre vision pour l'avenir ?" },
  // Prise de Risque (2 questions → max 6)
  { id: 25, pilier: 'risque',        text: "Prenez-vous des risques calculés pour atteindre vos objectifs ?" },
  { id: 26, pilier: 'risque',        text: "Sortez-vous souvent de votre zone de confort pour avancer dans votre carrière ou vie personnelle ?" },
  // Autonomie (2 questions → max 6)
  { id: 27, pilier: 'autonomie',     text: "Travaillez-vous de manière autonome sur des projets importants sans avoir besoin de supervision ?" },
  { id: 28, pilier: 'autonomie',     text: "Prenez-vous l'initiative d'agir sans attendre des instructions ?" },
  // Éthique & Intégrité (2 questions → max 6)
  { id: 29, pilier: 'ethique',       text: "Intégrez-vous l'éthique dans toutes vos décisions professionnelles ?" },
  { id: 30, pilier: 'ethique',       text: "Défendez-vous vos valeurs même si cela implique de prendre des risques ?" },
]

export const QS_PILIER_ORDER: QSPilier[] = [
  'ie', 'communication', 'strategie', 'discipline',
  'branding', 'temps', 'stress', 'leadership',
  'creativite', 'vision', 'risque', 'autonomie', 'ethique',
]

// ── PILIER INFO + CONTENT ──────────────────────────────────────────────────────
export const QS_PILIERS: QSPilierInfo[] = [
  {
    key: 'ie', label: 'Intelligence Émotionnelle', maxScore: 12,
    forte: {
      summary: "Vous gérez vos émotions avec maturité et comprenez celles des autres avec finesse.",
      description: "Vous possédez une intelligence émotionnelle développée qui vous permet de naviguer avec aisance dans les situations complexes. Vous réglez vos réactions face au stress, percevez les émotions de votre entourage et transformez les échecs en leviers de croissance. C'est l'un des piliers les plus déterminants de votre succès relationnel et professionnel.",
      planTitle: "Consolider et approfondir votre intelligence émotionnelle",
      plan: [
        "Pratiquez la pleine conscience 10 min par jour pour renforcer votre conscience de soi.",
        "Entraînez-vous à nommer précisément vos émotions dans un journal quotidien.",
        "Cherchez activement des feedbacks de vos pairs pour confirmer votre lecture des situations interpersonnelles.",
      ],
      exercice: "Chaque soir, notez une situation émotionnellement chargée de la journée : ce que vous avez ressenti, comment vous avez réagi, et ce que vous auriez pu faire différemment. En 30 jours, vous affinerez considérablement votre maîtrise émotionnelle.",
    },
    moyenne: {
      summary: "Vous avez de bonnes bases en intelligence émotionnelle, avec quelques axes à renforcer.",
      description: "Vous avez conscience de vos émotions et faites preuve d'empathie dans vos relations. Cependant, dans les situations de forte pression ou après un revers, votre stabilité émotionnelle peut être mise à l'épreuve. Avec un travail ciblé, vous pouvez développer une maîtrise émotionnelle beaucoup plus solide.",
      planTitle: "Développer votre régulation émotionnelle",
      plan: [
        "Identifiez vos 3 déclencheurs émotionnels principaux et préparez une stratégie de réponse pour chacun.",
        "Pratiquez la technique de la respiration 4-7-8 dès que vous sentez une montée de stress.",
        "Lisez un ouvrage sur l'intelligence émotionnelle (ex. Daniel Goleman) pour approfondir vos connaissances.",
      ],
      exercice: "La prochaine fois que vous ressentez une émotion intense, marquez une pause de 90 secondes avant d'agir. Respirez profondément, observez l'émotion sans la juger, puis choisissez consciemment votre réponse. Répétez cet exercice quotidiennement pendant 3 semaines.",
    },
    faible: {
      summary: "L'intelligence émotionnelle est un axe de développement prioritaire pour vous.",
      description: "Votre intelligence émotionnelle est un levier majeur à développer. Les émotions influencent toutes vos décisions et relations : apprendre à les identifier, les gérer et comprendre celles des autres vous donnera un avantage considérable dans votre parcours professionnel et personnel. C'est une compétence qui s'acquiert avec la pratique.",
      planTitle: "Construire les bases de votre intelligence émotionnelle",
      plan: [
        "Commencez un journal émotionnel : écrivez chaque jour ce que vous avez ressenti et pourquoi.",
        "Faites le test EQ-i ou un bilan émotionnel guidé avec un coach pour identifier vos points de départ.",
        "Engagez-vous dans un programme de développement personnel centré sur les émotions (coaching, formation, thérapie brève).",
      ],
      exercice: "Chaque matin, posez-vous 3 questions : Comment je me sens ? Qu'est-ce qui influence mon humeur ? Comment est-ce que je veux aborder ma journée ? Cet ancrage quotidien de 5 minutes construit progressivement votre conscience émotionnelle.",
    },
  },
  {
    key: 'communication', label: 'Communication', maxScore: 6,
    forte: {
      summary: "Vous communiquez avec clarté et aisance, à l'oral comme en réunion.",
      description: "Vous maîtrisez l'art de la communication. Vous vous exprimez avec précision, adaptez votre message à votre interlocuteur et êtes à l'aise dans les prises de parole en public. Cette compétence renforce votre crédibilité et votre capacité à convaincre, deux atouts essentiels pour tout leader.",
      planTitle: "Aller encore plus loin dans votre impact communicationnel",
      plan: [
        "Travaillez sur la communication non verbale : posture, regard, gestuelle pour renforcer votre présence.",
        "Pratiquez le storytelling pour rendre vos messages plus mémorables et percutants.",
        "Rejoignez un club Toastmasters ou participez à des conférences pour maintenir et affûter votre niveau.",
      ],
      exercice: "Enregistrez-vous en vidéo lors de votre prochaine présentation ou réunion. Regardez-vous ensuite en notant 3 points forts et 2 points d'amélioration sur la clarté, le rythme et l'engagement. Répétez tous les mois.",
    },
    moyenne: {
      summary: "Vous vous exprimez correctement, mais l'aisance en public peut encore progresser.",
      description: "Vous communiquez clairement dans la plupart des situations, mais certains contextes — notamment la prise de parole publique ou les réunions importantes — peuvent générer un inconfort. Travailler sur votre confiance à l'oral vous permettra d'accroître significativement votre impact.",
      planTitle: "Renforcer votre aisance communicationnelle",
      plan: [
        "Entraînez-vous à parler en public régulièrement, même en dehors du cadre professionnel (groupes, associations).",
        "Préparez systématiquement vos interventions importantes avec un plan en 3 points : contexte, message clé, conclusion.",
        "Demandez des retours constructifs après chaque prise de parole pour identifier vos axes d'amélioration.",
      ],
      exercice: "Pratiquez la technique du « speech miroir » : chaque matin, parlez 2 minutes devant votre miroir sur un sujet libre. Cela développe votre fluidité verbale et votre confiance en vous à l'oral en quelques semaines.",
    },
    faible: {
      summary: "La communication est un axe prioritaire à travailler pour amplifier votre impact.",
      description: "Votre capacité à vous exprimer clairement et à l'aise en public est un levier puissant à développer. Une communication efficace multiplie votre influence, votre crédibilité et vos opportunités. Il ne s'agit pas d'un don inné, mais d'une compétence qui se construit par la pratique régulière.",
      planTitle: "Développer vos compétences en communication",
      plan: [
        "Rejoignez un atelier ou une formation en prise de parole en public (Toastmasters, formation express).",
        "Commencez par de petites prises de parole dans des environnements bienveillants pour gagner en confiance.",
        "Travaillez votre vocabulaire et votre structuration des idées en lisant et en résumant des textes à voix haute chaque jour.",
      ],
      exercice: "Choisissez un sujet que vous maîtrisez et préparez une présentation de 3 minutes. Présentez-la d'abord seul(e), puis devant 1 personne de confiance, puis devant un petit groupe. Augmentez progressivement le nombre d'auditeurs chaque semaine.",
    },
  },
  {
    key: 'strategie', label: 'Pensée Stratégique & Adaptabilité', maxScore: 12,
    forte: {
      summary: "Vous planifiez à long terme, décidez avec méthode et vous adaptez avec agilité.",
      description: "Vous possédez une pensée stratégique solide associée à une grande agilité. Vous anticipez, analysez les situations en profondeur avant d'agir, et vous adaptez sans difficulté aux changements et aux incertitudes. Cette combinaison est un avantage décisif pour piloter des projets complexes et évoluer dans des environnements dynamiques.",
      planTitle: "Affûter votre avantage stratégique",
      plan: [
        "Intégrez des outils d'analyse stratégique (SWOT, OKR, carte mentale) dans votre pratique mensuelle.",
        "Cultivez votre veille stratégique : lisez des analyses de tendances dans votre secteur chaque semaine.",
        "Entraînez-vous à la pensée en scénarios : pour chaque décision importante, imaginez 3 futurs possibles.",
      ],
      exercice: "Une fois par mois, consacrez 1 heure à une « revue stratégique » personnelle : où en êtes-vous par rapport à vos objectifs ? Quels obstacles ont émergé ? Quels ajustements s'imposent ? Documentez vos réponses pour construire un pilotage personnel efficace.",
    },
    moyenne: {
      summary: "Vous avez une vision et vous adaptez, mais la rigueur stratégique peut se renforcer.",
      description: "Vous êtes capable d'anticiper et de vous adapter, mais votre pensée stratégique manque parfois de profondeur ou de rigueur dans l'analyse. Il vous arrive de prendre des décisions sans avoir exploré toutes les options ou de réagir aux changements de façon plus instinctive que calculée. Des outils et de la pratique peuvent rapidement combler cet écart.",
      planTitle: "Structurer votre pensée stratégique",
      plan: [
        "Adoptez un cadre de décision : avant toute décision importante, listez les options, les risques et les bénéfices de chacune.",
        "Planifiez vos objectifs trimestriels par écrit en les décomposant en actions hebdomadaires mesurables.",
        "Pratiquez la rétrospective mensuelle : analysez ce qui a fonctionné et ce qui doit évoluer dans votre approche.",
      ],
      exercice: "Utilisez la matrice Eisenhower (urgent/important) chaque lundi pour planifier votre semaine. En quelques semaines, vous développerez un réflexe de priorisation stratégique et une meilleure gestion de votre énergie.",
    },
    faible: {
      summary: "La pensée stratégique et l'adaptabilité sont des axes fondamentaux à développer.",
      description: "Votre pensée stratégique et votre agilité face aux changements sont deux compétences clés à renforcer. Sans vision à long terme ni capacité à analyser avant d'agir, il est difficile de piloter efficacement sa trajectoire professionnelle. Ces compétences s'apprennent et se pratiquent — l'important est de commencer.",
      planTitle: "Construire votre pensée stratégique",
      plan: [
        "Commencez par définir par écrit vos objectifs à 1 an, 3 ans et 5 ans. Revoyez-les chaque trimestre.",
        "Pour chaque décision importante, imposez-vous de lister au minimum 3 options avant de choisir.",
        "Lisez 1 livre par trimestre sur la stratégie, la pensée systémique ou la prise de décision.",
      ],
      exercice: "Chaque dimanche soir, passez 15 minutes à planifier votre semaine en répondant à : Quels sont mes 3 objectifs prioritaires cette semaine ? Qu'est-ce qui pourrait me freiner ? Comment je m'y prépare ? Ce rituel simple développe progressivement votre muscle stratégique.",
    },
  },
  {
    key: 'discipline', label: 'Focus & Discipline', maxScore: 6,
    forte: {
      summary: "Vous maintenez votre focus et résistez aux distractions avec constance.",
      description: "Votre discipline est un atout remarquable. Vous savez rester concentré(e) sur vos objectifs à long terme et gérer les distractions du quotidien. Cette constance dans l'effort est l'un des facteurs les plus prédictifs de la réussite sur le long terme. Vous avez construit une relation saine et productive avec votre travail.",
      planTitle: "Maintenir et affiner votre discipline",
      plan: [
        "Protégez vos temps de travail profond en bloquant des créneaux sans interruption dans votre agenda.",
        "Mesurez votre productivité hebdomadaire pour maintenir votre niveau et détecter les baisses de régime.",
        "Partagez vos bonnes pratiques de discipline avec vos collaborateurs pour créer un environnement de performance collective.",
      ],
      exercice: "Testez la méthode Pomodoro pendant 1 semaine : 25 min de concentration totale, 5 min de pause. Évaluez à la fin de la semaine votre niveau de productivité et d'énergie par rapport à votre méthode habituelle.",
    },
    moyenne: {
      summary: "Vous êtes globalement discipliné(e), avec des moments de perte de focus à gérer.",
      description: "Vous avez une bonne discipline de base, mais vous êtes parfois sujet(te) à la distraction ou à la procrastination. Votre concentration sur le long terme peut fléchir lorsque les résultats tardent ou que la routine s'installe. Renforcer vos rituels de travail vous permettra de gagner en régularité et en performance.",
      planTitle: "Renforcer votre discipline quotidienne",
      plan: [
        "Identifiez vos 3 principales sources de distraction et mettez en place une stratégie concrète pour les limiter.",
        "Créez une routine matinale structurée qui prépare votre esprit à la concentration (même 20 min suffisent).",
        "Utilisez un système de récompenses : célébrez chaque objectif atteint pour maintenir votre motivation.",
      ],
      exercice: "Pendant 21 jours, écrivez chaque soir vos 3 priorités pour le lendemain. Chaque matin, commencez par la tâche la plus importante avant de regarder vos emails. Ce rituel simple transforme votre discipline en une habitude automatique.",
    },
    faible: {
      summary: "Le focus et la discipline sont des compétences à bâtir méthodiquement.",
      description: "La discipline et la concentration sont deux piliers fondamentaux de la réussite que vous devez impérativement développer. Sans elles, même les meilleures idées et intentions restent sans suite. La bonne nouvelle : la discipline se construit par de petites habitudes quotidiennes, pas par des efforts héroïques ponctuels.",
      planTitle: "Bâtir votre discipline pas à pas",
      plan: [
        "Commencez petit : engagez-vous sur une seule habitude quotidienne pendant 30 jours (ex. travailler 1h sans distraction chaque matin).",
        "Éliminez les sources de distraction de votre environnement de travail : notifications, téléphone, environnement visuel.",
        "Trouvez un(e) partenaire de responsabilité avec qui vous partagez vos engagements chaque semaine.",
      ],
      exercice: "La règle des 2 minutes : si une tâche prend moins de 2 minutes, faites-la immédiatement. Pour les tâches plus longues, planifiez-les dans votre agenda. Pendant 2 semaines, tenez un journal de vos tâches accomplies chaque jour pour prendre conscience de vos progrès.",
    },
  },
  {
    key: 'branding', label: 'Personal Branding', maxScore: 6,
    forte: {
      summary: "Vous cultivez consciemment votre image et votre réputation professionnelle.",
      description: "Vous comprenez que votre réputation est l'un de vos actifs les plus précieux et vous travaillez activement à la développer. Vous gérez votre image personnelle et professionnelle avec intention, et vous êtes conscient(e) de l'impact de chaque action sur la perception que les autres ont de vous. C'est une compétence rare et décisive.",
      planTitle: "Amplifier votre personal branding",
      plan: [
        "Définissez votre proposition de valeur unique : en quoi êtes-vous différent(e) et mémorable dans votre domaine ?",
        "Renforcez votre présence en ligne (LinkedIn, contenu, recommandations) pour que votre réputation vous précède.",
        "Cherchez des opportunités de visibilité : conférences, articles, mentoring pour asseoir votre autorité.",
      ],
      exercice: "Rédigez votre « BIO de marque personnelle » en 5 lignes qui résume qui vous êtes, ce que vous faites, et la valeur unique que vous apportez. Partagez-la avec 3 personnes de confiance pour avoir leur feedback avant de l'utiliser professionnellement.",
    },
    moyenne: {
      summary: "Vous pensez à votre image, mais sans encore en faire une stratégie cohérente.",
      description: "Vous avez conscience de l'importance de votre réputation et commencez à travailler sur votre image, mais sans encore une stratégie claire et cohérente. Votre personal branding est intuitif plutôt que construit. En définissant intentionnellement votre positionnement, vous pouvez multiplier votre impact et vos opportunités.",
      planTitle: "Construire votre stratégie de personal branding",
      plan: [
        "Faites un audit de votre présence en ligne : ce que les autres voient quand ils cherchent votre nom.",
        "Identifiez 3 valeurs ou compétences clés pour lesquelles vous voulez être reconnu(e) et construisez votre communication autour.",
        "Créez un plan de contenu minimal : 1 post LinkedIn par semaine sur votre domaine d'expertise.",
      ],
      exercice: "Demandez à 5 personnes de votre réseau (collègues, mentors, clients) : « En 3 mots, comment me décririez-vous professionnellement ? » Comparez leurs réponses à l'image que vous voulez projeter. L'écart vous donnera la feuille de route de votre personal branding.",
    },
    faible: {
      summary: "Le personal branding est un levier de réussite que vous n'exploitez pas encore.",
      description: "Vous n'accordez pas encore suffisamment d'attention à votre image et votre réputation professionnelle. Dans un monde hyperconnecté, votre marque personnelle est votre carte de visite permanente. Ne pas la travailler, c'est laisser les autres définir votre réputation à votre place. Il est temps de prendre le contrôle.",
      planTitle: "Initier votre démarche de personal branding",
      plan: [
        "Commencez par optimiser votre profil LinkedIn : photo professionnelle, titre accrocheur, résumé qui vous représente.",
        "Identifiez votre domaine d'expertise principale et commencez à partager du contenu pertinent régulièrement.",
        "Soyez intentionnel(le) dans chaque interaction professionnelle : votre réputation se construit à chaque échange.",
      ],
      exercice: "Googlez votre nom maintenant. Qu'est-ce qui apparaît ? Est-ce que cela reflète qui vous êtes vraiment ? Ensuite, créez ou mettez à jour votre profil LinkedIn avec une photo professionnelle et un résumé authentique. C'est votre premier acte de personal branding.",
    },
  },
  {
    key: 'temps', label: 'Gestion du Temps', maxScore: 6,
    forte: {
      summary: "Vous planifiez et priorisez vos tâches avec efficacité au quotidien.",
      description: "Votre gestion du temps est un atout solide. Vous planifiez vos journées, priorisez vos tâches selon leur importance et respectez vos engagements dans les délais. Cette organisation vous permet d'être plus productif(ve), moins stressé(e) et de dégager du temps pour ce qui compte vraiment.",
      planTitle: "Optimiser encore davantage votre productivité",
      plan: [
        "Adoptez la règle du « Temps profond » : planifiez 2h par jour sans aucune interruption pour votre travail le plus important.",
        "Évaluez trimestriellement comment vous investissez votre temps pour repérer les activités chronophages sans valeur.",
        "Déléguez davantage : identifiez les tâches que vous seul(e) pouvez faire vs celles qui peuvent être confiées.",
      ],
      exercice: "Pendant 1 semaine, trackez précisément comment vous utilisez chaque heure de votre journée (app de time-tracking). À la fin, analysez : quel pourcentage de votre temps est consacré à vos priorités réelles ? Le résultat est souvent une révélation.",
    },
    moyenne: {
      summary: "Vous gérez globalement votre temps, mais la priorisation peut s'améliorer.",
      description: "Vous avez une organisation acceptable, mais vous perdez parfois du temps sur des tâches secondaires au détriment des priorités. La réactivité (emails, urgences) prend souvent le dessus sur la proactivité (travail important mais non urgent). Un système de gestion du temps plus structuré changerait significativement votre efficacité.",
      planTitle: "Améliorer votre organisation quotidienne",
      plan: [
        "Adoptez la méthode Ivy Lee : le soir, listez vos 6 tâches les plus importantes du lendemain dans l'ordre de priorité.",
        "Réduisez le temps passé sur les emails : consultez-les seulement 3 fois par jour à des horaires fixes.",
        "Apprenez à dire non aux demandes qui ne correspondent pas à vos priorités du moment.",
      ],
      exercice: "Utilisez la matrice d'Eisenhower cette semaine : classez toutes vos tâches en 4 quadrants (urgent/important, important non urgent, urgent non important, ni l'un ni l'autre). Concentrez 80% de votre temps sur le quadrant « important non urgent » et observez le changement dans votre productivité.",
    },
    faible: {
      summary: "La gestion du temps est un axe de développement essentiel pour vous.",
      description: "Votre gestion du temps révèle un potentiel important à libérer. Le manque d'organisation et de priorisation vous coûte chaque jour en énergie, en efficacité et en sérénité. Apprendre à planifier et prioriser n'est pas une question de nature, c'est une compétence qui s'apprend et qui transforme radicalement les résultats.",
      planTitle: "Construire vos fondations d'organisation",
      plan: [
        "Adoptez un seul outil de planification (agenda, app, carnet) et utilisez-le systématiquement chaque jour.",
        "Commencez chaque journée par identifier vos 3 tâches prioritaires — et faites-les avant tout le reste.",
        "Fixez des plages horaires dédiées pour les emails, les réunions et le travail de fond. Respectez-les strictement pendant 21 jours.",
      ],
      exercice: "Dès ce soir, planifiez votre journée de demain par blocs horaires de 30 min. Inscrivez chaque activité dans un créneau précis, y compris les pauses. En fin de journée, évaluez ce que vous avez accompli. Répétez pendant 2 semaines pour créer l'habitude.",
    },
  },
  {
    key: 'stress', label: 'Gestion du Stress', maxScore: 6,
    forte: {
      summary: "Vous restez serein(e) sous pression et utilisez des techniques efficaces.",
      description: "Votre maîtrise du stress est exemplaire. Vous restez calme et lucide même sous pression intense, et vous disposez d'outils concrets pour maintenir votre équilibre. Cette stabilité émotionnelle face à l'adversité est un différenciateur majeur : elle vous permet de prendre de meilleures décisions quand les autres perdent leurs moyens.",
      planTitle: "Maintenir et partager votre maîtrise du stress",
      plan: [
        "Partagez vos techniques anti-stress avec votre équipe pour créer un environnement de travail plus serein.",
        "Intégrez une pratique corporelle régulière (sport, yoga, méditation) pour entretenir votre résilience physiologique.",
        "Anticipez les périodes de forte pression en planifiant des moments de récupération actifs dans votre agenda.",
      ],
      exercice: "Créez votre « boîte à outils anti-stress » personnelle : listez vos 5 techniques les plus efficaces pour retrouver votre calme rapidement (respiration, marche, musique…). Gardez cette liste accessible et utilisez-la systématiquement dès les premiers signes de stress.",
    },
    moyenne: {
      summary: "Vous gérez le stress de façon acceptable, mais sans méthode vraiment systématique.",
      description: "Vous parvenez globalement à gérer la pression, mais vos résultats varient selon les situations. Parfois vous restez calme, parfois le stress prend le dessus. Vous n'utilisez pas encore de techniques de gestion du stress de façon régulière et proactive. Avec une approche plus structurée, vous pouvez gagner en stabilité.",
      planTitle: "Développer votre résilience au stress",
      plan: [
        "Apprenez et pratiquez quotidiennement la respiration cohérence cardiaque (5 min, 3 fois par jour).",
        "Identifiez vos principaux déclencheurs de stress et préparez un protocole de réponse pour chacun.",
        "Intégrez une activité physique de 30 min minimum 3 fois par semaine — le sport est le meilleur antistress prouvé.",
      ],
      exercice: "Testez pendant 21 jours la cohérence cardiaque : 5 minutes de respiration lente (6 cycles de 5s inspiration / 5s expiration) le matin, à midi et le soir. Évaluez l'effet sur votre niveau de stress et de clarté mentale au bout de 3 semaines.",
    },
    faible: {
      summary: "La gestion du stress est un axe prioritaire à travailler pour votre bien-être.",
      description: "Vous avez des difficultés à rester serein(e) sous pression et n'utilisez pas encore de techniques efficaces pour gérer votre stress. Sur le long terme, un stress mal géré impacte votre santé, vos décisions et votre performance. Travailler cet axe est une priorité absolue — votre qualité de vie en dépend directement.",
      planTitle: "Apprendre à gérer votre stress",
      plan: [
        "Commencez par un bilan de vos principales sources de stress : professionnelles, personnelles, environnementales.",
        "Apprenez et pratiquez la technique de respiration 4-7-8 (inspiration 4s, rétention 7s, expiration 8s) dès maintenant.",
        "Envisagez un accompagnement : coach, thérapeute ou programme de gestion du stress structuré.",
      ],
      exercice: "Pendant 2 semaines, tenez un journal du stress : notez chaque jour votre niveau de stress (1 à 10), ce qui l'a déclenché, et ce qui vous a aidé à vous calmer. Ce simple exercice de conscience vous donnera des insights précieux pour construire votre stratégie anti-stress.",
    },
  },
  {
    key: 'leadership', label: 'Leadership', maxScore: 6,
    forte: {
      summary: "Vous assumez naturellement le leadership et gérez les conflits avec efficacité.",
      description: "Vous êtes un(e) leader naturel(le). Vous prenez l'initiative, inspirez confiance et savez fédérer les équipes autour d'objectifs communs. Votre capacité à gérer les conflits avec intelligence et à décider sous pression fait de vous un pilier dans les situations complexes. C'est une compétence rare et précieuse.",
      planTitle: "Développer votre leadership vers un niveau supérieur",
      plan: [
        "Passez d'un leadership directif à un leadership de développement : investissez dans la croissance de vos collaborateurs.",
        "Cultivez votre intelligence politique : comprenez les enjeux de pouvoir et les dynamiques dans votre organisation.",
        "Mentorinez des personnes moins expérimentées — enseigner est la meilleure façon d'approfondir votre leadership.",
      ],
      exercice: "Identifiez 2 personnes dans votre entourage professionnel dont vous pourriez soutenir le développement. Planifiez un échange mensuel avec chacune d'elles pour les accompagner dans leurs défis. Le leadership se mesure à l'impact que vous avez sur la croissance des autres.",
    },
    moyenne: {
      summary: "Vous avez du potentiel de leadership, encore à affirmer dans certaines situations.",
      description: "Vous avez les fondations d'un bon leader, mais vous n'assumez pas encore pleinement ce rôle de façon constante. Vous pouvez être hésitant(e) à prendre les devants ou à gérer des conflits. En développant votre confiance et votre style de leadership, vous pourrez exercer une influence beaucoup plus forte et constructive.",
      planTitle: "Affirmer votre leadership",
      plan: [
        "Prenez davantage d'initiatives : proposez de piloter des projets ou de faciliter des réunions d'équipe.",
        "Formez-vous à la gestion des conflits : apprenez les techniques de médiation et de communication non violente.",
        "Développez votre vision : un leader efficace articule clairement où il veut emmener son équipe.",
      ],
      exercice: "La prochaine fois qu'un désaccord surgit dans votre équipe, positionnez-vous comme médiateur(trice) plutôt que de l'éviter. Écoutez chaque partie, synthétisez les besoins, et proposez une solution. Débriefez ensuite avec une personne de confiance pour évaluer votre posture.",
    },
    faible: {
      summary: "Le leadership est une compétence clé à développer dans votre trajectoire.",
      description: "Votre leadership est encore en gestation. Vous n'assumez pas encore naturellement un rôle de guide ou de décideur dans les groupes, et les conflits vous mettent en difficulté. Or le leadership n'est pas réservé à une élite : c'est un ensemble de compétences que vous pouvez développer pas à pas avec la bonne méthode.",
      planTitle: "Construire votre posture de leader",
      plan: [
        "Commencez par prendre la parole plus régulièrement dans les réunions : proposez des idées, posez des questions, résumez les échanges.",
        "Lisez un livre de référence sur le leadership (ex. John Maxwell, Simon Sinek) et appliquez une idée par semaine.",
        "Cherchez des opportunités de leadership à petite échelle : animation d'un projet, organisation d'un événement.",
      ],
      exercice: "Choisissez un projet ou une activité dans laquelle vous allez prendre l'initiative de rassembler et coordonner d'autres personnes. Même une organisation simple (sortie, projet bénévole) développe des réflexes de leadership. Analysez ce que vous avez appris à chaque étape.",
    },
  },
  {
    key: 'creativite', label: 'Créativité & Innovation', maxScore: 6,
    forte: {
      summary: "Vous proposez des solutions créatives et innovantes avec régularité.",
      description: "Votre créativité est un atout différenciateur. Vous générez des idées nouvelles avec fluidité et avez l'habitude de proposer des approches originales dans votre environnement professionnel. Dans un monde en constante mutation, cette capacité à penser différemment vous donne un avantage concurrentiel réel.",
      planTitle: "Amplifier votre potentiel créatif",
      plan: [
        "Créez des rituels de créativité : bloc de 30 min par semaine dédié à explorer de nouvelles idées sans jugement.",
        "Sortez de votre secteur pour vous inspirer : lisez, voyagez, échangez avec des personnes d'horizons différents.",
        "Mettez en place un système de capture d'idées : carnet, application, afin de ne perdre aucune inspiration.",
      ],
      exercice: "Pratiquez le brainstorming solo pendant 15 minutes : choisissez un problème actuel et générez au moins 20 idées, même farfelues, sans vous autocensurer. Ensuite, sélectionnez les 3 plus prometteuses et développez-en une. Répétez chaque semaine.",
    },
    moyenne: {
      summary: "Vous avez de la créativité, mais elle s'exprime de façon inégale.",
      description: "Vous avez un potentiel créatif réel, mais votre créativité s'exprime de façon irrégulière. Parfois vous trouvez des idées innovantes, d'autres fois vous restez dans les schémas habituels. Cultiver votre créativité comme une compétence à part entière, avec des pratiques régulières, vous permettra de la rendre plus fiable et percutante.",
      planTitle: "Développer votre créativité de façon régulière",
      plan: [
        "Pratiquez la pensée latérale : questionnez systématiquement les évidences et cherchez des angles non conventionnels.",
        "Intégrez des pratiques créatives dans votre routine : dessin, écriture, mind mapping, improvisation.",
        "Créez un environnement propice à la créativité : espace ordonné, inspirations visuelles, moments de déconnexion.",
      ],
      exercice: "Pendant 30 jours, consacrez 10 minutes chaque matin à « l'écriture matinale » (morning pages) : écrivez 3 pages de tout ce qui vous passe par la tête, sans filtre. Cet exercice déverrouille progressivement votre créativité naturelle et réduit la censure intérieure.",
    },
    faible: {
      summary: "La créativité est un levier que vous pouvez développer avec les bons outils.",
      description: "Vous avez tendance à rester dans les schémas établis plutôt qu'à explorer de nouvelles voies. Or la créativité n'est pas un don inné — c'est un muscle qui se développe avec la pratique. Dans un environnement professionnel qui exige de plus en plus d'innovation, développer cet axe est un investissement essentiel.",
      planTitle: "Éveiller et développer votre créativité",
      plan: [
        "Commencez par observer : notez chaque jour quelque chose de nouveau que vous avez remarqué dans votre environnement.",
        "Lisez sur des sujets très éloignés de votre domaine : la créativité naît souvent des connexions inattendues.",
        "Participez à un atelier créatif (dessin, théâtre, improvisation) pour déprogrammer vos inhibitions créatives.",
      ],
      exercice: "Le défi des 30 cercles : dessinez 30 cercles sur une feuille et transformez-les chacun en quelque chose de différent en 3 minutes. Cet exercice classique de design thinking prouve que la créativité est accessible à tous et se développe par la pratique rapide et non censurée.",
    },
  },
  {
    key: 'vision', label: 'Vision & Clarté d\'Objectifs', maxScore: 6,
    forte: {
      summary: "Vous avez une vision claire et la réévaluez régulièrement.",
      description: "Vous savez exactement où vous allez et vous revisitez régulièrement vos objectifs pour rester aligné(e) avec votre vision. Cette clarté stratégique personnelle est un moteur puissant de motivation, de décision et de résilience. Votre cap est défini — c'est l'un des atouts les plus précieux sur le chemin du succès.",
      planTitle: "Enrichir et affiner votre vision",
      plan: [
        "Traduisez votre vision en un plan d'action trimestriel avec des jalons mesurables.",
        "Partagez votre vision avec vos proches ou mentors pour la renforcer et créer de l'accountability.",
        "Créez un vision board ou un document de vision pour ancrer vos objectifs visuellement.",
      ],
      exercice: "Écrivez votre « lettre depuis le futur » : imaginez que vous écrivez à votre « moi actuel » depuis dans 5 ans, en décrivant votre vie professionnelle et personnelle idéale. Soyez précis(e) et émotionnel(le). Relisez-la chaque mois pour maintenir votre cap.",
    },
    moyenne: {
      summary: "Vous avez une vision, mais elle manque parfois de précision ou de révision.",
      description: "Vous avez des objectifs en tête, mais votre vision à long terme manque parfois de clarté ou de mise à jour régulière. Vous avancez dans la bonne direction, mais sans cap totalement précis. Clarifier et formaliser votre vision vous donnera bien plus d'énergie et de cohérence dans vos choix quotidiens.",
      planTitle: "Clarifier et formaliser votre vision",
      plan: [
        "Consacrez 2 heures à définir par écrit votre vision à 3 ans : professionnelle, financière, personnelle.",
        "Décomposez cette vision en objectifs annuels puis trimestriels avec des indicateurs de succès clairs.",
        "Planifiez une révision de vos objectifs à chaque début de trimestre pour vous adapter sans perdre le cap.",
      ],
      exercice: "Utilisez le cadre OKR (Objectives and Key Results) : définissez 1 objectif ambitieux pour les 3 prochains mois et 3 indicateurs mesurables qui prouveront que vous l'avez atteint. Affichez-les là où vous les verrez chaque jour.",
    },
    faible: {
      summary: "Construire une vision claire est une priorité pour votre trajectoire de succès.",
      description: "L'absence de vision claire à long terme vous prive d'un moteur essentiel. Sans cap défini, chaque jour est une réaction aux urgences plutôt qu'une progression vers vos aspirations. Construire une vision précise et des objectifs structurés est la première étape — et la plus impactante — de votre développement.",
      planTitle: "Construire votre vision personnelle",
      plan: [
        "Commencez par explorer vos valeurs fondamentales : qu'est-ce qui compte vraiment pour vous ? Où voulez-vous être dans 3 ans ?",
        "Formalisez 1 objectif SMART (Spécifique, Mesurable, Atteignable, Réaliste, Temporel) pour les 3 prochains mois.",
        "Trouvez un mentor ou un coach pour vous aider à clarifier et structurer votre vision.",
      ],
      exercice: "L'exercice de la « roue de la vie » : évaluez votre satisfaction de 1 à 10 dans 8 domaines (carrière, finances, santé, relations, famille, épanouissement, environnement, vie sociale). Identifiez les 2 domaines les plus faibles et définissez 1 action concrète pour chacun dès cette semaine.",
    },
  },
  {
    key: 'risque', label: 'Prise de Risque & Audace', maxScore: 6,
    forte: {
      summary: "Vous prenez des risques calculés et sortez régulièrement de votre zone de confort.",
      description: "Vous avez une excellente relation avec le risque. Vous évaluez les situations avec discernement et osez prendre des décisions audacieuses quand les opportunités se présentent. Cette volonté de sortir de votre zone de confort est l'un des traits les plus distinctifs des personnes qui réussissent sur le long terme.",
      planTitle: "Amplifier votre audace stratégique",
      plan: [
        "Augmentez progressivement la taille de vos prises de risque : visez des opportunités légèrement au-delà de votre zone de confort actuelle.",
        "Documentez vos prises de risque réussies pour renforcer votre confiance dans vos capacités de discernement.",
        "Entourez-vous de personnes audacieuses qui challengent votre vision et élargissent votre horizon.",
      ],
      exercice: "Identifiez une opportunité que vous hésitez à saisir depuis plus de 6 mois. Faites une analyse risque/bénéfice honnête en 30 minutes. Si le bénéfice potentiel dépasse le risque réel, engagez-vous sur une première action concrète dans les 48 heures.",
    },
    moyenne: {
      summary: "Vous prenez parfois des risques, mais la prudence domine encore vos choix.",
      description: "Vous êtes capable de prendre des risques dans certains contextes, mais vous avez tendance à rester dans votre zone de confort lorsque l'enjeu augmente. La prudence n'est pas un défaut, mais un excès de prudence peut vous faire manquer des opportunités importantes. Développer votre rapport au risque est une clé de croissance.",
      planTitle: "Développer votre audace",
      plan: [
        "Pratiquez l'inconfort volontaire : chaque semaine, faites une petite chose qui vous sort de votre zone de confort.",
        "Analysez vos prises de risque passées : combien se sont mal terminées ? Confirmez que vos peurs sont souvent disproportionnées.",
        "Reformulez votre rapport à l'échec : une tentative ratée est une donnée d'apprentissage, pas un jugement sur vous.",
      ],
      exercice: "Listez 5 opportunités ou décisions que vous repoussez par peur. Pour chacune, notez le pire scénario réaliste (pas catastrophique) et le meilleur scénario. Vous réaliserez souvent que la peur était plus grande que le risque réel. Engagez-vous sur la moins risquée dès cette semaine.",
    },
    faible: {
      summary: "Oser prendre des risques calculés est un axe de développement clé pour vous.",
      description: "Vous avez tendance à éviter les risques et à rester dans votre zone de confort. Cette prudence excessive peut freiner votre croissance personnelle et professionnelle. Le succès exige de l'audace : apprendre à évaluer et accepter des risques mesurés est une compétence fondamentale à développer.",
      planTitle: "Apprendre à oser",
      plan: [
        "Commencez par de micro-risques quotidiens : proposer une idée en réunion, contacter quelqu'un d'influent, essayer quelque chose de nouveau.",
        "Rejoignez un groupe ou un programme qui vous challengera à vous dépasser (bootcamp, compétition, défi sportif).",
        "Travaillez sur votre rapport à l'échec avec un coach ou un thérapeute si la peur de l'échec est profondément ancrée.",
      ],
      exercice: "Le « défi du refus » : pendant 30 jours, demandez quelque chose ou proposez quelque chose chaque jour avec un risque de refus. L'objectif n'est pas d'obtenir un oui, mais de vous désensibiliser à la peur du non. En 30 jours, votre rapport au risque changera profondément.",
    },
  },
  {
    key: 'autonomie', label: 'Autonomie & Initiative', maxScore: 6,
    forte: {
      summary: "Vous travaillez de façon autonome et prenez l'initiative sans attendre.",
      description: "Votre autonomie et votre sens de l'initiative sont des atouts remarquables. Vous n'attendez pas qu'on vous dise quoi faire — vous identifiez les besoins, prenez des décisions et agissez de façon proactive. Cette posture d'entrepreneur interne est l'une des qualités les plus valorisées dans n'importe quel environnement professionnel.",
      planTitle: "Amplifier votre impact d'initiatives",
      plan: [
        "Élargissez votre périmètre d'initiative : proposez des solutions sur des problèmes en dehors de votre périmètre habituel.",
        "Développez votre capacité à embarquer les autres dans vos initiatives en les rendant co-acteurs.",
        "Documentez vos initiatives et leurs résultats pour construire un portefeuille de réalisations tangibles.",
      ],
      exercice: "Chaque lundi, identifiez un problème non résolu dans votre organisation ou votre vie personnelle. Proposez une solution concrète et mettez-la en œuvre, seul(e) ou avec d'autres, sans attendre une validation externe. En un mois, vous aurez initié 4 changements positifs.",
    },
    moyenne: {
      summary: "Vous êtes globalement autonome, avec des moments où l'initiative peut se renforcer.",
      description: "Vous êtes capable de travailler seul(e) et de prendre des initiatives dans certaines situations, mais vous attendez parfois que les choses soient demandées ou validées avant d'agir. Développer une posture plus proactive vous permettra de créer davantage de valeur et de visibilité professionnelle.",
      planTitle: "Renforcer votre autonomie et proactivité",
      plan: [
        "Adoptez la règle : avant de poser une question ou d'attendre une instruction, cherchez vous-même la réponse pendant 10 minutes.",
        "Proposez activement des solutions aux problèmes que vous observez, plutôt que de simplement les signaler.",
        "Créez votre propre agenda d'initiatives : une par semaine, grande ou petite, dans votre sphère d'influence.",
      ],
      exercice: "Pendant 2 semaines, repérez chaque fois que vous attendez une validation ou une instruction avant d'agir. Demandez-vous : ai-je vraiment besoin de cette validation ? Si la réponse est non, agissez de façon autonome. Notez les résultats et l'impact sur votre confiance en vous.",
    },
    faible: {
      summary: "Développer votre autonomie et votre sens de l'initiative est un axe prioritaire.",
      description: "Vous avez tendance à attendre des directives avant d'agir et à dépendre fortement de la supervision externe. Cette posture peut limiter votre croissance et votre impact professionnel. Développer votre autonomie est essentiel : les environnements professionnels modernes valorisent les personnes capables d'agir sans être constamment guidées.",
      planTitle: "Bâtir votre autonomie",
      plan: [
        "Commencez par prendre de petites décisions seul(e) chaque jour, sans demander de validation pour les choix qui relèvent de votre périmètre.",
        "Identifiez et challengez vos peurs sous-jacentes : peur de l'erreur, du jugement, de la responsabilité.",
        "Trouvez un mentor qui vous donnera un cadre sécurisé pour progressivement assumer plus d'autonomie.",
      ],
      exercice: "Choisissez un projet personnel (non professionnel pour commencer) que vous piloterez seul(e) de A à Z : planification, exécution, ajustements. Ça peut être simple (organiser un dîner, lancer un projet créatif). L'objectif est de vivre l'expérience de l'autonomie totale et de découvrir que vous en êtes capable.",
    },
  },
  {
    key: 'ethique', label: 'Éthique & Intégrité', maxScore: 6,
    forte: {
      summary: "Vous intégrez systématiquement l'éthique dans vos décisions et défendez vos valeurs.",
      description: "Votre intégrité est un pilier fondamental de votre identité professionnelle. Vous prenez des décisions alignées avec vos valeurs, même quand c'est difficile, et vous défendez vos principes avec courage. Cette éthique solide construit une réputation de confiance qui est l'un de vos actifs les plus précieux sur le long terme.",
      planTitle: "Incarner et propager votre éthique",
      plan: [
        "Formalisez vos valeurs fondamentales par écrit et utilisez-les comme grille de décision explicite.",
        "Soyez un modèle d'intégrité pour votre équipe : expliquez vos raisonnements éthiques pour créer une culture de confiance.",
        "Engagez-vous dans des causes ou organisations qui partagent vos valeurs pour renforcer votre ancrage.",
      ],
      exercice: "Rédigez votre « charte éthique personnelle » : listez vos 5 valeurs fondamentales, ce qu'elles signifient concrètement dans votre comportement, et une ligne rouge que vous ne franchirez jamais. Partagez cette charte avec 2-3 personnes de confiance pour la valider et vous engager à la tenir.",
    },
    moyenne: {
      summary: "Vous avez de bonnes valeurs, mais leur application dans des situations difficiles peut varier.",
      description: "Vous avez un ancrage éthique réel, mais vous pouvez parfois faire des compromis face à la pression externe ou aux enjeux personnels. Vos valeurs sont présentes mais pas encore suffisamment ancrées pour guider systématiquement vos décisions dans les situations ambiguës ou difficiles.",
      planTitle: "Renforcer votre ancrage éthique",
      plan: [
        "Identifiez vos valeurs les plus importantes et réfléchissez à comment elles se traduisent concrètement dans vos décisions quotidiennes.",
        "Analysez les décisions passées où vous avez fait des compromis avec vos valeurs : qu'en avez-vous appris ?",
        "Pratiquez la transparence : communiquez vos valeurs et limites à vos collaborateurs et partenaires.",
      ],
      exercice: "La prochaine fois que vous faites face à une décision éthiquement complexe, posez-vous 3 questions : Est-ce légal ? Est-ce juste pour toutes les parties ? Serai-je à l'aise si cette décision était rendue publique ? Ces 3 filtres construisent progressivement un réflexe éthique solide.",
    },
    faible: {
      summary: "L'éthique et l'intégrité sont des fondations à consolider dans votre parcours.",
      description: "Vous n'intégrez pas encore systématiquement l'éthique dans vos décisions et vous avez du mal à défendre vos valeurs sous pression. L'intégrité est pourtant la fondation sur laquelle se construit toute réputation durable. Sans elle, le succès à court terme peut fragiliser votre crédibilité sur le long terme.",
      planTitle: "Construire vos fondations éthiques",
      plan: [
        "Commencez par identifier clairement vos valeurs : qu'est-ce qui est vraiment non négociable pour vous ?",
        "Lisez sur l'éthique professionnelle et les leaders qui ont construit leur réputation sur l'intégrité.",
        "Demandez-vous systématiquement avant chaque décision : est-ce que je serais fier(e) si quelqu'un de respecté voyait ce que je fais ?",
      ],
      exercice: "Faites un audit de vos 5 dernières décisions importantes : étaient-elles alignées avec vos valeurs ? Pour celles qui ne l'étaient pas, identifiez pourquoi vous avez dévié. Cet exercice de conscience crée le terreau d'une intégrité plus solide et cohérente.",
    },
  },
]

// ── HELPERS ───────────────────────────────────────────────────────────────────
export function getPilierInfo(key: QSPilier): QSPilierInfo {
  return QS_PILIERS.find(p => p.key === key)!
}

export function getPilierScore(pilier: QSPilier, answers: Record<number, number>): number {
  return QS_QUESTIONS
    .filter(q => q.pilier === pilier)
    .reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
}

export function getQSLevel(score: number, maxScore: number): QSLevel {
  const pct = score / maxScore
  if (pct >= 0.75) return 'forte'
  if (pct >= 0.50) return 'moyenne'
  return 'faible'
}

export function getTotalScore(answers: Record<number, number>): number {
  return QS_QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
}

export function getQSGlobalLevel(total: number): string {
  const max = 90
  const pct = total / max
  if (pct >= 0.85) return 'EXCELLENT'
  if (pct >= 0.70) return 'TRÈS BON'
  if (pct >= 0.55) return 'BON'
  if (pct >= 0.40) return 'EN DÉVELOPPEMENT'
  return 'À RENFORCER'
}
