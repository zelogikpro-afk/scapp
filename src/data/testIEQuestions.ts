export type IEDimension = 'conscience' | 'maitrise' | 'motivation' | 'empathie' | 'social'

export interface IEQuestion {
  id: number
  dimension: IEDimension
  text: string
}

export interface IELevelContent {
  summary: string       // short text for cover page
  description: string   // full paragraph for detail page
  planTitle: string
  plan: string[]
  exercice: string
}

export interface IEDimensionInfo {
  key: IEDimension
  label: string
  icon: string          // emoji used as icon placeholder
  forte: IELevelContent
  moyenne: IELevelContent
  faible: IELevelContent
}

export const IE_QUESTIONS: IEQuestion[] = [
  // Section 1 : Conscience de Soi
  { id: 1,  dimension: 'conscience', text: "Je suis capable d'identifier clairement les émotions que je ressens à un moment donné." },
  { id: 2,  dimension: 'conscience', text: "Je comprends comment mes émotions influencent mon comportement et mes décisions." },
  { id: 3,  dimension: 'conscience', text: "Je peux facilement reconnaître quand une émotion particulière commence à se manifester (ex : colère, stress)." },
  { id: 4,  dimension: 'conscience', text: "Je prends régulièrement du temps pour réfléchir à mes émotions et à ce qui les provoque." },

  // Section 2 : Maîtrise de Soi
  { id: 5,  dimension: 'maitrise',   text: "Je suis capable de rester calme dans des situations stressantes ou tendues." },
  { id: 6,  dimension: 'maitrise',   text: "Je sais gérer mes émotions négatives (ex : colère, frustration) pour éviter qu'elles n'influencent mes décisions." },
  { id: 7,  dimension: 'maitrise',   text: "Je parviens à me remettre rapidement d'un coup émotionnel ou d'une déception." },
  { id: 8,  dimension: 'maitrise',   text: "Même sous pression, je réussis à garder une attitude positive et à contrôler mes réactions." },

  // Section 3 : Motivation
  { id: 9,  dimension: 'motivation', text: "Je parviens à me motiver facilement pour atteindre mes objectifs, même lorsque je rencontre des obstacles." },
  { id: 10, dimension: 'motivation', text: "Je suis capable de me concentrer sur mes priorités, même lorsque je me sens découragé(e)." },
  { id: 11, dimension: 'motivation', text: "Je me fixe régulièrement des objectifs clairs et je reste engagé(e) dans leur réalisation." },
  { id: 12, dimension: 'motivation', text: "Je tire satisfaction de mes réussites, et cela me motive à accomplir davantage." },

  // Section 4 : Empathie
  { id: 13, dimension: 'empathie',   text: "Je suis capable de reconnaître les émotions des autres, même lorsqu'ils ne les expriment pas verbalement." },
  { id: 14, dimension: 'empathie',   text: "Je prends le temps de comprendre ce que les autres ressentent avant de réagir." },
  { id: 15, dimension: 'empathie',   text: "Je fais preuve d'empathie en cherchant à me mettre à la place des autres avant de prendre une décision." },
  { id: 16, dimension: 'empathie',   text: "Je suis attentif(ve) aux signaux émotionnels dans mes interactions avec les autres." },

  // Section 5 : Compétences Sociales
  { id: 17, dimension: 'social',     text: "Je parviens à maintenir des relations harmonieuses, même avec des personnes difficiles ou émotionnellement réactives." },
  { id: 18, dimension: 'social',     text: "Je suis capable de résoudre les conflits de manière constructive en prenant en compte les émotions des autres." },
  { id: 19, dimension: 'social',     text: "Je sais adapter ma communication en fonction de l'état émotionnel des personnes avec qui je parle." },
  { id: 20, dimension: 'social',     text: "Je suis capable de créer un climat de confiance dans mes interactions avec les autres." },
]

export const IE_DIMENSIONS: IEDimensionInfo[] = [
  {
    key: 'conscience',
    label: 'Conscience de Soi',
    icon: '🧠',
    forte: {
      summary: "Vous avez une très bonne capacité à identifier vos émotions et à comprendre leur influence sur vos décisions. Vous percevez clairement ce que vous ressentez et savez reconnaître les émotions dès qu'elles apparaissent, ce qui constitue une base solide pour votre équilibre personnel.",
      description: "Votre conscience émotionnelle est un atout majeur. Vous identifiez clairement vos émotions, comprenez leur origine et mesurez leur impact sur vos comportements et décisions. Cette lucidité intérieure vous permet d'agir avec alignement et authenticité dans vos interactions quotidiennes.",
      planTitle: "Exploiter et approfondir votre conscience de soi",
      plan: [
        "Méditation et introspection quotidienne : Continuez à pratiquer la pleine conscience pour renforcer votre compréhension des émotions dans divers contextes.",
        "Journal des émotions : Notez régulièrement vos émotions, les situations qui les provoquent et vos actions en réponse pour affiner votre lecture intérieure.",
        "Partager votre clarté : Intégrez votre capacité à reconnaître vos émotions pour rester présent et aligné dans vos interactions professionnelles et personnelles.",
      ],
      exercice: "Visualisation émotionnelle : Avant une situation potentiellement stressante, prenez quelques minutes pour visualiser comment vous vous sentirez et reconnaître les déclencheurs émotionnels avant qu'ils ne se produisent.",
    },
    moyenne: {
      summary: "Vous avez une bonne connaissance de vos émotions, mais il vous arrive de ne pas toujours les reconnaître à temps ou d'en comprendre pleinement les effets sur vos décisions. Avec un peu plus de pratique, vous développerez une lecture émotionnelle encore plus précise.",
      description: "Vous possédez une compréhension raisonnable de vos émotions, mais cette conscience reste parfois superficielle ou tardive. Certaines émotions vous surprennent encore ou influencent vos décisions avant que vous ne les identifiiez clairement. Un travail régulier d'introspection vous permettra de gagner en clarté et en réactivité émotionnelle.",
      planTitle: "Développer et affiner votre conscience émotionnelle",
      plan: [
        "Pause émotionnelle quotidienne : Prenez 5 à 10 minutes chaque soir pour identifier les émotions ressenties dans la journée et les situations associées.",
        "Nommer vos émotions : Entraînez-vous à donner un nom précis à chaque émotion ressentie (frustration, déception, enthousiasme…) plutôt que de rester dans le vague.",
        "Méditation guidée : Utilisez des applications ou des vidéos de méditation pour améliorer votre écoute intérieure au quotidien.",
      ],
      exercice: "Journal émotionnel : Notez chaque jour trois émotions principales ressenties et les situations qui les ont déclenchées. Faites le lien entre ces émotions et vos comportements pour progresser en conscience.",
    },
    faible: {
      summary: "Vous avez des difficultés à identifier clairement vos émotions ou à comprendre leur influence sur vos décisions. Il est important de travailler sur cette dimension pour mieux vous connaître et améliorer votre équilibre émotionnel.",
      description: "Votre conscience émotionnelle est un axe de développement prioritaire. Il vous est souvent difficile d'identifier avec précision ce que vous ressentez, et encore plus de comprendre comment ces émotions guident ou perturbent vos décisions. Cette méconnaissance de soi peut générer de l'inconfort, des réactions disproportionnées ou des difficultés relationnelles. Avec de la pratique et de la patience, cette compétence peut se développer significativement.",
      planTitle: "Construire votre conscience émotionnelle pas à pas",
      plan: [
        "Développer l'autoréflexion : Prenez 10 minutes chaque soir pour réfléchir aux émotions ressenties dans la journée. Quels événements les ont déclenchées et comment avez-vous réagi ?",
        "Demander des retours externes : Demandez à des proches ou collègues de vous aider à percevoir vos réactions émotionnelles dans certaines situations.",
        "Méditation guidée pour débutants : Commencez par des séances courtes (5 minutes) pour apprendre à observer vos états intérieurs sans les juger.",
      ],
      exercice: "Journal émotionnel débutant : Notez chaque jour une seule émotion marquante, la situation qui l'a provoquée et votre réaction. Commencez simple, la régularité est plus importante que la profondeur.",
    },
  },
  {
    key: 'maitrise',
    label: 'Maîtrise de Soi',
    icon: '⚖️',
    forte: {
      summary: "Vous avez une excellente capacité à gérer vos émotions dans des situations stressantes. Vous parvenez à rester calme, à réguler vos réactions et à maintenir une attitude positive même sous pression.",
      description: "Votre maîtrise émotionnelle est un atout précieux. Vous savez rester stable face aux situations difficiles, gérer la pression sans laisser vos émotions prendre le dessus, et vous remettre rapidement après un choc émotionnel. Cette régulation vous permet d'agir avec discernement et de prendre des décisions de qualité même dans l'adversité.",
      planTitle: "Renforcer et transmettre votre maîtrise émotionnelle",
      plan: [
        "Renforcement par le défi : Exposez-vous délibérément à des situations légèrement stressantes pour tester et consolider votre contrôle émotionnel.",
        "Pratique régulière de la pleine conscience : Maintenez une routine de méditation ou de respiration pour préserver votre équilibre intérieur.",
        "Transmission de compétences : Aidez les personnes autour de vous à développer leur régulation émotionnelle en partageant vos techniques.",
      ],
      exercice: "Mindfulness express : Pratiquez 2 à 3 minutes de respiration consciente avant chaque réunion ou situation potentiellement stressante. Cette habitude simple renforce durablement votre contrôle.",
    },
    moyenne: {
      summary: "Vous gérez généralement bien vos émotions, mais dans certaines situations de forte pression, vos réactions émotionnelles peuvent prendre le dessus. Avec quelques techniques supplémentaires, vous renforcerez votre stabilité émotionnelle.",
      description: "Votre régulation émotionnelle est présente dans la plupart des situations, mais elle montre ses limites face à un stress intense ou à des émotions particulièrement fortes. Il vous arrive de réagir de façon plus impulsive que vous ne le souhaiteriez, ou de mettre du temps à récupérer après un choc émotionnel. Développer des techniques de régulation complémentaires vous aidera à maintenir votre calme dans toutes les circonstances.",
      planTitle: "Consolider votre régulation émotionnelle",
      plan: [
        "Techniques de régulation du stress : Intégrez la respiration profonde ou la cohérence cardiaque dans votre routine quotidienne pour gérer les émotions difficiles.",
        "L'art de la pause : Entraînez-vous à vous accorder quelques secondes de recul avant de réagir à une situation émotionnelle intense.",
        "Suivi émotionnel : Identifiez vos déclencheurs émotionnels récurrents pour mieux les anticiper et préparer une réponse adaptée.",
      ],
      exercice: "Exercice STOP : Lorsqu'une émotion forte surgit, appliquez la technique STOP — Stoppez, Observez, Prenez du recul, Procédez avec intention. Pratiquez-la au quotidien.",
    },
    faible: {
      summary: "Votre gestion émotionnelle est difficile dans les situations de stress ou de pression. Les émotions négatives peuvent rapidement influencer vos réactions et votre état intérieur, même si vous possédez les ressources nécessaires pour progresser sur cet aspect.",
      description: "La régulation de vos émotions représente un défi important pour vous. Dans les situations de pression ou de conflit, vos émotions peuvent prendre le dessus et influencer vos décisions ou vos relations. Il vous est parfois difficile de récupérer rapidement après un choc émotionnel ou de maintenir une attitude constructive face à la frustration. Ce travail demande de la pratique, mais les progrès sont durables et transformateurs.",
      planTitle: "Développer votre régulation émotionnelle étape par étape",
      plan: [
        "Respiration consciente : Commencez chaque journée par 5 minutes de respiration profonde (inspiration 4 sec, rétention 4 sec, expiration 6 sec) pour ancrer votre calme intérieur.",
        "Réagir en pause : Avant de répondre à une situation émotionnellement chargée, comptez jusqu'à 10 mentalement. Cette micro-pause peut changer radicalement la qualité de votre réaction.",
        "Formation en gestion du stress : Participez à des ateliers ou des formations sur la gestion des émotions et la résolution de conflits.",
      ],
      exercice: "Respiration 4-4-6 : Lorsque vous ressentez une émotion forte (colère, stress, anxiété), inspirez pendant 4 secondes, retenez 4 secondes, puis expirez lentement pendant 6 secondes. Répétez 5 fois pour retrouver votre calme.",
    },
  },
  {
    key: 'motivation',
    label: 'Motivation',
    icon: '🎯',
    forte: {
      summary: "Vous avez une forte capacité à vous motiver et à maintenir votre engagement vers vos objectifs, même lorsque vous rencontrez des obstacles. Votre persévérance est un moteur puissant de réussite.",
      description: "Votre motivation intrinsèque est un pilier de votre succès. Vous savez vous fixer des objectifs clairs, maintenir votre engagement dans la durée et puiser dans vos réussites passées l'énergie pour aller de l'avant. Cette énergie naturelle est contagieuse et vous positionne comme une source d'inspiration pour votre entourage.",
      planTitle: "Amplifier et partager votre force de motivation",
      plan: [
        "Objectifs plus ambitieux : Relevez votre niveau d'exigence en vous fixant des défis plus grands qui stimuleront encore davantage votre motivation naturelle.",
        "Partager votre énergie : Motivez les autres autour de vous en partageant vos stratégies de persévérance et votre vision positive face aux obstacles.",
        "Célébration des réussites : Prenez le temps de reconnaître et célébrer chaque étape franchie pour maintenir un cycle positif de motivation.",
      ],
      exercice: "Objectifs SMART mensuels : Définissez chaque mois un objectif Spécifique, Mesurable, Atteignable, Réaliste et Temporel. Notez vos progrès chaque semaine pour rester motivé(e) et ajuster votre cap si nécessaire.",
    },
    moyenne: {
      summary: "Vous avez une motivation correcte mais elle peut fluctuer, notamment face aux obstacles ou aux périodes de découragement. Avec des stratégies adaptées, vous pourrez maintenir un niveau d'engagement plus constant.",
      description: "Votre motivation est présente mais irrégulière. Vous êtes capable de vous engager dans vos projets et de maintenir le cap la plupart du temps, mais certaines périodes de doute ou de découragement peuvent freiner votre élan. Développer des routines motivationnelles solides vous aidera à traverser ces moments difficiles avec plus de ressources.",
      planTitle: "Stabiliser et renforcer votre motivation",
      plan: [
        "Décomposer les objectifs : Transformez vos grands objectifs en petites actions concrètes réalisables à court terme pour maintenir un sentiment constant de progression.",
        "Suivi de progression : Utilisez un tableau ou une application pour visualiser vos avancées — voir le chemin parcouru est un puissant catalyseur de motivation.",
        "Routine motivationnelle : Commencez chaque journée par une affirmation positive ou une revue de vos objectifs pour ancrer votre intention.",
      ],
      exercice: "Visualisation des succès : Chaque matin, prenez 3 minutes pour visualiser un objectif atteint. Ressentez la satisfaction, la fierté, la joie. Cette pratique active votre motivation profonde pour la journée.",
    },
    faible: {
      summary: "Votre motivation est actuellement fragile. Les périodes de découragement peuvent avoir un impact important sur votre engagement, votre concentration et votre capacité à vous projeter dans des objectifs clairs.",
      description: "La motivation représente un vrai défi pour vous en ce moment. Les obstacles ou les échecs peuvent rapidement entamer votre élan, et il vous est difficile de maintenir un niveau d'engagement constant dans la durée. Cette fragilité motivationnelle peut affecter votre productivité et votre bien-être. Mais la motivation est une compétence qui se construit — avec les bonnes stratégies, vous pouvez transformer cette dimension profondément.",
      planTitle: "Construire une motivation durable et solide",
      plan: [
        "Commencer petit : Fixez-vous des micro-objectifs quotidiens très accessibles pour retrouver le sentiment de progression et de compétence.",
        "Identifier vos sources de sens : Réfléchissez à ce qui vous tient vraiment à cœur — la motivation suit toujours le sens. Connectez vos actions à vos valeurs profondes.",
        "Renforcement positif : Récompensez-vous après chaque petite réussite pour créer un cycle positif de motivation et de satisfaction.",
      ],
      exercice: "Le journal des victoires : Notez chaque soir au moins une chose que vous avez accomplie dans la journée, aussi petite soit-elle. La régularité de cette pratique reconstruit progressivement votre confiance et votre motivation.",
    },
  },
  {
    key: 'empathie',
    label: 'Empathie',
    icon: '🤝',
    forte: {
      summary: "Votre empathie est fortement développée. Vous comprenez facilement les émotions des autres, même lorsqu'elles ne sont pas exprimées verbalement, et vous savez ajuster votre communication avec sensibilité et justesse.",
      description: "Votre capacité empathique est un véritable don relationnel. Vous captez finement les états émotionnels de votre entourage, anticipez leurs besoins et adaptez instinctivement votre communication. Cette intelligence relationnelle vous permet de créer des liens profonds et de générer un sentiment de sécurité chez les personnes avec qui vous interagissez.",
      planTitle: "Approfondir et valoriser votre empathie",
      plan: [
        "Approfondir l'écoute active : Lors de vos conversations, concentrez-vous pleinement sur l'autre, sans préparer votre réponse pendant qu'il parle.",
        "Pratiquer l'empathie proactive : Anticipez les besoins émotionnels des autres avant qu'ils ne les expriment pour renforcer encore votre connexion relationnelle.",
        "Protéger votre énergie émotionnelle : Une empathie forte peut être épuisante. Apprenez à poser des limites saines pour ne pas absorber les émotions des autres au détriment de votre bien-être.",
      ],
      exercice: "Miroir émotionnel : Dans vos prochaines interactions, pratiquez la technique du miroir en reflétant les émotions de votre interlocuteur : « Je sens que tu traverses quelque chose de difficile… » Observez l'impact sur la qualité de la relation.",
    },
    moyenne: {
      summary: "Vous avez une bonne capacité à reconnaître les émotions des autres, mais cette compréhension peut parfois rester superficielle ou tardive. Avec un peu plus de pratique, vous développerez une empathie encore plus fine et naturelle.",
      description: "Votre empathie est présente et sincère, mais elle gagnerait en profondeur et en constance. Vous comprenez généralement ce que les autres ressentent, mais certains signaux émotionnels subtils vous échappent parfois. Il vous arrive également de réagir avant d'avoir pleinement mesuré l'état émotionnel de votre interlocuteur. Des exercices réguliers d'écoute active vous aideront à affiner cette compétence.",
      planTitle: "Développer une empathie plus fine et constante",
      plan: [
        "Écoute active renforcée : Entraînez-vous à écouter sans interrompre et à reformuler ce que l'autre a dit avant de répondre.",
        "Questions ouvertes : Remplacez les questions fermées (oui/non) par des questions qui invitent l'autre à approfondir son ressenti.",
        "Observer le non-verbal : Prêtez attention aux gestes, expressions du visage et ton de voix — ils transmettent souvent plus que les mots.",
      ],
      exercice: "La technique du reflet : Dans vos 3 prochaines conversations importantes, pratiquez la reformulation : « Si je comprends bien, tu ressens… » Observez comment cette simple pratique transforme la qualité du dialogue.",
    },
    faible: {
      summary: "Vous avez des difficultés à reconnaître les émotions des autres ou à comprendre leur point de vue avant de réagir. Travailler sur l'empathie vous aidera à créer des relations plus profondes et plus harmonieuses.",
      description: "L'empathie est un axe de développement important pour vous. Il vous est souvent difficile de percevoir les émotions de votre entourage, notamment celles qui ne sont pas exprimées explicitement. Cette difficulté peut parfois créer des malentendus relationnels ou donner une impression de froideur ou d'indifférence que vous ne ressentez pas forcément. L'empathie s'apprend et se développe — avec de la pratique et de l'intention, vous pouvez transformer profondément vos relations.",
      planTitle: "Cultiver votre empathie au quotidien",
      plan: [
        "Exercices d'écoute active : Lors de chaque conversation, mettez-vous en mode 'écoute totale' — ne pensez pas à ce que vous allez répondre, concentrez-vous uniquement sur l'autre.",
        "Journal d'empathie : Après chaque interaction importante, notez ce que vous avez perçu des émotions de l'autre et réfléchissez à ce que vous auriez pu faire différemment.",
        "Observer le langage corporel : Faites attention aux gestes, expressions faciales et ton de voix — ces signaux révèlent souvent ce que les mots cachent.",
      ],
      exercice: "Le défi de la semaine : Dans toutes vos interactions cette semaine, posez au moins une question ouverte du type « Comment tu vis ça ? » ou « Qu'est-ce que tu ressens par rapport à cette situation ? » et écoutez vraiment la réponse.",
    },
  },
  {
    key: 'social',
    label: 'Compétences Sociales',
    icon: '🌐',
    forte: {
      summary: "Vous excellez dans les relations interpersonnelles et la gestion des conflits. Vous savez créer un climat de confiance, adapter votre communication et maintenir des relations harmonieuses même dans les situations difficiles.",
      description: "Vos compétences sociales sont remarquables. Vous savez créer des environnements relationnels sains, résoudre les conflits avec tact et adapter votre communication à chaque interlocuteur. Votre capacité à inspirer confiance et à fédérer les personnes autour d'un objectif commun est un atout majeur tant dans votre vie professionnelle que personnelle.",
      planTitle: "Valoriser et amplifier vos compétences relationnelles",
      plan: [
        "Leadership relationnel : Utilisez vos compétences sociales pour inspirer et motiver votre entourage, en particulier dans les situations de changement ou de tension.",
        "Médiation de conflits : Proposez-vous naturellement comme médiateur dans les situations conflictuelles pour mettre à profit votre talent relationnel.",
        "Transmission de compétences : Partagez vos savoir-faire relationnels avec les personnes qui en ont besoin — enseignez l'écoute, la communication bienveillante, la résolution de conflits.",
      ],
      exercice: "Défi de leadership : Cette semaine, prenez l'initiative de résoudre une tension relationnelle ou de rassembler un groupe autour d'un objectif commun. Observez l'impact de votre présence et de votre facilitation.",
    },
    moyenne: {
      summary: "Vos compétences relationnelles sont contrastées. Vous savez créer un climat de confiance et adapter votre communication, mais certaines situations relationnelles complexes peuvent générer de la tension ou un sentiment de difficulté.",
      description: "Vos compétences sociales sont présentes et fonctionnelles dans la plupart des contextes, mais elles montrent leurs limites dans les situations relationnelles complexes — conflits ouverts, personnalités très différentes de la vôtre, ou contextes de forte tension émotionnelle. En développant des outils complémentaires de communication et de gestion des conflits, vous renforcerez la qualité et la durabilité de vos relations.",
      planTitle: "Enrichir vos compétences relationnelles",
      plan: [
        "Communication non-violente (CNV) : Apprenez les bases de la CNV pour exprimer vos besoins et accueillir ceux des autres sans générer de tension.",
        "Gestion des personnalités difficiles : Informez-vous sur les différents styles relationnels pour adapter plus efficacement votre approche à chaque personne.",
        "Développer la confiance : Soyez cohérent(e) entre vos paroles et vos actes — la confiance se construit dans la durée par la fiabilité et l'authenticité.",
      ],
      exercice: "Exercice de reformulation : Dans vos 3 prochaines conversations conflictuelles, avant de répondre, reformulez la position de l'autre : « Si je t'entends bien, ce que tu veux dire c'est… » Observez comment cette technique désamorce les tensions.",
    },
    faible: {
      summary: "Vous rencontrez des difficultés dans la gestion des relations interpersonnelles. Il vous est parfois difficile de maintenir des relations harmonieuses ou de résoudre les conflits de façon constructive.",
      description: "Les compétences sociales sont un axe de développement prioritaire pour vous. Il vous est difficile de maintenir des relations harmonieuses sur la durée, et les situations de conflit peuvent générer beaucoup d'inconfort ou de tensions. La communication avec des personnes très différentes de vous peut également représenter un défi. Ces compétences s'acquièrent progressivement — avec de la persévérance et les bonnes méthodes, vous pouvez transformer profondément la qualité de vos relations.",
      planTitle: "Développer vos compétences relationnelles progressivement",
      plan: [
        "Commencer par écouter : Faites de l'écoute votre priorité relationnelle numéro un. La capacité à se sentir entendu est la fondation de toute relation de qualité.",
        "Formation en communication : Participez à des ateliers de communication bienveillante ou de gestion des conflits pour acquérir des outils concrets.",
        "Réseau de soutien : Identifiez des personnes dans votre entourage avec de fortes compétences sociales dont vous pouvez vous inspirer et auprès de qui vous pouvez apprendre.",
      ],
      exercice: "Le contrat de 21 jours : Pendant 21 jours, dans chaque interaction, posez-vous la question : « Est-ce que j'écoute pour comprendre ou pour répondre ? » Ce simple changement de posture peut transformer radicalement la qualité de vos relations.",
    },
  },
]

export const SECTION_ORDER: IEDimension[] = ['conscience', 'maitrise', 'motivation', 'empathie', 'social']

export type IELevel = 'forte' | 'moyenne' | 'faible'

export function getIELevel(score: number): IELevel {
  if (score >= 13) return 'forte'
  if (score >= 9)  return 'moyenne'
  return 'faible'
}

export function getLevelLabel(level: IELevel): string {
  if (level === 'forte')   return 'Compétence forte'
  if (level === 'moyenne') return 'Compétence moyenne'
  return 'Compétence à renforcer'
}

export function getLevelColor(level: IELevel): string {
  if (level === 'forte')   return '#22c55e'
  if (level === 'moyenne') return '#f59e0b'
  return '#ef4444'
}

export function getDimInfo(key: IEDimension) {
  return IE_DIMENSIONS.find(d => d.key === key)!
}

export function getDimContent(key: IEDimension, level: IELevel): IELevelContent {
  return getDimInfo(key)[level]
}
